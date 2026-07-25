// Media Primitives — format-independent creative building blocks.
//
// The creator isn't producing videos. They're producing ideas. Everything else
// is a transformation. Primitives flow through capabilities and become outputs.
//
// 9 types: idea, claim, story, evidence, scene, voice_performance,
// visual_asset, audience_reaction, knowledge_asset.

import { db } from "@/lib/db";
import { jstr, jparseArr } from "@/lib/json";
import type { MediaPrimitiveRecord, PrimitiveType } from "@/lib/types";

export const PRIMITIVE_TYPES: { type: PrimitiveType; label: string; icon: string; color: string; description: string }[] = [
  { type: "idea", label: "Idea", icon: "Lightbulb", color: "emerald", description: "A topic, thesis, or insight" },
  { type: "claim", label: "Claim", icon: "Flag", color: "amber", description: "A specific assertion to support" },
  { type: "story", label: "Story", icon: "BookOpen", color: "rose", description: "A narrative or anecdote" },
  { type: "evidence", label: "Evidence", icon: "FileSearch", color: "teal", description: "Data, citations, or examples" },
  { type: "scene", label: "Scene", icon: "Clapperboard", color: "violet", description: "A visual sequence" },
  { type: "voice_performance", label: "Voice Performance", icon: "Mic", color: "emerald", description: "Spoken delivery" },
  { type: "visual_asset", label: "Visual Asset", icon: "Image", color: "amber", description: "Images, graphics, or animations" },
  { type: "audience_reaction", label: "Audience Reaction", icon: "MessageCircle", color: "rose", description: "Comments, questions, objections, praise" },
  { type: "knowledge_asset", label: "Knowledge Asset", icon: "GraduationCap", color: "teal", description: "Evergreen frameworks and principles" },
];

export async function listPrimitives(type?: PrimitiveType, projectId?: string, limit = 100): Promise<MediaPrimitiveRecord[]> {
  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (projectId) where.projectId = projectId;
  const rows = await db.mediaPrimitive.findMany({ where, orderBy: { createdAt: "desc" }, take: limit });
  return rows.map(decode);
}

export async function getPrimitive(id: string): Promise<MediaPrimitiveRecord | null> {
  const row = await db.mediaPrimitive.findUnique({ where: { id } });
  return row ? decode(row) : null;
}

export async function createPrimitive(data: {
  type: PrimitiveType;
  title: string;
  content: string;
  format?: string;
  source?: string;
  sourceRef?: string;
  projectId?: string;
  parentId?: string;
  tags?: string[];
}): Promise<MediaPrimitiveRecord> {
  const created = await db.mediaPrimitive.create({
    data: {
      type: data.type,
      title: data.title,
      content: data.content,
      format: data.format ?? "text",
      source: data.source ?? "creator",
      sourceRef: data.sourceRef ?? null,
      projectId: data.projectId ?? null,
      parentId: data.parentId ?? null,
      tags: jstr(data.tags ?? []),
    },
  });
  return decode(created);
}

// Trace the provenance of a primitive (walk the parentId chain)
export async function traceProvenance(id: string): Promise<MediaPrimitiveRecord[]> {
  const chain: MediaPrimitiveRecord[] = [];
  let current = await getPrimitive(id);
  const visited = new Set<string>();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    chain.unshift(current);
    if (current.parentId) {
      current = await getPrimitive(current.parentId);
    } else {
      break;
    }
  }
  return chain;
}

// Get primitive counts by type
export async function getPrimitiveCounts(): Promise<Record<string, number>> {
  const rows = await db.mediaPrimitive.findMany();
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.type] = (counts[r.type] ?? 0) + 1;
  return counts;
}

function decode(r: any): MediaPrimitiveRecord {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    content: r.content,
    format: r.format,
    source: r.source,
    sourceRef: r.sourceRef,
    projectId: r.projectId,
    parentId: r.parentId,
    provenance: jparseArr(r.provenance),
    tags: jparseArr(r.tags),
    status: r.status,
    authenticityScore: r.authenticityScore,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
