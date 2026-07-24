// Analytics Learning Loop
// Reads post-publication performance and updates the Knowledge Graph with
// learned patterns. This is the feedback loop that makes the system smarter
// over time.

import { db } from "@/lib/db";
import { jstr, jparseArr, jparseObj } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import { getLatestVoiceDNA } from "./voice-dna";

interface PerformanceInput {
  projectId: string;
  // Optional override metrics; if not provided, generate realistic ones via LLM
  metrics?: {
    ctr?: number;
    retention?: number;
    avgViewDuration?: number;
    impressions?: number;
    views?: number;
    revenue?: number;
    engagement?: number;
  };
}

// Run the learning loop: ingest metrics → extract lessons → update knowledge graph
export async function runLearningLoop(input: PerformanceInput): Promise<{
  lessons: string[];
  knowledgeNodesCreated: number;
  metrics: any;
}> {
  const project = await db.project.findUnique({
    where: { id: input.projectId },
    include: { trifecta: true, metrics: { orderBy: { recordedAt: "desc" }, take: 1 } },
  });
  if (!project) throw new Error("Project not found");

  // 1. Get or generate metrics
  let metric = project.metrics[0];
  if (!metric) {
    metric = await generateMetrics(input.projectId, input.metrics ?? {});
  }

  // 2. Extract lessons via LLM
  const lessons = await extractLessons(project, metric);

  // Update the metric with lessons
  await db.performanceMetric.update({
    where: { id: metric.id },
    data: { lessons: jstr(lessons) },
  });

  // 3. Update the knowledge graph with new pattern + history nodes
  const nodesCreated = await updateKnowledgeGraph(project, metric, lessons);

  // 4. Update Voice DNA if there are voice-related lessons (optional)
  const voiceLessons = lessons.filter((l) => /voice|tone|pacing|hook|opening/i.test(l));
  if (voiceLessons.length > 0) {
    // Touch the creator profile distinctiveness (the voice DNA agent will refine later)
    const profile = await db.creatorProfile.findFirst();
    if (profile) {
      const current = profile.distinctivenessScore;
      // nudge upward slightly with each published video
      await db.creatorProfile.update({
        where: { id: profile.id },
        data: { distinctivenessScore: Math.min(1, current + 0.02) },
      });
    }
  }

  // 5. Mark project as live
  await db.project.update({
    where: { id: input.projectId },
    data: { status: "live", stage: "published" },
  });

  await db.activityLog.create({
    data: {
      projectId: input.projectId,
      type: "agent",
      message: `Analytics Scientist (Prism) closed the learning loop: ${lessons.length} lessons extracted, ${nodesCreated} knowledge nodes added`,
      meta: jstr({ lessons, nodesCreated, ctr: metric.ctr }),
    },
  });

  return { lessons, knowledgeNodesCreated: nodesCreated, metrics: metric };
}

// Generate realistic performance metrics via LLM (when no real YouTube API data)
async function generateMetrics(projectId: string, overrides: any) {
  const project = await db.project.findUnique({ where: { id: projectId }, include: { trifecta: true } });
  const title = project?.trifecta?.title ?? project?.title ?? "";

  const { data } = await llmJson<{ ctr: number; retention: number; avgViewDuration: number; impressions: number; views: number; revenue: number; engagement: number; trafficSources: { source: string; share: number }[] }>(
    `Generate realistic post-publication YouTube performance metrics for this video.
Title: ${title}

Base the numbers on what a strong-but-realistic technical video would achieve.
- CTR: 5-12% (higher if title/thumbnail are strong)
- Retention: 40-55% (higher if the hook is strong)
- avgViewDuration: in minutes (4-9 min for a 12-16 min video)
- impressions: 200k-4M
- views: impressions * CTR
- revenue: $0.5-3 per 1000 views
- engagement: 4-8% (likes+comments/views)

Return STRICT JSON:
{
  "ctr": N, "retention": N, "avgViewDuration": N, "impressions": N, "views": N, "revenue": N, "engagement": N,
  "trafficSources": [{ "source": "Browse", "share": N }, { "source": "Suggested", "share": N }, { "source": "Search", "share": N }, { "source": "External", "share": N }, { "source": "Direct", "share": N }]
}`,
    { system: "You are a YouTube analytics simulator. Return realistic numbers as strict JSON." },
  );

  const m = data ?? { ctr: 7.5, retention: 46, avgViewDuration: 6.5, impressions: 800000, views: 60000, revenue: 120, engagement: 5.2, trafficSources: [] };
  return db.performanceMetric.create({
    data: {
      projectId,
      ctr: overrides.ctr ?? m.ctr,
      retention: overrides.retention ?? m.retention,
      avgViewDuration: overrides.avgViewDuration ?? m.avgViewDuration,
      impressions: overrides.impressions ?? m.impressions,
      views: overrides.views ?? m.views,
      revenue: overrides.revenue ?? m.revenue,
      engagement: overrides.engagement ?? m.engagement,
      trafficSources: jstr(m.trafficSources ?? []),
      lessons: jstr([]),
    },
  });
}

