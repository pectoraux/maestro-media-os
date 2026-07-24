// /api/thumbnails
// GET  ?projectId=...  → list ThumbnailBrief rows for the project (newest first).
// POST { projectId }   → load project + trifecta, reconstruct winner, call generateThumbnailBrief.

import { db } from "@/lib/db";
import { jparseArr, jparseObj } from "@/lib/json";
import type { ThumbnailBriefRecord, TrifectaCandidate } from "@/lib/types";
import { generateThumbnailBrief } from "@/lib/intelligence/trifecta-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function decodeBrief(b: any): ThumbnailBriefRecord {
  return {
    id: b.id,
    projectId: b.projectId,
    concept: b.concept,
    visualLayout: jparseObj(b.visualLayout),
    textOverlay: jparseObj(b.textOverlay),
    emotionalTriggers: jparseArr(b.emotionalTriggers),
    colorMood: jparseObj(b.colorMood),
    mobileReadability: b.mobileReadability,
    readabilityNotes: b.readabilityNotes,
    aiPrompts: jparseArr(b.aiPrompts),
    generatedImageUrl: b.generatedImageUrl,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return Response.json({ error: "projectId query param required" }, { status: 400 });
    }
    const rows = await db.thumbnailBrief.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ briefs: rows.map(decodeBrief) });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const projectId = body.projectId as string | undefined;
    if (!projectId) {
      return Response.json({ error: "projectId required" }, { status: 400 });
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { trifecta: true },
    });
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
    if (!project.trifecta) {
      return Response.json({ error: "No Holy Trifecta found — run hook_engineer first" }, { status: 400 });
    }

    const parsed = jparseObj<{
      concept?: string;
      textOverlay?: string;
      focal?: string;
      colorMood?: string;
      emotion?: string;
    }>(project.trifecta.thumbnailStrategy);

    // Reconstruct a TrifectaCandidate from the stored HolyTrifecta.
    const winner: TrifectaCandidate = reconstructWinner(
      project.trifecta.title,
      parsed.concept ?? "",
      project.trifecta.openingHook,
      project.trifecta.expectationMatch,
    );

    const brief = await generateThumbnailBrief(projectId, winner);

    // Re-fetch the latest brief row to return the decoded record.
    const row = await db.thumbnailBrief.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    const decoded = row ? decodeBrief(row) : null;

    return Response.json({ brief: decoded, raw: brief });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

function reconstructWinner(
  title: string,
  thumbnailConcept: string,
  openingHook: string,
  expectationMatchStr: string,
): TrifectaCandidate {
  const find = (re: RegExp): number => {
    const m = expectationMatchStr.match(re);
    if (!m) return 0;
    const n = Number(m[1]);
    return isFinite(n) ? n : 0;
  };
  const expectationMatch = find(/Expectation match\s*(\d+(?:\.\d+)?)/i) || 60;
  const curiosityGap = find(/Curiosity\s*(\d+(?:\.\d+)?)/i) || 60;
  const retentionPrediction = find(/[Rr]etention\s*(?:pred\s*)?(\d+(?:\.\d+)?)/i) || 55;
  const ctrPrediction = find(/CTR\s*(?:pred\s*)?(\d+(?:\.\d+)?)/i) || 55;
  const compositeScore = find(/scored\s*(\d+(?:\.\d+)?)/i) ||
    Math.round((expectationMatch * 0.3 + curiosityGap * 0.2 + retentionPrediction * 0.25 + ctrPrediction * 0.25) * 10) / 10;

  return {
    title,
    thumbnailConcept,
    openingHook,
    expectationMatch,
    curiosityGap,
    retentionPrediction,
    ctrPrediction,
    compositeScore,
    rationale: "Reconstructed from stored Holy Trifecta.",
  };
}
