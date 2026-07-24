// /api/youtube/publish
// POST { projectId } → packageUploadPayload + publishProject.

import {
  packageUploadPayload,
  publishProject,
} from "@/lib/intelligence/youtube-publishing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const projectId = body.projectId as string | undefined;
    if (!projectId) {
      return Response.json({ error: "projectId required" }, { status: 400 });
    }

    const payload = await packageUploadPayload(projectId);
    if (!payload.ready) {
      return Response.json(
        { error: `Cannot publish — missing: ${payload.missing.join(", ")}` },
        { status: 400 },
      );
    }

    const result = await publishProject(projectId);

    return Response.json({
      published: result.published,
      scheduledAt: result.scheduledAt,
      note: result.note,
      payload,
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
