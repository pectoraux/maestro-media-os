import { getEnvelope } from "@/lib/os/artifact-envelope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const envelope = await getEnvelope(id);
    if (!envelope) return Response.json({ error: "Envelope not found" }, { status: 404 });
    return Response.json({ envelope });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
