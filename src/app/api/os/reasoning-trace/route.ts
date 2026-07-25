import { listTraces, startTrace } from "@/lib/os/reasoning-trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId") ?? undefined;
    const traces = await listTraces(projectId);
    return Response.json({ traces });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const trace = await startTrace(body);
    return Response.json({ trace });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
