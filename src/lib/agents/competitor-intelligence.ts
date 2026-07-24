// Agent — Competitor Intelligence ("Scout")
// Deep per-video analysis of competing YouTube videos: title/transcript/comments
// via LLM + thumbnail via VLM. Aggregates winning patterns.

import { db } from "@/lib/db";
import type { AgentType, CompetitorVideoRecord } from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, setProjectStage, type AgentCtx } from "./_helpers";
import { analyzeCompetitorsForNiche, aggregateWinningPatterns } from "@/lib/intelligence/competitor-analyzer";

const AGENT: AgentType = "competitor_intelligence";

export async function runCompetitorIntelligence(
  ctx: AgentCtx,
): Promise<{ videos: CompetitorVideoRecord[]; aggregatedPatterns: { pattern: string; frequency: number; applicability: string }[] }> {
  return withRun(AGENT, ctx, async () => {
    const projectId = ctx.projectId;
    if (!projectId) throw new Error("projectId is required for competitor_intelligence");
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error("Project not found");

    const niche = (ctx.input?.niche as string) || project.niche;
    const limit = Number(ctx.input?.limit ?? 4);

    // 1. Run the deep per-video analysis.
    const videos = await analyzeCompetitorsForNiche(niche, projectId, limit);

    // 2. Aggregate winning patterns across all videos.
    const aggregatedPatterns = await aggregateWinningPatterns(videos);

    // 3. Compute summary metrics.
    const avgPerf =
      videos.length > 0
        ? Math.round(
            (videos.reduce((s, v) => s + (v.performanceScore ?? 0), 0) / videos.length) * 10,
          ) / 10
        : 0;
    const topPatterns = aggregatedPatterns.slice(0, 5).map((p) => p.pattern);

    // 4. Approval gate (stage "dossier").
    await ensureApprovalGate({
      projectId,
      stage: "dossier",
      agentType: AGENT,
      payload: {
        title: "Competitor Intelligence Report",
        summary: `Deep analysis of ${videos.length} competing videos in "${niche}". ${aggregatedPatterns.length} winning patterns extracted. Avg performance ${avgPerf}/100.`,
        highlights: [
          `${videos.length} videos analyzed (titles, transcripts, comments, thumbnails)`,
          `${aggregatedPatterns.length} winning patterns aggregated`,
          `Avg performance score ${avgPerf}/100`,
          ...(topPatterns.length > 0 ? [`Top pattern: ${topPatterns[0]}`] : []),
        ],
        artifacts: [
          { label: "Videos analyzed", value: String(videos.length) },
          { label: "Avg performance", value: `${avgPerf}/100` },
          { label: "Winning patterns", value: String(aggregatedPatterns.length) },
          { label: "Top patterns", value: topPatterns.join(" · ") || "—" },
        ],
      },
    });

    // 5. Update project stage.
    await setProjectStage(projectId, "dossier");

    await logActivity({
      projectId,
      type: "agent",
      message: `Competitor Intelligence (Scout) analyzed ${videos.length} videos, extracted ${aggregatedPatterns.length} winning patterns`,
      meta: {
        agent: AGENT,
        niche,
        videosAnalyzed: videos.length,
        patterns: aggregatedPatterns.length,
        avgPerformance: avgPerf,
      },
    });

    return { videos, aggregatedPatterns };
  });
}
