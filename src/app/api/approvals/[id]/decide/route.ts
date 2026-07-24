import { db } from "@/lib/db";
import { jstr } from "@/lib/json";
import { PIPELINE, STAGE_INDEX } from "@/lib/agents-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const decision = body.decision as "approved" | "rejected" | "revised";
    const feedback = (body.feedback as string) || null;

    if (!["approved", "rejected", "revised"].includes(decision)) {
      return Response.json({ error: "decision must be approved|rejected|revised" }, { status: 400 });
    }

    const gate = await db.approvalGate.findUnique({ where: { id }, include: { project: true } });
    if (!gate) return Response.json({ error: "Approval gate not found" }, { status: 404 });

    const updated = await db.approvalGate.update({
      where: { id },
      data: { status: decision, feedback, decidedAt: new Date() },
    });

    let newStage = gate.project.stage;
    if (decision === "approved") {
      // advance to NEXT pipeline stage
      const currentIdx = STAGE_INDEX[gate.stage] ?? STAGE_INDEX[gate.project.stage] ?? 0;
      const next = PIPELINE[currentIdx + 1];
      if (next) {
        newStage = next.key;
        await db.project.update({ where: { id: gate.projectId }, data: { stage: newStage } });
      }
    }

    await db.activityLog.create({
      data: {
        projectId: gate.projectId,
        type: "approval",
        message: `Approval: ${gate.stage} ${decision}${feedback ? ` — ${feedback.slice(0, 80)}` : ""}`,
        meta: jstr({ gateId: id, decision, stage: gate.stage, newStage, feedback }),
      },
    });

    return Response.json({
      approval: {
        id: updated.id,
        stage: updated.stage,
        status: updated.status,
        feedback: updated.feedback,
        decidedAt: updated.decidedAt?.toISOString(),
      },
      newStage,
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
