import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [nodes, edges] = await Promise.all([
      db.knowledgeNode.findMany({ orderBy: { createdAt: "desc" } }),
      db.knowledgeEdge.findMany(),
    ]);

    // Compute connection count per node (both in and out)
    const connCount = new Map<string, number>();
    for (const e of edges) {
      connCount.set(e.sourceId, (connCount.get(e.sourceId) ?? 0) + 1);
      connCount.set(e.targetId, (connCount.get(e.targetId) ?? 0) + 1);
    }

    const grouped: Record<string, number> = {};
    for (const n of nodes) {
      grouped[n.type] = (grouped[n.type] ?? 0) + 1;
    }

    return Response.json({
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        label: n.label,
        content: n.content,
        weight: n.weight,
        projectId: n.projectId,
        createdAt: n.createdAt.toISOString(),
        connections: connCount.get(n.id) ?? 0,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        sourceId: e.sourceId,
        targetId: e.targetId,
        relation: e.relation,
        weight: e.weight,
      })),
      countsByType: grouped,
      totals: { nodes: nodes.length, edges: edges.length },
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
