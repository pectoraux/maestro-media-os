// Self-Improving Memory Lifecycle
//
// Memories have lifecycle states: observation → pattern → lesson → principle → constitution
//
// Example:
//   Audience disliked clickbait.
//   → Pattern: Urgency decreases trust.
//   → Lesson: Avoid fake scarcity.
//   → Principle: Never manufacture urgency.
//   → Constitution updated.
//
// The system genuinely learns over time. Memories promote up the lifecycle
// as they accumulate evidence and confidence.

import { db } from "@/lib/db";
import { jstr, jparseObj } from "@/lib/json";
import type { MemoryLifecycle, MemoryLifecycleRecord } from "@/lib/types";

export const LIFECYCLE_STAGES: { stage: MemoryLifecycle; label: string; icon: string; color: string; description: string }[] = [
  { stage: "observation", label: "Observation", icon: "Eye", color: "text-muted-foreground", description: "A raw observation from research, analytics, or audience reaction" },
  { stage: "pattern", label: "Pattern", icon: "TrendingUp", color: "text-amber-400", description: "A repeated observation — evidence it's not a fluke" },
  { stage: "lesson", label: "Lesson", icon: "Lightbulb", color: "text-emerald-400", description: "A generalized insight drawn from the pattern" },
  { stage: "principle", label: "Principle", icon: "Scale", color: "text-violet-400", description: "A durable rule the creator follows" },
  { stage: "constitution", label: "Constitution", icon: "ShieldCheck", color: "text-emerald-400", description: "An enforceable constitutional principle" },
];

// Get memories by lifecycle stage
export async function getMemoriesByLifecycle(stage?: MemoryLifecycle, limit = 100): Promise<MemoryLifecycleRecord[]> {
  const where: Record<string, unknown> = {};
  if (stage) where.lifecycle = stage;
  const rows = await db.knowledgeNode.findMany({ where, orderBy: { createdAt: "desc" }, take: limit });
  return rows.map(decode);
}

// Get lifecycle distribution (counts per stage)
export async function getLifecycleDistribution(): Promise<Record<string, number>> {
  const rows = await db.knowledgeNode.findMany();
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.lifecycle] = (counts[r.lifecycle] ?? 0) + 1;
  return counts;
}

// Promote a memory to the next lifecycle stage
export async function promoteMemory(id: string, evidence?: string): Promise<MemoryLifecycleRecord> {
  const node = await db.knowledgeNode.findUnique({ where: { id } });
  if (!node) throw new Error("Memory not found");

  const order: MemoryLifecycle[] = ["observation", "pattern", "lesson", "principle", "constitution"];
  const currentIdx = order.indexOf(node.lifecycle as MemoryLifecycle);
  if (currentIdx === -1 || currentIdx >= order.length - 1) {
    throw new Error("Memory is already at the highest lifecycle stage");
  }

  const nextStage = order[currentIdx + 1];
  const meta = jparseObj(node.lifecycleMeta);
  const updatedMeta = {
    ...meta,
    promotedAt: new Date().toISOString(),
    promotedFrom: node.lifecycle,
    evidence: evidence ?? meta.evidence ?? "Promoted based on accumulated confidence",
    confidence: Math.min(1, (meta.confidence ?? 0.3) + 0.2),
  };

  const updated = await db.knowledgeNode.update({
    where: { id },
    data: {
      lifecycle: nextStage,
      lifecycleMeta: jstr(updatedMeta),
      weight: Math.min(1, node.weight + 0.1),
    },
  });

  // If promoted to constitution, also create a ConstitutionPrinciple
  if (nextStage === "constitution") {
    await db.constitutionPrinciple.create({
      data: {
        category: mapTypeToCategory(node.type),
        principle: node.label,
        rationale: node.content,
        enforcement: "warn",
        examples: jstr([]),
      },
    }).catch(() => {});
  }

  return decode(updated);
}

// Create a new observation (the start of the lifecycle)
export async function createObservation(data: {
  type: string;
  label: string;
  content: string;
  projectId?: string;
}): Promise<MemoryLifecycleRecord> {
  const created = await db.knowledgeNode.create({
    data: {
      type: data.type,
      label: data.label,
      content: data.content,
      projectId: data.projectId ?? null,
      lifecycle: "observation",
      lifecycleMeta: jstr({ confidence: 0.3 }),
      weight: 0.5,
    },
  });
  return decode(created);
}

function mapTypeToCategory(type: string): string {
  if (type.includes("audience") || type.includes("reaction")) return "audience";
  if (type.includes("voice") || type.includes("tone")) return "tone";
  if (type.includes("evidence") || type.includes("research")) return "truthfulness";
  if (type.includes("pattern") || type.includes("lesson")) return "editing";
  return "editing";
}

function decode(r: any): MemoryLifecycleRecord {
  return {
    id: r.id,
    type: r.type,
    lifecycle: r.lifecycle,
    label: r.label,
    content: r.content,
    lifecycleMeta: jparseObj(r.lifecycleMeta),
    createdAt: r.createdAt.toISOString(),
  };
}