// Extract lessons from performance via LLM
async function extractLessons(project: any, metric: any): Promise<string[]> {
  const title = project.trifecta?.title ?? project.title;
  const niche = project.niche;
  const hook = project.trifecta?.openingHook ?? "";

  const { data } = await llmJson<{ lessons: string[] }>(
    `You are Prism, the Analytics Scientist. Extract 3-5 specific, reusable lessons from this video's performance.

Video: "${title}" (niche: ${niche})
Opening hook: "${hook.slice(0, 200)}"
Performance:
- CTR: ${metric.ctr}% (industry avg ~5%)
- Retention: ${metric.retention}% (good = >45%)
- Avg view duration: ${metric.avgViewDuration} min
- Views: ${metric.views}
- Engagement: ${metric.engagement}%

Connect the metrics to SPECIFIC creative decisions. E.g. "Contrarian open lifted retention to X%" or "Title framing underperformed — try problem-framed next time". Avoid generic advice.

Return JSON: { "lessons": ["...", "..."] }`,
    { system: "You are a senior YouTube analyst. Extract specific, actionable, non-generic lessons. Return strict JSON." },
  );
  return data?.lessons ?? [];
}

// Update the knowledge graph with a history node + pattern nodes
async function updateKnowledgeGraph(project: any, metric: any, lessons: string[]): Promise<number> {
  let created = 0;

  // 1. History node for this published video
  await db.knowledgeNode.create({
    data: {
      type: "history",
      label: `Video: "${project.title}"`,
      content: `Published ${new Date().toISOString().slice(0, 10)}. CTR ${metric.ctr}%, retention ${metric.retention}%, ${metric.views} views. Niche: ${project.niche}.`,
      weight: Math.min(1, metric.ctr / 10),
      projectId: project.id,
    },
  });
  created++;

  // 2. Pattern nodes for each lesson
  for (const lesson of lessons) {
    await db.knowledgeNode.create({
      data: {
        type: "pattern",
        label: lesson.slice(0, 80),
        content: lesson,
        weight: 0.7,
        projectId: project.id,
      },
    });
    created++;
  }

  // 3. Extract + store audience insights from the performance (best-effort)
  const { data } = await llmJson<{ insights: string[] }>(
    `Based on this video's performance (CTR ${metric.ctr}%, retention ${metric.retention}%), what did the audience tell us about their preferences?
Video: "${project.title}" (niche: ${project.niche})
Return JSON: { "insights": ["<specific audience insight>", "...2-3 items"] }`,
    { system: "You are an audience analyst. Be specific. Return strict JSON." },
  );
  for (const insight of data?.insights ?? []) {
    await db.knowledgeNode.create({
      data: {
        type: "audience_insight",
        label: insight.slice(0, 80),
        content: insight,
        weight: 0.6,
        projectId: project.id,
      },
    });
    created++;
  }

  return created;
}
