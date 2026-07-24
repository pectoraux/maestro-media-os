// /api/trifecta/[projectId]
// GET  → load the project's HolyTrifecta (decoded) and return.
// POST → load project + final script, call optimizeHolyTrifecta.

import { db } from "@/lib/db";
import { jparseArr, jparseObj } from "@/lib/json";
import type { TrifectaRecord } from "@/lib/types";
import { optimizeHolyTrifecta } from "@/lib/intelligence/trifecta-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { trifecta: true },
    });
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
    if (!project.trifecta) return Response.json({ trifecta: null });

    const t = project.trifecta;
    const thumb = jparseObj<{
      concept?: string;
      textOverlay?: string;
      focalSubject?: string;
      colorMood?: string;
      emotion?: string;
    }>(t.thumbnailStrategy);

    const trifecta: TrifectaRecord = {
      id: t.id,
      projectId,
      title: t.title,
      thumbnailStrategy: {
        concept: thumb.concept ?? "",
        textOverlay: thumb.textOverlay ?? "",
        focalSubject: thumb.focalSubject ?? "",
        colorMood: thumb.colorMood ?? "",
        emotion: thumb.emotion ?? "",
      },
      openingHook: t.openingHook,
      rationale: t.rationale,
      variants: jparseArr(t.variants),
      expectationMatch: t.expectationMatch,
    };
    return Response.json({ trifecta });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        scripts: { orderBy: { createdAt: "desc" } },
        opportunity: true,
      },
    });
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    const finalScript =
      project.scripts.find((s) => s.stage === "final") ??
      project.scripts.find((s) => s.stage === "draft");
    if (!finalScript) {
      return Response.json({ error: "No script found — run script_writer first" }, { status: 400 });
    }

    const angle = (project.opportunity?.angle as string | undefined) ?? project.brief ?? "";

    const result = await optimizeHolyTrifecta({
      projectId,
      scriptContent: finalScript.content,
      niche: project.niche,
      angle,
    });

    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
