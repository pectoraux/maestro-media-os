// Agent 1 — Opportunity Hunter ("Atlas")
// Scans the web for high-confidence content opportunities and scores them.

import { db } from "@/lib/db";
import { jstr } from "@/lib/json";
import { webSearch, llmJson } from "@/lib/zai";
import type { AgentType, OpportunityRecord, OpportunityScoreBreakdown } from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, type AgentCtx } from "./_helpers";

const AGENT: AgentType = "opportunity_hunter";

function asArr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

interface LLMOpportunity {
  title: string;
  angle: string;
  niche: string;
  scoreBreakdown: OpportunityScoreBreakdown;
  opportunityScore: number;
  sources: { name: string; type: string; signal: string }[];
  competitors: { channel: string; subs: string; gap: string }[];
  audienceSignals: string[];
  trends: { source: string; signal: string; momentum: string }[];
  rationale: string;
}

const SYSTEM = `You are Atlas, an expert YouTube strategist who scores content opportunities with rigor and skepticism.
You reject hype, scrutinize competition, and only surface opportunities with a real knowledge gap.
You score opportunities across six weighted dimensions (each 0-100):
- searchDemand (weight 0.20): how strong is the search/audience pull?
- competition (weight 0.20, INVERSE — high score = LOW competition / wide gap): how saturated is the field?
- freshness (weight 0.15): is the topic timely or evergreen-renewable?
- audienceFit (weight 0.20): how well does it match a technical/curious audience?
- monetization (weight 0.10): sponsorship, course, product fit?
- knowledgeGap (weight 0.15): is there a real explainer gap not yet covered?
Compute opportunityScore as the weighted average, rounded to 1 decimal.
Return STRICT JSON only — no prose, no markdown fences.`;

export async function runOpportunityHunter(ctx: AgentCtx): Promise<OpportunityRecord> {
  return withRun(AGENT, ctx, async () => {
    const niche = (ctx.input?.niche as string) || "AI infrastructure";

    // Gather 2-3 web searches.
    const [yt, reddit, news] = await Promise.all([
      webSearch(`${niche} youtube trends 2024`, 8),
      webSearch(`${niche} reddit discussion`, 6),
      webSearch(`${niche} news 2024`, 6),
    ]);
    const sources = [...yt, ...reddit, ...news].slice(0, 20).map((s) => ({
      url: s.url,
      name: s.name,
      snippet: s.snippet,
      host: s.host_name,
      date: s.date,
    }));

    const prompt = `Niche: "${niche}"

Search results (most relevant 20):
${JSON.stringify(sources, null, 2)}

Identify the single strongest YouTube content opportunity in this niche.
Return JSON in EXACTLY this shape:
{
  "title": "<video title, 60-80 chars, specific and curiosity-driven>",
  "angle": "<the unique editorial angle, 1-2 sentences>",
  "niche": "${niche}",
  "scoreBreakdown": { "searchDemand": N, "competition": N, "freshness": N, "audienceFit": N, "monetization": N, "knowledgeGap": N },
  "opportunityScore": N,
  "sources": [{ "name": "...", "type": "youtube|reddit|news|blog|docs", "signal": "what it tells us" }, ...3-6 items],
  "competitors": [{ "channel": "...", "subs": "~XXk", "gap": "the weakness or missing piece" }, ...2-4 items],
  "audienceSignals": ["...", ...3-5 items],
  "trends": [{ "source": "...", "signal": "...", "momentum": "rising|peaking|stable" }, ...2-4 items],
  "rationale": "2-3 sentences on why this is the right opportunity NOW."
}`;

    const { data, raw } = await llmJson<LLMOpportunity>(prompt, { system: SYSTEM });
    const llm: LLMOpportunity =
      data ?? {
        title: `The State of ${niche} in 2024`,
        angle: `A grounded explainer on ${niche}.`,
        niche,
        scoreBreakdown: { searchDemand: 60, competition: 55, freshness: 60, audienceFit: 65, monetization: 50, knowledgeGap: 60 },
        opportunityScore: 58,
        sources: sources.slice(0, 4).map((s) => ({ name: s.name, type: "blog", signal: s.snippet.slice(0, 80) })),
        competitors: [],
        audienceSignals: [],
        trends: [],
        rationale: "Fallback opportunity (LLM JSON parse failed).",
      };

    // Persist project + opportunity
    const project = await db.project.create({
      data: {
        title: llm.title,
        niche,
        status: "discovery",
        stage: "opportunity",
        brief: llm.angle,
      },
    });

    const score: OpportunityScoreBreakdown = {
      searchDemand: clampScore(llm.scoreBreakdown?.searchDemand),
      competition: clampScore(llm.scoreBreakdown?.competition),
      freshness: clampScore(llm.scoreBreakdown?.freshness),
      audienceFit: clampScore(llm.scoreBreakdown?.audienceFit),
      monetization: clampScore(llm.scoreBreakdown?.monetization),
      knowledgeGap: clampScore(llm.scoreBreakdown?.knowledgeGap),
    };
    const overall = clampScore(llm.opportunityScore);
    const confidence = overall >= 80 ? "high" : overall >= 60 ? "medium" : "low";

    const opp = await db.opportunity.create({
      data: {
        projectId: project.id,
        title: llm.title,
        niche,
        angle: llm.angle,
        opportunityScore: overall,
        scoreBreakdown: jstr(score),
        sources: jstr(llm.sources ?? []),
        competitors: jstr(llm.competitors ?? []),
        audienceSignals: jstr(llm.audienceSignals ?? []),
        trends: jstr(llm.trends ?? []),
        confidence,
        status: "new",
      },
    });

    await ensureApprovalGate({
      projectId: project.id,
      stage: "opportunity",
      agentType: AGENT,
      payload: {
        title: `Opportunity: ${llm.title}`,
        summary: llm.angle,
        highlights: [
          `Opportunity Score: ${overall}/100 (${confidence})`,
          `Knowledge gap: ${score.knowledgeGap}/100`,
          `Competition gap: ${score.competition}/100`,
          ...(llm.audienceSignals ?? []).slice(0, 2),
        ],
        artifacts: [
          { label: "Niche", value: niche },
          { label: "Angle", value: llm.angle },
          { label: "Rationale", value: llm.rationale ?? "" },
        ],
      },
    });

    await logActivity({
      projectId: project.id,
      type: "agent",
      message: `Opportunity Hunter surfaced "${llm.title}" — score ${overall}/100 (${confidence})`,
      meta: { agent: AGENT, score: overall, confidence, rawLen: raw.length },
    });

    // Decode stored rows into the OpportunityRecord shape (no need to re-fetch).
    const record: OpportunityRecord = {
      id: opp.id,
      projectId: project.id,
      title: opp.title,
      niche: opp.niche,
      angle: opp.angle,
      opportunityScore: opp.opportunityScore,
      scoreBreakdown: score,
      sources: asArr(llm.sources),
      competitors: asArr(llm.competitors),
      audienceSignals: asArr(llm.audienceSignals),
      trends: asArr(llm.trends),
      confidence: confidence as OpportunityRecord["confidence"],
      status: "new",
      createdAt: opp.createdAt.toISOString(),
    };

    return record;
  });
}

function clampScore(n: unknown): number {
  const num = Number(n);
  if (!isFinite(num)) return 50;
  return Math.max(0, Math.min(100, Math.round(num * 10) / 10));
}
