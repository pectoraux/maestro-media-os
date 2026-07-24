// Agent 9 — Publishing Manager ("Caster")
// Packages the upload metadata + schedules the publish time.

import { db } from "@/lib/db";
import type { AgentType } from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, type AgentCtx } from "./_helpers";

const AGENT: AgentType = "publishing_manager";

export async function runPublishingManager(ctx: AgentCtx): Promise<{ scheduledAt: string; packaged: true }> {
  return withRun(AGENT, ctx, async () => {
    const projectId = ctx.projectId!;
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { publishMetadata: true, trifecta: true, blueprint: true },
    });
    if (!project) throw new Error("Project not found");
    if (!project.publishMetadata) throw new Error("No publish metadata — run seo_specialist first");

    // publishAt = input.publishAt OR existing OR now + 3 days
    const inputPublishAt = ctx.input?.publishAt as string | undefined;
    let publishAt: Date;
    if (inputPublishAt) {
      publishAt = new Date(inputPublishAt);
    } else if (project.publishMetadata.publishAt) {
      publishAt = project.publishMetadata.publishAt;
    } else {
      publishAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    }

    await db.publishMetadata.update({
      where: { projectId },
      data: { publishAt },
    });

    await db.project.update({
      where: { id: projectId },
      data: { stage: "scheduled", status: "publish" },
    });

    await ensureApprovalGate({
      projectId,
      stage: "scheduled",
      agentType: AGENT,
      payload: {
        title: `Publish Schedule: ${publishAt.toISOString()}`,
        summary: `Video scheduled to publish at ${publishAt.toISOString()}.`,
        highlights: [
          `Title: ${project.trifecta?.title ?? project.title}`,
          `Blueprint: ${project.blueprint ? "ready" : "missing"}`,
          `Publish at: ${publishAt.toISOString()}`,
        ],
        artifacts: [{ label: "PublishAt", value: publishAt.toISOString() }],
      },
    });

    await logActivity({
      projectId,
      type: "agent",
      message: `Publishing Manager scheduled video for ${publishAt.toISOString()}`,
      meta: { agent: AGENT, publishAt: publishAt.toISOString() },
    });

    return { scheduledAt: publishAt.toISOString(), packaged: true as const };
  });
}
