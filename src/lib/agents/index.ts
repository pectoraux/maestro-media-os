// Barrel + dispatcher for all 12 Maestro agents.

import type { AgentType, RunAgentResponse } from "@/lib/types";
import { AGENT_MAP } from "@/lib/agents-registry";
import { db } from "@/lib/db";
import type { AgentCtx } from "./_helpers";
import { recordRun } from "./_helpers";
import { runOpportunityHunter } from "./opportunity-hunter";
import { runResearchAnalyst } from "./research-analyst";
import { runStoryArchitect } from "./story-architect";
import { runScriptWriter } from "./script-writer";
import { runFactChecker } from "./fact-checker";
import { runHookEngineer } from "./hook-engineer";
import { runThumbnailDirector } from "./thumbnail-director";
import { runSeoSpecialist } from "./seo-specialist";
import { runPublishingManager } from "./publishing-manager";
import { runAnalyticsScientist } from "./analytics-scientist";
import { runKnowledgeCurator } from "./knowledge-curator";
import { runChiefDirector } from "./chief-director";

export { runOpportunityHunter, runResearchAnalyst, runStoryArchitect, runScriptWriter, runFactChecker, runHookEngineer, runThumbnailDirector, runSeoSpecialist, runPublishingManager, runAnalyticsScientist, runKnowledgeCurator, runChiefDirector };

// Dispatcher: maps an AgentType + ctx to the right agent function, returning a RunAgentResponse.
// Special inputs:
//   - story_architect: ctx.input.stage must be "outline" | "expanded" (default "outline")
//   - script_writer:   ctx.input.stage must be "draft" | "final" (default "draft")
//   - chief_director:  ctx.input.action must be "interview_questions" | "advance" | "generate_assets" (default "advance")
//   - publishing_manager: ctx.input.publishAt optional ISO string
//   - analytics_scientist: ctx.input.metrics optional override
//   - opportunity_hunter: ctx.input.niche optional string (default "AI infrastructure")
export async function dispatchAgent(
  agentType: AgentType,
  ctx: AgentCtx,
): Promise<RunAgentResponse> {
  if (!AGENT_MAP[agentType]) {
    throw new Error(`Unknown agent type: ${agentType}`);
  }
  const started = Date.now();
  try {
    let output: unknown;
    switch (agentType) {
      case "opportunity_hunter":
        output = await runOpportunityHunter(ctx);
        break;
      case "research_analyst":
        output = await runResearchAnalyst(ctx);
        break;
      case "story_architect": {
        const stage = ((ctx.input?.stage as string) ?? "outline") as "outline" | "expanded";
        if (stage !== "outline" && stage !== "expanded") {
          throw new Error(`Invalid stage for story_architect: "${stage}" — must be "outline" or "expanded"`);
        }
        output = await runStoryArchitect({ ...ctx, stage });
        break;
      }
      case "script_writer": {
        const stage = ((ctx.input?.stage as string) ?? "draft") as "draft" | "final";
        if (stage !== "draft" && stage !== "final") {
          throw new Error(`Invalid stage for script_writer: "${stage}" — must be "draft" or "final"`);
        }
        output = await runScriptWriter({ ...ctx, stage });
        break;
      }
      case "fact_checker":
        output = await runFactChecker(ctx);
        break;
      case "hook_engineer":
        output = await runHookEngineer(ctx);
        break;
      case "thumbnail_director":
        output = await runThumbnailDirector(ctx);
        break;
      case "seo_specialist":
        output = await runSeoSpecialist(ctx);
        break;
      case "publishing_manager":
        output = await runPublishingManager(ctx);
        break;
      case "analytics_scientist":
        output = await runAnalyticsScientist(ctx);
        break;
      case "knowledge_curator":
        output = await runKnowledgeCurator(ctx);
        break;
      case "chief_director": {
        const action = ((ctx.input?.action as string) ?? "advance") as "interview_questions" | "advance" | "generate_assets";
        output = await runChiefDirector({ ...ctx, action });
        break;
      }
      default:
        throw new Error(`Agent type "${agentType}" is not dispatchable`);
    }

    // Find the most recent AgentRun for this project+agentType (it was created by withRun)
    const run = await db.agentRun.findFirst({
      where: { agentType, projectId: ctx.projectId ?? null },
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    return {
      runId: run?.id ?? "unknown",
      agentType,
      status: "succeeded",
      output,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    const message = (err as Error)?.message ?? String(err);
    // Capture a failed run if withRun didn't already (e.g., invalid input threw before withRun)
    const run = await db.agentRun.findFirst({
      where: { agentType, projectId: ctx.projectId ?? null, status: "failed" },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    if (!run) {
      await recordRun({
        agentType,
        projectId: ctx.projectId,
        input: ctx.input,
        output: { error: message },
        status: "failed",
        durationMs: Date.now() - started,
        error: message,
      });
    }
    return {
      runId: run?.id ?? "unknown",
      agentType,
      status: "failed",
      output: null,
      durationMs: Date.now() - started,
      error: message,
    };
  }
}
