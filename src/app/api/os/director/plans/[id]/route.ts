import { approvePlan, getPlan } from "@/lib/os/director";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const plan = await getPlan(id);
    if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });
    return Response.json({ plan });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const plan = await approvePlan(id);
    return Response.json({ plan });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
