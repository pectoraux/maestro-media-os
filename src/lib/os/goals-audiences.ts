// Goals + Audiences — the Director optimizes toward goals, for specific audiences.

import { db } from "@/lib/db";
import { jparseArr } from "@/lib/json";
import type { GoalRecord, AudienceRecord } from "@/lib/types";

// ── Goals ──────────────────────────────────────────────────────────────────
export async function getGoals(status?: string): Promise<GoalRecord[]> {
  const where = status ? { status } : {};
  const rows = await db.goal.findMany({ where, orderBy: [{ priority: "desc" }, { createdAt: "desc" }] });
  return rows.map((g) => ({
    id: g.id, title: g.title, description: g.description, category: g.category as GoalRecord["category"],
    priority: g.priority as GoalRecord["priority"], status: g.status as GoalRecord["status"],
    targetMetric: g.targetMetric, progress: g.progress,
    createdAt: g.createdAt.toISOString(), updatedAt: g.updatedAt.toISOString(),
  }));
}

export async function createGoal(data: { title: string; description?: string; category: string; priority?: string; targetMetric?: string }): Promise<GoalRecord> {
  const created = await db.goal.create({
    data: { title: data.title, description: data.description, category: data.category, priority: data.priority ?? "medium", targetMetric: data.targetMetric },
  });
  return getGoals().then((gs) => gs.find((g) => g.id === created.id)!);
}

export async function updateGoalProgress(id: string, progress: number): Promise<void> {
  const status = progress >= 1 ? "achieved" : "active";
  await db.goal.update({ where: { id }, data: { progress, status } });
}

// ── Audiences ──────────────────────────────────────────────────────────────
export async function getAudiences(): Promise<AudienceRecord[]> {
  const rows = await db.audience.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((a) => ({
    id: a.id, name: a.name, description: a.description,
    vocabulary: jparseArr(a.vocabulary), misconceptions: jparseArr(a.misconceptions),
    interests: jparseArr(a.interests), objections: jparseArr(a.objections),
    trustSignals: jparseArr(a.trustSignals), preferredExamples: jparseArr(a.preferredExamples),
    attentionSpan: a.attentionSpan as AudienceRecord["attentionSpan"],
    expertiseLevel: a.expertiseLevel as AudienceRecord["expertiseLevel"],
    createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(),
  }));
}

export async function createAudience(data: { name: string; description?: string; expertiseLevel?: string; attentionSpan?: string }): Promise<AudienceRecord> {
  const created = await db.audience.create({
    data: { name: data.name, description: data.description, expertiseLevel: data.expertiseLevel ?? "intermediate", attentionSpan: data.attentionSpan ?? "medium" },
  });
  return getAudiences().then((as) => as.find((a) => a.id === created.id)!);
}
