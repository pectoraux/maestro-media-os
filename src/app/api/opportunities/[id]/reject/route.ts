import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const opp = await db.opportunity.update({
      where: { id },
      data: { status: "rejected" },
    });
    if (opp.projectId) {
      await db.activityLog.create({
        data: {
          projectId: opp.projectId,
          type: "approval",
          message: `Opportunity "${opp.title}" rejected`,
          meta: JSON.stringify({ opportunityId: opp.id }),
        },
      });
    }
    return Response.json({ opportunity: { id: opp.id, projectId: opp.projectId, status: opp.status } });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
