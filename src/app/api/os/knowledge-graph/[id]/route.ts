import { getNodeNeighbors } from "@/lib/os/knowledge-graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await getNodeNeighbors(id);
    if (!result.node) return Response.json({ error: "Node not found" }, { status: 404 });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
