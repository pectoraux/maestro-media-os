import { createEnvelope, listEnvelopes } from "@/lib/os/artifact-envelope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId") ?? undefined;
    const envelopes = await listEnvelopes(projectId);
    return Response.json({ envelopes });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.content) return Response.json({ error: "content is required" }, { status: 400 });
    const envelope = await createEnvelope({
      artifactType: body.artifactType ?? "script",
      artifactRef: body.artifactRef,
      content: body.content,
      projectId: body.projectId,
      generatedBy: body.generatedBy ?? "creator",
      identityVersion: body.identityVersion,
      modelVersion: body.modelVersion,
      declaredSources: body.declaredSources,
      creatorConfidence: body.creatorConfidence,
    });
    return Response.json(envelope);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
