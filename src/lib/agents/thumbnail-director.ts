// Agent 7 — Thumbnail Director ("Canvas")
// Combines the detailed thumbnail brief (from the trifecta engine) + the
// production scene breakdown (from the production designer) into ONE
// "blueprint" approval gate.

import { db } from "@/lib/db";
import { jparseObj } from "@/lib/json";
import type { AgentType, TrifectaCandidate } from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, setProjectStage, type AgentCtx } from "./_helpers";
import { generateThumbnailBrief } from "@/lib/intelligence/trifecta-engine";
import { generateProductionScenes } from "@/lib/intelligence/production-designer";

const AGENT: AgentType = "thumbnail_director";

export async function runThumbnailDirector(ctx: AgentCtx): Promise<{
  brief: Awaited<ReturnType<typeof generateThumbnailBrief>>;
  scenes: Awaited<ReturnType<typeof generateProductionScenes>>;
}> {
  return withRun(AGENT, ctx, async () => {
    const projectId = ctx.projectId;
    if (!projectId) throw new Error("projectId is required for thumbnail_director");
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        trifecta: true,
        scripts: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!project) throw new Error("Project not found");
    if (!project.trifecta) {
      throw new Error("Run the Holy Trifecta optimizer (hook_engineer) first.");
    }

    // Pull final or fallback draft script.
    const finalScript =
      project.scripts.find((s) => s.stage === "final") ??
      project.scripts.find((s) => s.stage === "draft");
    if (!finalScript) throw new Error("No script found — run script_writer first");

    // Reconstruct the TrifectaCandidate winner from the stored HolyTrifecta.
    const parsed = jparseObj<{
      concept?: string;
      textOverlay?: string;
      focal?: string;
      colorMood?: string;
      emotion?: string;
    }>(project.trifecta.thumbnailStrategy);
    const winner: TrifectaCandidate = reconstructWinner(
      project.trifecta.title,
      parsed.concept ?? "",
      project.trifecta.openingHook,
      project.trifecta.expectationMatch,
    );

    // 1. Generate the thumbnail brief.
    const brief = await generateThumbnailBrief(projectId, winner);

    // 2. Generate the production scenes (scene-by-scene breakdown).
    const scenes = await generateProductionScenes({
      projectId,
      scriptContent: finalScript.content,
      trifectaTitle: project.trifecta.title,
      niche: project.niche,
      targetDurationMin: 14,
    });

    // 3. Single combined approval gate at "blueprint".
    await ensureApprovalGate({
      projectId,
      stage: "blueprint",
      agentType: AGENT,
      payload: {
        title: "Thumbnail brief + Production blueprint",
        summary: brief.concept,
        highlights: [
          `Mobile readability ${brief.mobileReadability}/100`,
          `Text overlay: "${brief.textOverlay?.text ?? ""}"`,
          `${brief.emotionalTriggers?.length ?? 0} emotional triggers`,
          `${brief.aiPrompts?.length ?? 0} AI generation prompts`,
          `${scenes.length} production scenes (B-roll, motion graphics, captions)`,
        ],
        artifacts: [
          { label: "Focal", value: brief.visualLayout?.focalSubject ?? "—" },
          { label: "Mood", value: brief.colorMood?.mood ?? "—" },
          { label: "Scenes", value: String(scenes.length) },
          { label: "AI prompts", value: String(brief.aiPrompts?.length ?? 0) },
        ],
      },
    });

    await setProjectStage(projectId, "blueprint");

    await logActivity({
      projectId,
      type: "agent",
      message: `Thumbnail Director (Canvas) produced brief + ${scenes.length} production scenes — mobile readability ${brief.mobileReadability}/100`,
      meta: {
        agent: AGENT,
        mobileReadability: brief.mobileReadability,
        scenesCount: scenes.length,
        aiPrompts: brief.aiPrompts?.length ?? 0,
      },
    });

    return { brief, scenes };
  });
}

// Parse the stored expectationMatch string into TrifectaCandidate score fields.
// The stored string looks like: "Winner scored X/100. Expectation match Y, curiosity Z, retention W, CTR V."
function reconstructWinner(
  title: string,
  thumbnailConcept: string,
  openingHook: string,
  expectationMatchStr: string,
): TrifectaCandidate {
  const find = (re: RegExp): number => {
    const m = expectationMatchStr.match(re);
    if (!m) return 0;
    const n = Number(m[1]);
    return isFinite(n) ? n : 0;
  };
  const expectationMatch = find(/Expectation match\s*(\d+(?:\.\d+)?)/i) || 60;
  const curiosityGap = find(/Curiosity\s*(\d+(?:\.\d+)?)/i) || 60;
  const retentionPrediction = find(/[Rr]etention\s*(?:pred\s*)?(\d+(?:\.\d+)?)/i) || 55;
  const ctrPrediction = find(/CTR\s*(?:pred\s*)?(\d+(?:\.\d+)?)/i) || 55;
  const compositeScore = find(/scored\s*(\d+(?:\.\d+)?)/i) ||
    Math.round((expectationMatch * 0.3 + curiosityGap * 0.2 + retentionPrediction * 0.25 + ctrPrediction * 0.25) * 10) / 10;

  return {
    title,
    thumbnailConcept,
    openingHook,
    expectationMatch,
    curiosityGap,
    retentionPrediction,
    ctrPrediction,
    compositeScore,
    rationale: "Reconstructed from stored Holy Trifecta.",
  };
}
