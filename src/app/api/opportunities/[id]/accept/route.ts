import { db } from "@/lib/db";
import { jparseObj } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const opp = await db.opportunity.update({
      where: { id },
      data: { status: "accepted" },
    });
    if (opp.projectId) {
      await db.project.update({
        where: { id: opp.projectId },
        data: { status: "research" },
      });
      await db.activityLog.create({
        data: {
          projectId: opp.projectId,
          type: "approval",
          message: `Opportunity "${opp.title}" accepted — advancing to research`,
          meta: JSON.stringify({ opportunityId: opp.id }),
        },
      });
    }
    return Response.json({
      opportunity: {
        id: opp.id,
        projectId: opp.projectId,
        status: opp.status,
        scoreBreakdown: jparseObj(opp.scoreBreakdown),
      },
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
