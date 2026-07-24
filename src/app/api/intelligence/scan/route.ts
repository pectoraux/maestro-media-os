// POST /api/intelligence/scan
// Runs a FULL intelligence scan: gathers signals + scores + returns (no project).
// This is the "preview scan" before committing to a project.

import { db } from "@/lib/db";
import { jparseArr } from "@/lib/json";
import type { IntelligenceScanResult, TrendSignalRecord } from "@/lib/types";
import {
  gatherAllSignals,
  persistSignals,
  classifyMomentum,
  computeAdvancedScore,
  generateScanSummary,
} from "@/lib/intelligence/opportunity-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const niche = (body.niche as string) || "AI infrastructure";

    // 1. Gather real signals.
    const raw = await gatherAllSignals(niche);

    // 2. Persist signals (no project).
    const [ytRecs, trendsRecs, redditRecs, newsRecs] = await Promise.all([
      persistSignals(niche, raw.youtube),
      persistSignals(niche, raw.trends),
      persistSignals(niche, raw.reddit),
      persistSignals(niche, raw.news),
    ]);
    const signals = [...ytRecs, ...trendsRecs, ...redditRecs, ...newsRecs];

    // 3. Classify momentum.
    await classifyMomentum(signals);

    // Re-read for momentum field.
    const refreshed = await db.trendSignal.findMany({
      where: { niche, projectId: null },
      orderBy: { capturedAt: "desc" },
      take: 60,
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

    // 4. Load creator expertise.
    const profile = await db.creatorProfile.findFirst();
    const expertise = jparseArr<{ area: string; depth: string }>(profile?.expertise);

    // 5. Compute advanced score.
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

    // 6. Generate summary.
    const summary = await generateScanSummary(niche, scoreResult, {
      youtube: raw.youtube.length,
      trends: raw.trends.length,
      reddit: raw.reddit.length,
      news: raw.news.length,
    });

    // 7. Aggregate momentum.
    const momentumCounts: Record<string, number> = {};
    for (const s of classifiedSignals) {
      const m = s.momentum ?? "stable";
      momentumCounts[m] = (momentumCounts[m] ?? 0) + 1;
    }
    const aggregateMomentum = (() => {
      const entries = Object.entries(momentumCounts).sort((a, b) => b[1] - a[1]);
      if (entries.length === 0) return "stable" as const;
      const top = entries[0][0] as "rising" | "peaking" | "stable" | "declining";
      return top;
    })();

    // 8. Build the data sources manifest.
    const dataSources = [
      { source: "youtube", count: raw.youtube.length, freshness: "live" },
      { source: "google_trends", count: raw.trends.length, freshness: "live" },
      { source: "reddit", count: raw.reddit.length, freshness: "live" },
      { source: "news", count: raw.news.length, freshness: "live" },
    ];

    const result: IntelligenceScanResult = {
      niche,
      signals: classifiedSignals,
      competitorVideos: [],
      advancedScore: scoreResult.breakdown,
      overallScore: scoreResult.overall,
      momentum: aggregateMomentum,
      summary,
      dataSources,
    };

    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
