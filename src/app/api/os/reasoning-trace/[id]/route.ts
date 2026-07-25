import { getTrace, addStep } from "@/lib/os/reasoning-trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const trace = await getTrace(id);
    if (!trace) return Response.json({ error: "Trace not found" }, { status: 404 });
    return Response.json({ trace });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const trace = await addStep(id, body);
    return Response.json({ trace });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
