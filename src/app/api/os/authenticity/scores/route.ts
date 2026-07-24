import { listScores } from "@/lib/os/authenticity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId") ?? undefined;
    const scores = await listScores(projectId);
    return Response.json({ scores });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
