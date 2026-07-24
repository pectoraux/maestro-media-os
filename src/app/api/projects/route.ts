import { db } from "@/lib/db";
import { jparseObj, jparseArr } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function decodeProject(p: any) {
  return {
    id: p.id,
    title: p.title,
    niche: p.niche,
    status: p.status,
    stage: p.stage,
    brief: p.brief,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    opportunity: p.opportunity
      ? {
          id: p.opportunity.id,
          title: p.opportunity.title,
          niche: p.opportunity.niche,
          angle: p.opportunity.angle,
          opportunityScore: p.opportunity.opportunityScore,
          scoreBreakdown: jparseObj(p.opportunity.scoreBreakdown),
          sources: jparseArr(p.opportunity.sources),
          competitors: jparseArr(p.opportunity.competitors),
          audienceSignals: jparseArr(p.opportunity.audienceSignals),
          trends: jparseArr(p.opportunity.trends),
          confidence: p.opportunity.confidence,
          status: p.opportunity.status,
          createdAt: p.opportunity.createdAt.toISOString(),
        }
      : null,
    latestApproval: p.approvals?.[0]
      ? {
          id: p.approvals[0].id,
          stage: p.approvals[0].stage,
          status: p.approvals[0].status,
          createdAt: p.approvals[0].createdAt.toISOString(),
        }
      : null,
  };
}

export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        opportunity: true,
        approvals: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    return Response.json({ projects: projects.map(decodeProject) });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const title = (body.title as string) || "Untitled Project";
    const niche = (body.niche as string) || "AI infrastructure";
    const brief = (body.brief as string) || null;

    const project = await db.project.create({
      data: { title, niche, brief, status: "discovery", stage: "opportunity" },
    });
    return Response.json({ project: decodeProject({ ...project, opportunity: null, approvals: [] }) });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
