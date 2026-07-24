// Agent 1 — Opportunity Hunter ("Atlas")
// Real intelligence engine: gathers YouTube/Trends/Reddit/News signals,
// persists them, classifies momentum, computes an advanced 6-factor score,
// and creates the Project + Opportunity + approval gate.

import { db } from "@/lib/db";
import { jstr, jparseArr } from "@/lib/json";
import type {
  AgentType,
  OpportunityRecord,
  AdvancedScoreBreakdown,
  TrendSignalRecord,
} from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, type AgentCtx } from "./_helpers";
import {
  gatherAllSignals,
  persistSignals,
  classifyMomentum,
  computeAdvancedScore,
  generateScanSummary,
} from "@/lib/intelligence/opportunity-engine";

const AGENT: AgentType = "opportunity_hunter";

export async function runOpportunityHunter(ctx: AgentCtx): Promise<{
  opportunity: OpportunityRecord;
  signals: TrendSignalRecord[];
  advancedScore: AdvancedScoreBreakdown;
  overallScore: number;
  summary: string;
  dataSources: { source: string; count: number; freshness: string }[];
}> {
  return withRun(AGENT, ctx, async () => {
    const niche = (ctx.input?.niche as string) || "AI infrastructure";

    // 1. Gather real signals across all sources in parallel.
    const raw = await gatherAllSignals(niche);

    // 2. Create the project FIRST so we can attach signals to it.
    const project = await db.project.create({
      data: {
        title: `Opportunity: ${niche}`,
        niche,
        status: "discovery",
        stage: "opportunity",
        brief: `Real-time intelligence scan for "${niche}".`,
      },
    });

    // 3. Persist signals with the projectId.
    const [ytRecs, trendsRecs, redditRecs, newsRecs] = await Promise.all([
      persistSignals(niche, raw.youtube, project.id),
      persistSignals(niche, raw.trends, project.id),
      persistSignals(niche, raw.reddit, project.id),
      persistSignals(niche, raw.news, project.id),
    ]);
    const signals = [...ytRecs, ...trendsRecs, ...redditRecs, ...newsRecs];

    // 4. Classify momentum on persisted signals (LLM).
    await classifyMomentum(signals);

    // Re-read the signals to get the momentum field populated (classifyMomentum mutates in-memory but persists to DB; refetch for safety).
    const refreshed = await db.trendSignal.findMany({
      where: { projectId: project.id },
      orderBy: { capturedAt: "desc" },
    });
    const classifiedSignals: TrendSignalRecord[] = refreshed.map((t) => ({
      id: t.id,
      projectId: t.projectId,
      niche: t.niche,
      source: t.source as TrendSignalRecord["source"],
      title: t.title,
      url: t.url,
      snippet: t.snippet,
      metric: t.metric,
      metricValue: t.metricValue,
      momentum: (t.momentum as TrendSignalRecord["momentum"]) ?? null,
      capturedAt: t.capturedAt.toISOString(),
    }));

    // 5. Load creator expertise for alignment scoring.
    const profile = await db.creatorProfile.findFirst();
    const expertise = jparseArr<{ area: string; depth: string }>(profile?.expertise);

    // 6. Compute the advanced 6-factor score.
    const scoreResult = await computeAdvancedScore(
      {
        youtubeSignals: raw.youtube,
        trendsSignals: raw.trends,
        redditSignals: raw.reddit,
        newsSignals: raw.news,
        creatorExpertise: expertise,
        niche,
      },
      classifiedSignals,
    );

    // 7. Generate the LLM scan summary.
    const summary = await generateScanSummary(niche, scoreResult, {
      youtube: raw.youtube.length,
      trends: raw.trends.length,
      reddit: raw.reddit.length,
      news: raw.news.length,
    });

    const overall = scoreResult.overall;
    const confidence: OpportunityRecord["confidence"] =
      overall >= 80 ? "high" : overall >= 60 ? "medium" : "low";

    // 8. Map raw signals into the legacy opportunity fields.
    const competitors = raw.youtube
      .filter((s) => s.metricValue && s.metricValue > 0)
      .slice(0, 4)
      .map((s) => {
        const channel = (() => {
          try {
            const u = new URL(s.url);
            return u.hostname.replace(/^www\./, "").replace(/^m\./, "");
          } catch {
            return s.url.slice(0, 60);
          }
        })();
        const subs = s.metricValue ? formatCompact(s.metricValue) : "—";
        const gap = inferGap(s.title, s.snippet, niche);
        return { channel, subs, gap };
      });

    const audienceSignals = raw.reddit
      .slice(0, 5)
      .map((s) => s.title.slice(0, 120));

    const trends = raw.trends.slice(0, 4).map((s) => ({
      source: "google_trends",
      signal: s.title.slice(0, 100),
      momentum: ((): "rising" | "peaking" | "stable" => {
        // best-effort momentum guess from snippet language
        const text = (s.snippet || "").toLowerCase();
        if (/breaking|surge|spike|new|launch|funding/.test(text)) return "rising";
        if (/peak|record/.test(text)) return "peaking";
        return "stable";
      })(),
    }));

    const sources = [...raw.youtube, ...raw.trends, ...raw.reddit, ...raw.news]
      .slice(0, 8)
      .map((s) => ({
        name: s.title.slice(0, 100),
        type: s.source === "youtube" ? "youtube" : s.source === "reddit" ? "reddit" : s.source === "news" ? "news" : "blog",
        signal: s.snippet.slice(0, 80),
      }));

    const advanced: AdvancedScoreBreakdown = scoreResult.breakdown;

    // 9. Persist the opportunity row with the advanced breakdown stored as scoreBreakdown.
    const opp = await db.opportunity.create({
      data: {
        projectId: project.id,
        title: `${niche} — Intelligence Scan`,
        niche,
        angle: summary.slice(0, 280),
        opportunityScore: overall,
        scoreBreakdown: jstr(advanced),
        sources: jstr(sources),
        competitors: jstr(competitors),
        audienceSignals: jstr(audienceSignals),
        trends: jstr(trends),
        confidence,
        status: "new",
      },
    });

    // 10. Build the data-sources manifest.
    const dataSources = [
      { source: "youtube", count: raw.youtube.length, freshness: "live" },
      { source: "google_trends", count: raw.trends.length, freshness: "live" },
      { source: "reddit", count: raw.reddit.length, freshness: "live" },
      { source: "news", count: raw.news.length, freshness: "live" },
    ];

    // 11. Approval gate.
    await ensureApprovalGate({
      projectId: project.id,
      stage: "opportunity",
      agentType: AGENT,
      payload: {
        title: `Opportunity scan: ${niche}`,
        summary,
        highlights: [
          `Overall score ${overall}/100 (${confidence})`,
          `Viral velocity ${advanced.viralVelocity}/100`,
          `Search demand ${advanced.searchDemand}/100`,
          `Competition gap ${advanced.competitionGap}/100`,
          `Monetization ${advanced.monetizationPotential}/100`,
          `Expertise alignment ${advanced.expertiseAlignment}/100`,
          `Trend momentum ${advanced.trendMomentum}/100`,
          `${signals.length} signals captured across ${dataSources.length} sources`,
        ],
        artifacts: [
          { label: "Niche", value: niche },
          { label: "Signals", value: String(signals.length) },
          { label: "Data sources", value: dataSources.map((d) => `${d.source}:${d.count}`).join(", ") },
          { label: "Competitors found", value: String(competitors.length) },
        ],
      },
    });

    await logActivity({
      projectId: project.id,
      type: "agent",
      message: `Opportunity Hunter (Atlas) scanned "${niche}" — overall ${overall}/100 (${confidence}). ${signals.length} signals across ${dataSources.length} sources.`,
      meta: {
        agent: AGENT,
        niche,
        overall,
        confidence,
        signalCounts: {
          youtube: raw.youtube.length,
          trends: raw.trends.length,
          reddit: raw.reddit.length,
          news: raw.news.length,
        },
        advanced,
      },
    });

    // 12. Build the opportunity record (preserve the legacy record shape for API compat).
    const record: OpportunityRecord = {
      id: opp.id,
      projectId: project.id,
      title: opp.title,
      niche: opp.niche,
      angle: opp.angle,
      opportunityScore: opp.opportunityScore,
      scoreBreakdown: advanced as unknown as OpportunityRecord["scoreBreakdown"],
      sources,
      competitors,
      audienceSignals,
      trends,
      confidence,
      status: "new",
      createdAt: opp.createdAt.toISOString(),
    };

    return {
      opportunity: record,
      signals: classifiedSignals,
      advancedScore: advanced,
      overallScore: overall,
      summary,
      dataSources,
    };
  });
}

function formatCompact(n: number): string {
  if (n >= 1e6) return `~${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `~${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

function inferGap(title: string, snippet: string, niche: string): string {
  // crude heuristic gap extraction
  const text = `${title} ${snippet}`.toLowerCase();
  if (/tutorial|beginner|guide|explained/.test(text)) return "Surface-level only — depth gap";
  if (/vs|comparison/.test(text)) return "No opinionated take";
  if (/news|announcement/.test(text)) return "No strategic analysis";
  if (/2023|2024|2025/.test(text)) return "Dated framing — needs evergreen angle";
  return `Generic ${niche} framing — unique angle missing`;
}
