import { checkConstitution, getOpenViolations } from "@/lib/os/constitution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.content) return Response.json({ error: "content is required" }, { status: 400 });
    const result = await checkConstitution({
      artifactType: body.artifactType ?? "script",
      content: body.content,
      projectId: body.projectId,
      artifactRef: body.artifactRef,
    });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const violations = await getOpenViolations();
    return Response.json({ violations });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
