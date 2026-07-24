// /api/production/[projectId]
// GET  → returns the project's production scenes.
// POST { targetDurationMin? } → (re)generates scenes from the project's final script + trifecta.

import { db } from "@/lib/db";
import {
  getProductionScenes,
  generateProductionScenes,
} from "@/lib/intelligence/production-designer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const scenes = await getProductionScenes(projectId);
    return Response.json({ scenes });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await request.json().catch(() => ({}));
    const targetDurationMin = Number(body.targetDurationMin ?? 14) || 14;

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        trifecta: true,
        scripts: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
    if (!project.trifecta) {
      return Response.json({ error: "No Holy Trifecta found — run hook_engineer first" }, { status: 400 });
    }

    const finalScript =
      project.scripts.find((s) => s.stage === "final") ??
      project.scripts.find((s) => s.stage === "draft");
    if (!finalScript) {
      return Response.json({ error: "No script found — run script_writer first" }, { status: 400 });
    }

    const scenes = await generateProductionScenes({
      projectId,
      scriptContent: finalScript.content,
      trifectaTitle: project.trifecta.title,
      niche: project.niche,
      targetDurationMin,
    });
    return Response.json({ scenes });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
