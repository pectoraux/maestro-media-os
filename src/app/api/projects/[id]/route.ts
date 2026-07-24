import { db } from "@/lib/db";
import { jparseObj, jparseArr } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      include: {
        opportunity: true,
        dossier: true,
        interviews: { orderBy: { createdAt: "asc" } },
        scripts: { orderBy: { createdAt: "asc" } },
        trifecta: true,
        blueprint: true,
        assets: { orderBy: { createdAt: "asc" } },
        publishMetadata: true,
        metrics: { orderBy: { recordedAt: "desc" } },
        approvals: { orderBy: { createdAt: "desc" } },
        agentRuns: { orderBy: { createdAt: "desc" }, take: 20 },
        activities: { orderBy: { createdAt: "desc" }, take: 30 },
      },
    });
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    const decoded = {
      id: project.id,
      title: project.title,
      niche: project.niche,
      status: project.status,
      stage: project.stage,
      brief: project.brief,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      opportunity: project.opportunity
        ? {
            id: project.opportunity.id,
            title: project.opportunity.title,
            niche: project.opportunity.niche,
            angle: project.opportunity.angle,
            opportunityScore: project.opportunity.opportunityScore,
            scoreBreakdown: jparseObj(project.opportunity.scoreBreakdown),
            sources: jparseArr(project.opportunity.sources),
            competitors: jparseArr(project.opportunity.competitors),
            audienceSignals: jparseArr(project.opportunity.audienceSignals),
            trends: jparseArr(project.opportunity.trends),
            confidence: project.opportunity.confidence,
            status: project.opportunity.status,
            createdAt: project.opportunity.createdAt.toISOString(),
          }
        : null,
      dossier: project.dossier
        ? {
            id: project.dossier.id,
            summary: project.dossier.summary,
            marketData: jparseArr(project.dossier.marketData),
            competitors: jparseArr(project.dossier.competitors),
            audienceInsights: jparseArr(project.dossier.audienceInsights),
            news: jparseArr(project.dossier.news),
            references: jparseArr(project.dossier.references),
            knowledgeGaps: jparseArr(project.dossier.knowledgeGaps),
            createdAt: project.dossier.createdAt.toISOString(),
            updatedAt: project.dossier.updatedAt.toISOString(),
          }
        : null,
      interviews: project.interviews.map((i) => ({
        id: i.id,
        question: i.question,
        answer: i.answer,
        themeTag: i.themeTag,
        createdAt: i.createdAt.toISOString(),
      })),
      scripts: project.scripts.map((s) => ({
        id: s.id,
        stage: s.stage,
        content: s.content,
        version: s.version,
        notes: s.notes,
        createdAt: s.createdAt.toISOString(),
      })),
      trifecta: project.trifecta
        ? {
            id: project.trifecta.id,
            title: project.trifecta.title,
            thumbnailStrategy: jparseObj(project.trifecta.thumbnailStrategy),
            openingHook: project.trifecta.openingHook,
            rationale: project.trifecta.rationale,
            variants: jparseArr(project.trifecta.variants),
            expectationMatch: project.trifecta.expectationMatch,
            createdAt: project.trifecta.createdAt.toISOString(),
          }
        : null,
      blueprint: project.blueprint
        ? {
            id: project.blueprint.id,
            segments: jparseArr(project.blueprint.segments),
            totalDuration: project.blueprint.totalDuration,
            createdAt: project.blueprint.createdAt.toISOString(),
          }
        : null,
      assets: project.assets.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        prompt: a.prompt,
        status: a.status,
        url: a.url,
        spec: jparseObj(a.spec),
        createdAt: a.createdAt.toISOString(),
      })),
      publishMetadata: project.publishMetadata
        ? {
            id: project.publishMetadata.id,
            description: project.publishMetadata.description,
            chapters: jparseArr(project.publishMetadata.chapters),
            tags: jparseArr(project.publishMetadata.tags),
            pinnedComment: project.publishMetadata.pinnedComment,
            playlist: project.publishMetadata.playlist,
            publishAt: project.publishMetadata.publishAt?.toISOString() ?? null,
            endScreen: jparseArr(project.publishMetadata.endScreen),
            createdAt: project.publishMetadata.createdAt.toISOString(),
          }
        : null,
      metrics: project.metrics.map((m) => ({
        id: m.id,
        ctr: m.ctr,
        retention: m.retention,
        avgViewDuration: m.avgViewDuration,
        impressions: m.impressions,
        views: m.views,
        trafficSources: jparseArr(m.trafficSources),
        revenue: m.revenue,
        engagement: m.engagement,
        lessons: jparseArr(m.lessons),
        recordedAt: m.recordedAt.toISOString(),
      })),
      approvals: project.approvals
        .slice()
        .sort((a, b) => {
          // pending first, then by createdAt desc
          const order = { pending: 0, revised: 1, rejected: 2, approved: 3 };
          const sa = (order as any)[a.status] ?? 9;
          const sb = (order as any)[b.status] ?? 9;
          if (sa !== sb) return sa - sb;
          return b.createdAt.getTime() - a.createdAt.getTime();
        })
        .map((g) => ({
        id: g.id,
        stage: g.stage,
        agentType: g.agentType,
        payload: jparseObj(g.payload),
        status: g.status,
        feedback: g.feedback,
        decidedAt: g.decidedAt?.toISOString() ?? null,
        createdAt: g.createdAt.toISOString(),
      })),
      agentRuns: project.agentRuns.map((r) => ({
        id: r.id,
        agentType: r.agentType,
        status: r.status,
        input: jparseObj(r.input),
        output: jparseObj(r.output),
        tokens: r.tokens,
        durationMs: r.durationMs,
        error: r.error,
        createdAt: r.createdAt.toISOString(),
      })),
      activities: project.activities.map((a) => ({
        id: a.id,
        type: a.type,
        message: a.message,
        meta: jparseObj(a.meta),
        createdAt: a.createdAt.toISOString(),
      })),
    };
    return Response.json(decoded);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
