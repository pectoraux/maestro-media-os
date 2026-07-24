import { db } from "@/lib/db";
import { jparseObj, jparseArr } from "@/lib/json";
import { runOpportunityHunter } from "@/lib/agents/opportunity-hunter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const opps = await db.opportunity.findMany({
      orderBy: { createdAt: "desc" },
      include: { project: { select: { title: true, status: true } } },
    });
    return Response.json({
      opportunities: opps.map((o) => ({
        id: o.id,
        projectId: o.projectId,
        projectTitle: o.project.title,
        projectStatus: o.project.status,
        title: o.title,
        niche: o.niche,
        angle: o.angle,
        opportunityScore: o.opportunityScore,
        scoreBreakdown: jparseObj(o.scoreBreakdown),
        sources: jparseArr(o.sources),
        competitors: jparseArr(o.competitors),
        audienceSignals: jparseArr(o.audienceSignals),
        trends: jparseArr(o.trends),
        confidence: o.confidence,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const niche = (body.niche as string) || undefined;
    const opp = await runOpportunityHunter({ input: niche ? { niche } : {} });
    return Response.json({ opportunity: opp });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
