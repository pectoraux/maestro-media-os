import { checkTrust } from "@/lib/os/trust-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.content) return Response.json({ error: "content is required" }, { status: 400 });
    const result = await checkTrust({
      artifactType: body.artifactType ?? "script",
      content: body.content,
      projectId: body.projectId,
      artifactRef: body.artifactRef,
      declaredSources: body.declaredSources,
      creatorConfidence: body.creatorConfidence,
    });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
