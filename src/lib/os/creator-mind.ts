// Creator Mind — the unified model of the creator's intelligence.
//
// The platform maintains a living model of the creator's mind.
// Everything else — videos, newsletters, podcasts — is an expression of that model.
//
// This module unifies: identity, constitution, knowledge graph, semantic memory,
// goals, audiences, trust, media DNA, assets, capabilities, extensions, channels.

import { db } from "@/lib/db";
import { jparseArr } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import { getIdentity } from "./identity";
import { getConstitution, getOpenViolations } from "./constitution";
import { listMediaDNA } from "./media-dna";
import { listTrustProfiles } from "./trust-engine";
import { listCapabilities } from "./capabilities";
import { listExtensions } from "./extensions";
import { listChannels } from "./connectors";
import { getLifecycleDistribution } from "./memory-lifecycle";
import type { CreatorMindRecord, GoalRecord, AudienceRecord } from "@/lib/types";

// Get the full Creator Mind — the unified model
export async function getCreatorMind(): Promise<CreatorMindRecord> {
  const [identity, principles, violations, mediaDNA, trustProfiles, caps, exts, channels, lifecycle] = await Promise.all([
    getIdentity(),
    getConstitution(),
    getOpenViolations(),
    listMediaDNA(),
    listTrustProfiles(),
    listCapabilities({ status: "active" }),
    listExtensions(),
    listChannels(),
    getLifecycleDistribution(),
  ]);

  // Knowledge graph stats
  const nodeCount = await db.knowledgeNode.count();
  const edgeCount = await db.knowledgeEdge.count();
  const nodes = await db.knowledgeNode.findMany({ take: 200 });
  const byType: Record<string, number> = {};
  for (const n of nodes) byType[n.type] = (byType[n.type] ?? 0) + 1;

  // Goals
  const goalsRows = await db.goal.findMany({ where: { status: "active" }, orderBy: { priority: "desc" } });
  const goals: GoalRecord[] = goalsRows.map((g) => ({
    id: g.id, title: g.title, description: g.description, category: g.category as GoalRecord["category"],
    priority: g.priority as GoalRecord["priority"], status: g.status as GoalRecord["status"],
    targetMetric: g.targetMetric, progress: g.progress,
    createdAt: g.createdAt.toISOString(), updatedAt: g.updatedAt.toISOString(),
  }));

  // Audiences
  const audRows = await db.audience.findMany();
  const audiences: AudienceRecord[] = audRows.map((a) => ({
    id: a.id, name: a.name, description: a.description,
    vocabulary: jparseArr(a.vocabulary), misconceptions: jparseArr(a.misconceptions),
    interests: jparseArr(a.interests), objections: jparseArr(a.objections),
    trustSignals: jparseArr(a.trustSignals), preferredExamples: jparseArr(a.preferredExamples),
    attentionSpan: a.attentionSpan as AudienceRecord["attentionSpan"],
    expertiseLevel: a.expertiseLevel as AudienceRecord["expertiseLevel"],
    createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(),
  }));

  // Trust stats
  const trustScores = trustProfiles.map((p) => p.trustScore);
  const avgTrust = trustScores.length > 0 ? Math.round(trustScores.reduce((s, v) => s + v, 0) / trustScores.length) : 0;
  const approvedCount = trustProfiles.filter((p) => p.reviewStatus === "approved").length;

  // Assets count (CreativeAsset if exists, else MediaPrimitive)
  const assetCount = await db.mediaPrimitive.count();

  // Identity version (use updatedAt as a proxy version)
  const identityVersion = identity ? Math.floor((Date.now() - new Date(identity.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)) + 1 : 1;

  const totalMemories = Object.values(lifecycle).reduce((s, v) => s + v, 0);

  const summary = `The creator's mind is modeled across ${Object.keys(byType).length} knowledge types, ${principles.length} constitutional principles, ${totalMemories} memories (across ${Object.keys(lifecycle).length} lifecycle stages), ${goals.length} active goals, and ${audiences.length} audience models. Authenticity is at ${(identity?.authenticityScore ?? 0) * 100 | 0}%. Trust average: ${avgTrust}/100 across ${trustProfiles.length} profiles.`;

  return {
    identity: {
      mission: identity?.mission,
      authenticityScore: identity?.authenticityScore ?? 0,
      beliefs: identity?.beliefs ?? [],
      values: identity?.values ?? [],
      frameworks: identity?.frameworks ?? [],
      version: identityVersion,
    },
    constitution: {
      principleCount: principles.length,
      categories: Array.from(new Set(principles.map((p) => p.category))),
      openViolations: violations.length,
    },
    knowledge: { nodeCount, edgeCount, byType },
    memory: { total: totalMemories, byLifecycle: lifecycle },
    goals,
    audiences,
    trust: { avgTrustScore: avgTrust, totalProfiles: trustProfiles.length, approvedCount },
    mediaDNA: { count: mediaDNA.length, types: mediaDNA.map((d) => d.type) },
    assets: { count: assetCount },
    capabilities: { total: caps.length, active: caps.filter((c) => c.status === "active").length },
    extensions: { installed: exts.filter((e) => e.status === "installed").length, total: exts.length },
    channels: { connected: channels.filter((c) => c.status === "connected").length, total: channels.length },
    summary,
  };
}

// Generate a natural-language "state of mind" brief
export async function getMindBrief(): Promise<string> {
  const mind = await getCreatorMind();
  const prompt = `You are summarizing the state of a creator's "mind" — their accumulated intelligence in the platform.

Creator Mind data:
${JSON.stringify({
  identity: { mission: mind.identity.mission, authenticity: mind.identity.authenticityScore, beliefs: mind.identity.beliefs.length, values: mind.identity.values.length, frameworks: mind.identity.frameworks.length, version: mind.identity.version },
  constitution: { principles: mind.constitution.principleCount, categories: mind.constitution.categories, openViolations: mind.constitution.openViolations },
  knowledge: { nodes: mind.knowledge.nodeCount, edges: mind.knowledge.edgeCount, types: Object.keys(mind.knowledge.byType) },
  memory: { total: mind.memory.total, lifecycle: mind.memory.byLifecycle },
  goals: mind.goals.map((g) => g.title),
  audiences: mind.audiences.map((a) => a.name),
  trust: { avg: mind.trust.avgTrustScore, profiles: mind.trust.totalProfiles },
  mediaDNA: mind.mediaDNA.types,
  capabilities: mind.capabilities.total,
  extensions: mind.extensions.installed,
  channels: mind.channels.connected,
}, null, 2)}

Write a 3-4 sentence "state of mind" brief that describes what this creator's intelligence looks like right now. Be specific and insightful — not just listing numbers, but interpreting what they mean. Mention the strongest assets and what's still developing.`;

  const { data } = await llmJson<{ brief: string }>(`${prompt}\nReturn JSON: { "brief": "..." }`, {
    system: "You are an analyst describing a creator's accumulated intelligence. Be concise and insightful. Return strict JSON.",
  });
  return data?.brief ?? mind.summary;
}
