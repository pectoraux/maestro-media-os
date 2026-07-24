// /api/competitors
// GET  ?niche=...&projectId=...  → list CompetitorVideo rows (decoded JSON fields).
// POST { niche, projectId?, limit? } → runs analyzeCompetitorsForNiche.

import { db } from "@/lib/db";
import type { CompetitorVideoRecord } from "@/lib/types";
import { analyzeCompetitorsForNiche } from "@/lib/intelligence/competitor-analyzer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function decode(c: any): CompetitorVideoRecord {
  return {
    id: c.id,
    projectId: c.projectId,
    niche: c.niche,
    url: c.url,
    channel: c.channel,
    title: c.title,
    views: c.views,
    likes: c.likes,
    comments: c.comments,
    publishedAt: c.publishedAt,
    durationSec: c.durationSec,
    titleAnalysis: safeJson(c.titleAnalysis, { pattern: "", hooks: [], curiosityTriggers: [], length: 0, sentiment: "" }),
    thumbnailAnalysis: safeJson(c.thumbnailAnalysis, { composition: "", focal: "", textOverlay: "", emotion: "", colorMood: "", readability: 50 }),
    transcriptSummary: safeJson(c.transcriptSummary, { structure: "", keyPoints: [], retentionPattern: "", callsToAction: [] }),
    commentInsights: safeJson(c.commentInsights, { topQuestions: [], painPoints: [], praises: [], objections: [], audienceQuestions: [] }),
    winningPatterns: safeJson(c.winningPatterns, []),
    performanceScore: c.performanceScore,
    capturedAt: c.capturedAt.toISOString(),
  };
}

function safeJson<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const niche = url.searchParams.get("niche") ?? undefined;
    const projectId = url.searchParams.get("projectId") ?? undefined;

    const where: { niche?: string; projectId?: string } = {};
    if (niche) where.niche = niche;
    if (projectId) where.projectId = projectId;

    const rows = await db.competitorVideo.findMany({
      where,
      orderBy: { capturedAt: "desc" },
      take: 100,
    });

    return Response.json({ competitors: rows.map(decode) });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const niche = body.niche as string | undefined;
    const projectId = (body.projectId as string | undefined) ?? undefined;
    const limit = Number(body.limit ?? 4);

    if (!niche && !projectId) {
      return Response.json({ error: "Either niche or projectId is required" }, { status: 400 });
    }

    let resolvedNiche = niche;
    if (!resolvedNiche && projectId) {
      const project = await db.project.findUnique({ where: { id: projectId } });
      if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
      resolvedNiche = project.niche;
    }
    if (!resolvedNiche) {
      return Response.json({ error: "Could not resolve niche" }, { status: 400 });
    }

    const competitors = await analyzeCompetitorsForNiche(resolvedNiche, projectId, limit);
    return Response.json({ competitors });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
