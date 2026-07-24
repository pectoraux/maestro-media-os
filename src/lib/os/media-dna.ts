// Media DNA — the reference models the Authenticity Engine checks against.
// Generalizes Voice DNA into 8 types. Each extension can improve one or more.

import { db } from "@/lib/db";
import { jparseObj } from "@/lib/json";
import type { MediaDNARecord, MediaDNAType } from "@/lib/types";

export const DNA_TYPES: { type: MediaDNAType; label: string; description: string; icon: string }[] = [
  { type: "voice", label: "Voice DNA", description: "Tone, pacing, vocabulary, signatures", icon: "Mic" },
  { type: "visual", label: "Visual DNA", description: "Style, palette, composition, text overlay", icon: "Palette" },
  { type: "writing", label: "Writing DNA", description: "Sentence structure, register, complexity", icon: "PenLine" },
  { type: "editing", label: "Editing DNA", description: "Pacing, transitions, graphics, B-roll rhythm", icon: "Scissors" },
  { type: "story", label: "Story DNA", description: "Structure, arcs, callbacks, frameworks", icon: "BookOpen" },
  { type: "reasoning", label: "Reasoning DNA", description: "Approach, skepticism, evidence standards", icon: "Brain" },
  { type: "brand", label: "Brand DNA", description: "Positioning, promise, tone, avoided terms", icon: "Badge" },
  { type: "teaching", label: "Teaching DNA", description: "Approach, scaffolding, depth, examples", icon: "GraduationCap" },
];

export async function listMediaDNA(): Promise<MediaDNARecord[]> {
  const rows = await db.mediaDNA.findMany({ orderBy: { type: "asc" } });
  return rows.map(decode);
}

export async function getMediaDNAByType(type: MediaDNAType): Promise<MediaDNARecord | null> {
  const row = await db.mediaDNA.findFirst({ where: { type }, orderBy: { updatedAt: "desc" } });
  return row ? decode(row) : null;
}

// Get all DNA as a context string for the Authenticity Engine
export async function getMediaDNAContext(): Promise<string> {
  const all = await listMediaDNA();
  if (all.length === 0) return "No Media DNA available.";
  const lines = all.map((d) => `${d.type.toUpperCase()} DNA (confidence ${(d.confidence * 100).toFixed(0)}%):\n${JSON.stringify(d.content, null, 2)}`);
  return `MEDIA DNA — the creator's reference models across 8 dimensions:\n\n${lines.join("\n\n")}`;
}

export async function updateMediaDNA(type: MediaDNAType, content: Record<string, unknown>, confidence?: number): Promise<MediaDNARecord> {
  const existing = await db.mediaDNA.findFirst({ where: { type } });
  if (existing) {
    const updated = await db.mediaDNA.update({
      where: { id: existing.id },
      data: { content: JSON.stringify(content), confidence: confidence ?? existing.confidence },
    });
    return decode(updated);
  }
  const created = await db.mediaDNA.create({
    data: { type, content: JSON.stringify(content), confidence: confidence ?? 0.5, source: "manual" },
  });
  return decode(created);
}

function decode(r: any): MediaDNARecord {
  return {
    id: r.id,
    type: r.type,
    content: jparseObj(r.content),
    source: r.source,
    sourceRef: r.sourceRef,
    confidence: r.confidence,
    updatedAt: r.updatedAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  };
}
