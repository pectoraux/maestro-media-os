import { checkAuthenticity, type ArtifactToCheck } from "@/lib/os/authenticity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const artifact: ArtifactToCheck = {
      type: body.type ?? "script",
      content: body.content ?? "",
      ref: body.ref,
      projectId: body.projectId,
      context: body.context,
    };
    if (!artifact.content) return Response.json({ error: "content is required" }, { status: 400 });
    const threshold = body.threshold ?? 70;
    const result = await checkAuthenticity(artifact, threshold);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
