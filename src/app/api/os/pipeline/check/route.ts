import { checkPipelineAuthenticity } from "@/lib/os/authenticity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { artifacts, projectId, threshold } = body;
    if (!Array.isArray(artifacts) || artifacts.length === 0) {
      return Response.json({ error: "artifacts array is required" }, { status: 400 });
    }
    const result = await checkPipelineAuthenticity(artifacts, projectId, threshold ?? 70);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
