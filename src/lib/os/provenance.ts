// Provenance — every artifact knows exactly where it came from.
//
// Walk the chain: Idea → Interview → Semantic Memory → Research → Evidence
// → Draft → Revision → Final. Every sentence can be traced.
//
// Provenance is recorded as a chain of MediaPrimitives (parentId links) +
// their `provenance` field (the steps that produced them).

import { db } from "@/lib/db";
import { jparseArr } from "@/lib/json";
import type { MediaPrimitiveRecord } from "@/lib/types";

export interface ProvenanceNode {
  primitive: MediaPrimitiveRecord;
  depth: number; // 0 = the artifact itself, 1 = direct source, etc.
  children: ProvenanceNode[];
}

// Trace the full provenance tree of a primitive (walk parentId + provenance chain)
export async function traceProvenance(primitiveId: string): Promise<{
  chain: MediaPrimitiveRecord[];
  tree: ProvenanceNode | null;
  sources: { type: string; title: string; source: string }[];
}> {
  const visited = new Set<string>();
  const chain: MediaPrimitiveRecord[] = [];

  // Walk up the parentId chain
  let current = await db.mediaPrimitive.findUnique({ where: { id: primitiveId } });
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    chain.unshift(decode(current));
    if (current.parentId) {
      current = await db.mediaPrimitive.findUnique({ where: { id: current.parentId } });
    } else {
      break;
    }
  }

  // Build sources list (unique source provenance entries)
  const sources = chain.map((p) => ({
    type: p.type,
    title: p.title,
    source: p.source,
  }));

  // Build a simple tree (the chain as a linear tree)
  const tree = chain.length > 0 ? buildTree(chain, 0) : null;

  return { chain, tree, sources };
}

function buildTree(chain: MediaPrimitiveRecord[], depth: number): ProvenanceNode | null {
  if (depth >= chain.length) return null;
  const node = chain[depth];
  const child = buildTree(chain, depth + 1);
  return {
    primitive: node,
    depth,
    children: child ? [child] : [],
  };
}

// Record provenance for a new primitive (append a step to the provenance chain)
export async function recordProvenance(primitiveId: string, step: {
  step: string;
  capability: string;
  timestamp?: string;
}): Promise<void> {
  const prim = await db.mediaPrimitive.findUnique({ where: { id: primitiveId } });
  if (!prim) return;
  const provenance = jparseArr(prim.provenance);
  provenance.push({
    step: step.step,
    capability: step.capability,
    timestamp: step.timestamp ?? new Date().toISOString(),
  });
  await db.mediaPrimitive.update({
    where: { id: primitiveId },
    data: { provenance: JSON.stringify(provenance) },
  });
}

// Get a human-readable provenance explanation for an artifact
export async function explainProvenance(primitiveId: string): Promise<string> {
  const { chain } = await traceProvenance(primitiveId);
  if (chain.length === 0) return "No provenance recorded.";

  const lines = chain.map((p, i) => {
    const indent = "  ".repeat(i);
    const arrow = i === 0 ? "→" : "↑";
    return `${indent}${arrow} ${p.type}: "${p.title}" (from ${p.source})`;
  });

  return `Provenance trace for "${chain[chain.length - 1].title}":\n\n${lines.join("\n")}\n\nThis artifact can be traced through ${chain.length} step${chain.length === 1 ? "" : "s"} of the creative pipeline.`;
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
