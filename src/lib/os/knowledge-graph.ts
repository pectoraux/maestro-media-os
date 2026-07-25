// Knowledge Graph — typed nodes connected by typed edges.
//
// Nodes: person, concept, framework, experience, lesson, principle, story,
// claim, evidence, question, audience_insight, asset.
//
// Edges: supports, contradicts, extends, caused, learned_from, derived_from,
// inspired, explains, belongs_to, references.
//
// The Director reasons over relationships instead of isolated documents.

import { db } from "@/lib/db";
import type { KnowledgeRelation } from "@/lib/types";

export const NODE_TYPES = [
  "person", "concept", "framework", "experience", "lesson", "principle",
  "story", "claim", "evidence", "question", "audience_insight", "asset",
  "pattern", "mistake", "opinion", "analogy", "audience_reaction",
] as const;

export const EDGE_TYPES: { relation: KnowledgeRelation; label: string; color: string; description: string }[] = [
  { relation: "supports", label: "supports", color: "emerald", description: "A supports B's claim" },
  { relation: "contradicts", label: "contradicts", color: "rose", description: "A contradicts B" },
  { relation: "extends", label: "extends", color: "teal", description: "A extends B's idea" },
  { relation: "caused", label: "caused", color: "amber", description: "A caused B" },
  { relation: "learned_from", label: "learned from", color: "violet", description: "A learned from B" },
  { relation: "derived_from", label: "derived from", color: "teal", description: "A derived from B" },
  { relation: "inspired", label: "inspired", color: "amber", description: "A inspired B" },
  { relation: "explains", label: "explains", color: "emerald", description: "A explains B" },
  { relation: "belongs_to", label: "belongs to", color: "muted", description: "A belongs to B" },
  { relation: "references", label: "references", color: "muted", description: "A references B" },
];

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  content: string;
  weight: number;
  lifecycle?: string;
  connections: number;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  weight: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  edgeTypeCounts: Record<string, number>;
  nodeTypeCounts: Record<string, number>;
}

export async function getKnowledgeGraph(limit = 100): Promise<KnowledgeGraphData> {
  const [nodeRows, edgeRows] = await Promise.all([
    db.knowledgeNode.findMany({ take: limit }),
    db.knowledgeEdge.findMany({ take: 200 }),
  ]);

  // Count connections per node
  const connCount: Record<string, number> = {};
  for (const e of edgeRows) {
    connCount[e.sourceId] = (connCount[e.sourceId] ?? 0) + 1;
    connCount[e.targetId] = (connCount[e.targetId] ?? 0) + 1;
  }

  const nodes: GraphNode[] = nodeRows.map((n) => ({
    id: n.id, type: n.type, label: n.label, content: n.content, weight: n.weight,
    lifecycle: n.lifecycle, connections: connCount[n.id] ?? 0,
  }));

  const edges: GraphEdge[] = edgeRows.map((e) => ({
    id: e.id, sourceId: e.sourceId, targetId: e.targetId, relation: e.relation, weight: e.weight,
  }));

  const edgeTypeCounts: Record<string, number> = {};
  for (const e of edges) edgeTypeCounts[e.relation] = (edgeTypeCounts[e.relation] ?? 0) + 1;

  const nodeTypeCounts: Record<string, number> = {};
  for (const n of nodes) nodeTypeCounts[n.type] = (nodeTypeCounts[n.type] ?? 0) + 1;

  return { nodes, edges, edgeTypeCounts, nodeTypeCounts };
}

// Get a node's neighbors (graph traversal)
export async function getNodeNeighbors(nodeId: string): Promise<{ node: GraphNode | null; neighbors: { node: GraphNode; relation: string; direction: "outgoing" | "incoming" }[] }> {
  const node = await db.knowledgeNode.findUnique({ where: { id: nodeId } });
  if (!node) return { node: null, neighbors: [] };

  const outEdges = await db.knowledgeEdge.findMany({ where: { sourceId: nodeId }, include: { target: true } });
  const inEdges = await db.knowledgeEdge.findMany({ where: { targetId: nodeId }, include: { source: true } });

  const neighbors: { node: GraphNode; relation: string; direction: "outgoing" | "incoming" }[] = [
    ...outEdges.map((e) => ({
      node: { id: e.target.id, type: e.target.type, label: e.target.label, content: e.target.content, weight: e.target.weight, lifecycle: e.target.lifecycle, connections: 0 },
      relation: e.relation,
      direction: "outgoing" as const,
    })),
    ...inEdges.map((e) => ({
      node: { id: e.source.id, type: e.source.type, label: e.source.label, content: e.source.content, weight: e.source.weight, lifecycle: e.source.lifecycle, connections: 0 },
      relation: e.relation,
      direction: "incoming" as const,
    })),
  ];

  return {
    node: { id: node.id, type: node.type, label: node.label, content: node.content, weight: node.weight, lifecycle: node.lifecycle, connections: neighbors.length },
    neighbors,
  };
}

// Create a typed edge between two nodes
export async function createEdge(sourceId: string, targetId: string, relation: KnowledgeRelation, weight = 1): Promise<GraphEdge> {
  const created = await db.knowledgeEdge.create({ data: { sourceId, targetId, relation, weight } });
  return { id: created.id, sourceId: created.sourceId, targetId: created.targetId, relation: created.relation, weight: created.weight };
}
