// Outcome Engine — the platform optimizes outcomes, not artifacts.
//
// Every recommendation answers: "Does this move the creator closer to the outcome?"

import { db } from "@/lib/db";
import { jstr, jparseArr } from "@/lib/json";
import type { OutcomeRecord } from "@/lib/types";

export async function getOutcomes(status?: string): Promise<OutcomeRecord[]> {
  const where = status ? { status } : {};
  const rows = await db.outcome.findMany({ where, orderBy: [{ priority: "desc" }, { createdAt: "asc" }] });
  return rows.map(decode);
}

export async function createOutcome(data: {
  title: string;
  category: string;
  target?: string;
  deadline?: string;
  priority?: string;
}): Promise<OutcomeRecord> {
  const created = await db.outcome.create({
    data: {
      title: data.title,
      category: data.category,
      target: data.target ?? null,
      deadline: data.deadline ?? null,
      priority: data.priority ?? "medium",
      milestones: jstr([]),
    },
  });
  return decode(created);
}

export async function updateOutcomeProgress(id: string, progress: number): Promise<void> {
  const status = progress >= 1 ? "achieved" : "active";
  await db.outcome.update({ where: { id }, data: { progress, status } });
}

function decode(r: any): OutcomeRecord {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    target: r.target,
    deadline: r.deadline,
    status: r.status,
    progress: r.progress,
    priority: r.priority,
    milestones: jparseArr(r.milestones),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
