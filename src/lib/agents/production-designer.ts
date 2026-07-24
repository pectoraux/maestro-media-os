// Agent — Production Designer ("Forge")
// Generates the scene-by-scene production breakdown (B-roll, motion graphics,
// captions, transitions, asset requirements, retention notes) from the script.

import { db } from "@/lib/db";
import type { AgentType, ProductionSceneRecord } from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, setProjectStage, type AgentCtx } from "./_helpers";
import { generateProductionScenes } from "@/lib/intelligence/production-designer";

const AGENT: AgentType = "production_designer";

export async function runProductionDesigner(ctx: AgentCtx): Promise<{ scenes: ProductionSceneRecord[] }> {
  return withRun(AGENT, ctx, async () => {
    const projectId = ctx.projectId;
    if (!projectId) throw new Error("projectId is required for production_designer");
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        trifecta: true,
        scripts: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!project) throw new Error("Project not found");
    if (!project.trifecta) {
      throw new Error("No Holy Trifecta found — run hook_engineer first");
    }

    const finalScript =
      project.scripts.find((s) => s.stage === "final") ??
      project.scripts.find((s) => s.stage === "draft");
    if (!finalScript) throw new Error("No script found — run script_writer first");

    const scenes = await generateProductionScenes({
      projectId,
      scriptContent: finalScript.content,
      trifectaTitle: project.trifecta.title,
      niche: project.niche,
    });

    // Idempotent approval gate at "blueprint" (if not already pending).
    await ensureApprovalGate({
      projectId,
      stage: "blueprint",
      agentType: AGENT,
      payload: {
        title: "Production Blueprint",
        summary: `${scenes.length} scenes covering the full video. Each scene includes B-roll, motion graphics, editor instructions, captions, transitions, asset requirements and retention notes.`,
        highlights: scenes.slice(0, 4).map((s) => `Scene ${s.sceneNumber}: ${s.timecode} — ${s.section}`),
        artifacts: [
          { label: "Scenes", value: String(scenes.length) },
          { label: "Total duration", value: "~14:00" },
          { label: "First section", value: scenes[0]?.section ?? "—" },
          { label: "Last section", value: scenes[scenes.length - 1]?.section ?? "—" },
        ],
      },
    });

    await setProjectStage(projectId, "blueprint");

    await logActivity({
      projectId,
      type: "agent",
      message: `Production Designer (Forge) generated ${scenes.length} scenes with full editor instructions`,
      meta: {
        agent: AGENT,
        sceneCount: scenes.length,
        sections: scenes.map((s) => s.section),
      },
    });

    return { scenes };
  });
}
