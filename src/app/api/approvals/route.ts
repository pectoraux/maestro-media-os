import { db } from "@/lib/db";
import { jparseObj } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status"); // pending | approved | rejected | revised

    const where = statusFilter ? { status: statusFilter } : {};
    const gates = await db.approvalGate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { project: { select: { title: true, niche: true } } },
    });
    // Sort pending-first (when no status filter applied), then createdAt desc
    const sorted = gates.slice().sort((a, b) => {
      const order = { pending: 0, revised: 1, rejected: 2, approved: 3 };
      const sa = (order as any)[a.status] ?? 9;
      const sb = (order as any)[b.status] ?? 9;
      if (sa !== sb) return sa - sb;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    return Response.json({
      approvals: sorted.map((g) => ({
        id: g.id,
        projectId: g.projectId,
        projectTitle: g.project.title,
        stage: g.stage,
        agentType: g.agentType,
        payload: jparseObj(g.payload),
        status: g.status,
        feedback: g.feedback,
        decidedAt: g.decidedAt?.toISOString() ?? null,
        createdAt: g.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
