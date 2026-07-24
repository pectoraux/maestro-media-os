import { db } from "@/lib/db";
import { jparseArr } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metrics = await db.performanceMetric.findMany({
      orderBy: { recordedAt: "desc" },
      include: { project: { select: { title: true, niche: true } } },
    });

    const decoded = metrics.map((m) => ({
      id: m.id,
      projectId: m.projectId,
      projectTitle: m.project.title,
      niche: m.project.niche,
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
    }));

    // Aggregates
    const totalViews = decoded.reduce((s, m) => s + m.views, 0);
    const totalRevenue = decoded.reduce((s, m) => s + m.revenue, 0);
    const avgCTR = decoded.length ? decoded.reduce((s, m) => s + m.ctr, 0) / decoded.length : 0;
    const avgRetention = decoded.length ? decoded.reduce((s, m) => s + m.retention, 0) / decoded.length : 0;
    const best = decoded.reduce<{ projectTitle: string; views: number } | null>((best, m) => {
      if (!best || m.views > best.views) return { projectTitle: m.projectTitle, views: m.views };
      return best;
    }, null);

    const allLessons = decoded.flatMap((m) => m.lessons);

    return Response.json({
      metrics: decoded,
      aggregates: {
        totalViews,
        totalRevenue,
        avgCTR: Math.round(avgCTR * 100) / 100,
        avgRetention: Math.round(avgRetention * 100) / 100,
        bestPerforming: best,
        totalVideos: decoded.length,
      },
      lessons: allLessons,
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
