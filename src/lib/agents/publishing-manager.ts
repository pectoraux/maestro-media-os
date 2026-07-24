// Agent 9 — Publishing Manager ("Caster")
// Real YouTube publishing pipeline: connects a channel, packages the upload
// payload, and triggers the (simulated) publish.

import type { AgentType } from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, setProjectStage, type AgentCtx } from "./_helpers";
import {
  connectChannel,
  packageUploadPayload,
  publishProject,
} from "@/lib/intelligence/youtube-publishing";

const AGENT: AgentType = "publishing_manager";

export async function runPublishingManager(ctx: AgentCtx): Promise<{
  published: boolean;
  scheduledAt: string | null;
  note: string;
  payload: Awaited<ReturnType<typeof packageUploadPayload>>;
}> {
  return withRun(AGENT, ctx, async () => {
    const projectId = ctx.projectId;
    if (!projectId) throw new Error("projectId is required for publishing_manager");

    // 1. If a channel name is provided, connect it.
    const channelName = ctx.input?.connectChannel as string | undefined;
    if (channelName) {
      await connectChannel(channelName);
    }

    // 2. Package the upload payload (also surfaces missing requirements).
    const payload = await packageUploadPayload(projectId);
    if (!payload.ready) {
      throw new Error(
        `Cannot publish yet. Missing: ${payload.missing.join(", ")}. Run the required agents first.`,
      );
    }

    // 3. Publish (or schedule) the project.
    const result = await publishProject(projectId);

    // 4. Build the approval gate at "scheduled".
    await ensureApprovalGate({
      projectId,
      stage: "scheduled",
      agentType: AGENT,
      payload: {
        title: "Publish to YouTube",
        summary: payload.title,
        highlights: [
          `${payload.tags.length} tags`,
          `${payload.chapters.length} chapters`,
          `Pinned comment ready`,
          `Publish at ${payload.publishAt ?? "now"}`,
        ],
        artifacts: [
          { label: "Playlist", value: payload.playlist ?? "—" },
          { label: "Category", value: "Science & Tech" },
          { label: "Title", value: payload.title },
          { label: "Publish at", value: payload.publishAt ?? "now" },
        ],
      },
    });

    // 5. Update project stage + status.
    await setProjectStage(projectId, "scheduled", "publish");

    await logActivity({
      projectId,
      type: "agent",
      message: `Publishing Manager (Caster) packaged upload payload — ${payload.tags.length} tags, ${payload.chapters.length} chapters. ${result.note}`,
      meta: {
        agent: AGENT,
        published: result.published,
        scheduledAt: result.scheduledAt,
        tagsCount: payload.tags.length,
        chaptersCount: payload.chapters.length,
      },
    });

    return {
      published: result.published,
      scheduledAt: result.scheduledAt,
      note: result.note,
      payload,
    };
  });
}
