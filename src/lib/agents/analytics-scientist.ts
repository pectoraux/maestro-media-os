// Agent 10 — Analytics Scientist ("Prism")
// Real learning loop: ingests post-publication metrics (or generates them via
// LLM), extracts lessons, updates the knowledge graph with history + pattern
// + audience_insight nodes.

import type { AgentType } from "@/lib/types";
import { withRun, logActivity, setProjectStage, type AgentCtx } from "./_helpers";
import { runLearningLoop } from "@/lib/intelligence/learning-loop";

const AGENT: AgentType = "analytics_scientist";

export async function runAnalyticsScientist(ctx: AgentCtx): Promise<{
  lessons: string[];
  knowledgeNodesCreated: number;
  metrics: unknown;
}> {
  return withRun(AGENT, ctx, async () => {
    const projectId = ctx.projectId;
    if (!projectId) throw new Error("projectId is required for analytics_scientist");
    const overrides = (ctx.input?.metrics as Record<string, number> | undefined) ?? undefined;

    // Run the real learning loop.
    const result = await runLearningLoop({
      projectId,
      metrics: overrides,
    });

    // Stage "published" is requiresApproval:false — log activity only (no gate).
    await setProjectStage(projectId, "published", "live");

    await logActivity({
      projectId,
      type: "agent",
      message: `Analytics Scientist (Prism) closed the learning loop — ${result.lessons.length} lessons, ${result.knowledgeNodesCreated} knowledge nodes added`,
      meta: {
        agent: AGENT,
        lessons: result.lessons,
        knowledgeNodesCreated: result.knowledgeNodesCreated,
        ctr: (result.metrics as { ctr?: number })?.ctr,
      },
    });

    return {
      lessons: result.lessons,
      knowledgeNodesCreated: result.knowledgeNodesCreated,
      metrics: result.metrics,
    };
  });
}
