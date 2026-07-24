// Semantic Memory — typed knowledge that compounds over time.
// Not just "script/video/thumbnail" but Principles, Lessons, Patterns, Mistakes,
// Experiments, Frameworks, Evidence, Relationships, Audience Reactions.

import { db } from "@/lib/db";
import { jstr, jparseObj } from "@/lib/json";
import type { SemanticMemoryRecord, SemanticMemoryType } from "@/lib/types";

export const MEMORY_TYPES: { type: SemanticMemoryType; label: string; icon: string; color: string }[] = [
  { type: "principle", label: "Principles", icon: "Scale", color: "emerald" },
  { type: "lesson", label: "Lessons", icon: "Lightbulb", color: "amber" },
  { type: "pattern", label: "Patterns", icon: "TrendingUp", color: "emerald" },
  { type: "mistake", label: "Mistakes", icon: "AlertTriangle", color: "rose" },
  { type: "experiment", label: "Experiments", icon: "FlaskConical", color: "violet" },
  { type: "framework", label: "Frameworks", icon: "Boxes", color: "teal" },
  { type: "evidence", label: "Evidence", icon: "FileSearch", color: "emerald" },
  { type: "relationship", label: "Relationships", icon: "Users", color: "amber" },
  { type: "audience_reaction", label: "Audience Reactions", icon: "MessageCircle", color: "rose" },
];

export async function listMemories(type?: SemanticMemoryType, limit = 100): Promise<SemanticMemoryRecord[]> {
  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  const rows = await db.knowledgeNode.findMany({ where, orderBy: { createdAt: "desc" }, take: limit });
  return rows.map(decode);
}

export async function createMemory(data: {
  type: SemanticMemoryType;
  label: string;
  content: string;
  evidence?: string;
  confidence?: number;
  weight?: number;
  projectId?: string;
}): Promise<SemanticMemoryRecord> {
  const created = await db.knowledgeNode.create({
    data: {
      type: data.type,
      label: data.label,
      content: data.content,
      weight: data.weight ?? 0.7,
      projectId: data.projectId ?? null,
    },
  });
  return decode(created);
}

// Get memory counts by type
export async function getMemoryCounts(): Promise<Record<string, number>> {
  const rows = await db.knowledgeNode.findMany();
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.type] = (counts[r.type] ?? 0) + 1;
  return counts;
}

// Get a context string of key memories for grounding the Authenticity Engine
export async function getMemoryContext(): Promise<string> {
  const principles = await db.knowledgeNode.findMany({ where: { type: "principle" }, take: 5, orderBy: { weight: "desc" } });
  const lessons = await db.knowledgeNode.findMany({ where: { type: "lesson" }, take: 5, orderBy: { weight: "desc" } });
  const patterns = await db.knowledgeNode.findMany({ where: { type: "pattern" }, take: 5, orderBy: { weight: "desc" } });
  const mistakes = await db.knowledgeNode.findMany({ where: { type: "mistake" }, take: 3, orderBy: { weight: "desc" } });
  const frameworks = await db.knowledgeNode.findMany({ where: { type: "framework" }, take: 3, orderBy: { weight: "desc" } });

  const fmt = (label: string, items: any[]) =>
    items.length > 0 ? `${label}:\n${items.map((i) => `- ${i.label}: ${i.content.slice(0, 150)}`).join("\n")}` : "";

  const parts = [
    fmt("PRINCIPLES", principles),
    fmt("LESSONS LEARNED", lessons),
    fmt("PATTERNS DETECTED", patterns),
    fmt("MISTAKES TO AVOID", mistakes),
    fmt("FRAMEWORKS", frameworks),
  ].filter(Boolean);

  return parts.length > 0 ? `SEMANTIC MEMORY — accumulated creative knowledge:\n\n${parts.join("\n\n")}` : "No semantic memory yet.";
}

function decode(r: any): SemanticMemoryRecord {
  return {
    id: r.id,
    type: r.type,
    label: r.label,
    content: r.content,
    evidence: r.evidence ?? null,
    confidence: r.weight,
    weight: r.weight,
    projectId: r.projectId,
    createdAt: r.createdAt.toISOString(),
  };
}
