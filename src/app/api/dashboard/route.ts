import { db } from "@/lib/db";
import { jparseObj } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await db.project.findMany({ select: { id: true, status: true, stage: true, title: true } });
    const statusCounts: Record<string, number> = {};
    for (const p of projects) {
      statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
    }

    const pendingApprovals = await db.approvalGate.count({ where: { status: "pending" } });
    const knowledgeNodeCount = await db.knowledgeNode.count();
    const recentOpportunities = await db.opportunity.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { project: { select: { title: true } } },
    });

    const recentRuns = await db.agentRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 7,
      include: { project: { select: { title: true } } },
    });

    // Performance aggregates
    const metrics = await db.performanceMetric.findMany();
    const totalViews = metrics.reduce((s, m) => s + m.views, 0);
    const avgCTR = metrics.length ? metrics.reduce((s, m) => s + m.ctr, 0) / metrics.length : 0;

    return Response.json({
      projectCountsByStatus: statusCounts,
      projectCount: projects.length,
      pendingApprovals,
      knowledgeNodeCount,
      totalViews,
      avgCTR: Math.round(avgCTR * 100) / 100,
      agentActivity: recentRuns.map((r) => ({
        id: r.id,
        agentType: r.agentType,
        status: r.status,
        durationMs: r.durationMs,
        projectTitle: r.project?.title ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      recentOpportunities: recentOpportunities.map((o) => ({
        id: o.id,
        projectId: o.projectId,
        title: o.title,
        niche: o.niche,
        angle: o.angle ?? "",
        opportunityScore: o.opportunityScore,
        confidence: o.confidence,
        status: o.status,
        projectTitle: o.project.title,
        createdAt: o.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

// silence unused jparseObj import warning if tree-shaken
void jparseObj;
