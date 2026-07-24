// Agent 11 — Knowledge Curator ("Mnemos")
// Extracts reusable knowledge from a project + updates creator voice distinctiveness.

import { db } from "@/lib/db";
import { jstr, jparseArr, jparseObj } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import type { AgentType, KnowledgeNodeRecord } from "@/lib/types";
import { withRun, logActivity, type AgentCtx } from "./_helpers";

const AGENT: AgentType = "knowledge_curator";

interface KnowledgeExtract {
  audienceInsights: { label: string; content: string }[];
  voicePatterns: { label: string; content: string }[];
  editorialLearnings: { label: string; content: string }[];
  competitorGaps: { label: string; content: string }[];
  edges: { sourceLabel: string; targetLabel: string; relation: string }[];
  distinctivenessScore?: number;
}

const SYSTEM = `You are Mnemos, a knowledge curator who extracts durable, reusable knowledge from completed production work.
You write knowledge nodes as concise, transferable heuristics — not project-specific notes. You find cross-project patterns. You connect related nodes with explicit relations.
Return STRICT JSON only — no prose, no markdown fences.`;

export async function runKnowledgeCurator(ctx: AgentCtx): Promise<{
  nodesCreated: number;
  edgesCreated: number;
  nodes: KnowledgeNodeRecord[];
}> {
  return withRun(AGENT, ctx, async () => {
    const projectId = ctx.projectId!;
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        opportunity: true,
        dossier: true,
        interviews: true,
        trifecta: true,
        blueprint: true,
        scripts: { orderBy: { createdAt: "desc" } },
        metrics: { orderBy: { recordedAt: "desc" }, take: 1 },
      },
    });
    if (!project) throw new Error("Project not found");

    const dossier = project.dossier;
    const creator = await db.creatorProfile.findFirst();
    const voice = creator ? jparseObj<{ tone?: string; signatures?: string[] }>(creator.voiceProfile) : {};

    const prompt = `Project: "${project.title}" (niche: ${project.niche})
Stage: ${project.stage}

OPPORTUNITY angle: ${project.opportunity?.angle ?? "(none)"}
Score breakdown: ${project.opportunity?.scoreBreakdown ?? "{}"}

DOSSIER:
- summary: ${dossier?.summary ?? ""}
- audience insights: ${dossier?.audienceInsights ?? "[]"}
- knowledge gaps: ${dossier?.knowledgeGaps ?? "[]"}
- competitors: ${dossier?.competitors ?? "[]"}

CREATOR INTERVIEWS:
${JSON.stringify(project.interviews.map((i) => ({ q: i.question, a: i.answer })))}

CREATOR VOICE:
${JSON.stringify(voice)}

TRIFECTA: ${project.trifecta ? JSON.stringify({ title: project.trifecta.title, hook: project.trifecta.openingHook, rationale: project.trifecta.rationale }) : "(none)"}

PERFORMANCE: ${project.metrics[0] ? JSON.stringify({ ctr: project.metrics[0].ctr, retention: project.metrics[0].retention, views: project.metrics[0].views }) : "(none)"}

Extract durable knowledge from this project that should persist and inform future videos.
Return JSON:
{
  "audienceInsights": [{ "label": "short label", "content": "1-2 sentence transferable insight" }, ...2-4 items],
  "voicePatterns": [{ "label": "...", "content": "..." }, ...2-4 items — specific creator voice patterns],
  "editorialLearnings": [{ "label": "...", "content": "..." }, ...2-4 items — what editorial choices worked/didn't],
  "competitorGaps": [{ "label": "...", "content": "..." }, ...1-3 items — gaps competitors aren't covering],
  "edges": [{ "sourceLabel": "...", "targetLabel": "...", "relation": "supports|contradicts|derived_from|related_to" }, ...optional],
  "distinctivenessScore": N (0-100, how distinctive is this creator's voice vs generic LLM voice?)
}`;

    const { data, raw } = await llmJson<KnowledgeExtract>(prompt, { system: SYSTEM });
    const ext: KnowledgeExtract =
      data ?? {
        audienceInsights: [],
        voicePatterns: [],
        editorialLearnings: [],
        competitorGaps: [],
        edges: [],
        distinctivenessScore: 50,
      };

    const created: KnowledgeNodeRecord[] = [];
    const labelToId = new Map<string, string>();

    const mk = async (type: KnowledgeNodeRecord["type"], label: string, content: string) => {
      const node = await db.knowledgeNode.create({
        data: { type, label, content, weight: 1, projectId },
      });
      labelToId.set(label, node.id);
      created.push({
        id: node.id,
        type,
        label,
        content,
        weight: 1,
        projectId,
        createdAt: node.createdAt.toISOString(),
        connections: 0,
      });
    };

    for (const a of ext.audienceInsights ?? []) await mk("audience_insight", a.label, a.content);
    for (const v of ext.voicePatterns ?? []) await mk("creator_voice", v.label, v.content);
    for (const e of ext.editorialLearnings ?? []) await mk("editorial", e.label, e.content);
    for (const c of ext.competitorGaps ?? []) await mk("competitor", c.label, c.content);

    let edgesCreated = 0;
    for (const edge of ext.edges ?? []) {
      const sourceId = labelToId.get(edge.sourceLabel);
      const targetId = labelToId.get(edge.targetLabel);
      if (sourceId && targetId) {
        await db.knowledgeEdge.create({ data: { sourceId, targetId, relation: edge.relation, weight: 1 } });
        edgesCreated++;
      }
    }

    // Update creator distinctiveness
    if (creator && typeof ext.distinctivenessScore === "number") {
      const newScore = Math.max(0, Math.min(100, ext.distinctivenessScore));
      await db.creatorProfile.update({
        where: { id: creator.id },
        data: { distinctivenessScore: newScore },
      });
    }

    await logActivity({
      projectId,
      type: "agent",
      message: `Knowledge Curator extracted ${created.length} nodes + ${edgesCreated} edges from project`,
      meta: { agent: AGENT, nodesCreated: created.length, edgesCreated, rawLen: raw.length },
    });

    return { nodesCreated: created.length, edgesCreated, nodes: created };
  });
}
