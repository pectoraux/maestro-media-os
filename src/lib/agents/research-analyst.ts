// Agent 2 — Research Analyst ("Sage")
// Assembles a research dossier: market data, competitors, audience, news, references, gaps.

import { db } from "@/lib/db";
import { jstr } from "@/lib/json";
import { webSearch, llmJson } from "@/lib/zai";
import type { AgentType, DossierRecord } from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, type AgentCtx } from "./_helpers";

const AGENT: AgentType = "research_analyst";

function asArr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

interface LLMDossier {
  summary: string;
  marketData: { label: string; value: string }[];
  competitors: { channel: string; positioning: string; weakness: string }[];
  audienceInsights: string[];
  news: { title: string; source: string; date: string; relevance: string }[];
  references: { title: string; url: string; note: string }[];
  knowledgeGaps: string[];
}

const SYSTEM = `You are Sage, a meticulous research analyst who builds factual, well-cited dossiers.
You distinguish signal from noise. You flag knowledge gaps explicitly. You never invent URLs — only cite URLs that appear in the provided search results.
Return STRICT JSON only — no prose, no markdown fences.`;

export async function runResearchAnalyst(ctx: AgentCtx): Promise<DossierRecord> {
  return withRun(AGENT, ctx, async () => {
    const projectId = ctx.projectId!;
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { opportunity: true },
    });
    if (!project) throw new Error("Project not found");
    const niche = project.opportunity?.niche ?? project.niche;
    const oppAngle = project.opportunity?.angle ?? project.brief ?? "";

    const [market, comp, pain] = await Promise.all([
      webSearch(`${niche} market data 2024`, 8),
      webSearch(`${niche} competitor analysis youtube`, 8),
      webSearch(`${niche} audience pain points reddit`, 6),
    ]);
    const sources = [...market, ...comp, ...pain].slice(0, 24).map((s) => ({
      url: s.url,
      name: s.name,
      snippet: s.snippet,
      host: s.host_name,
      date: s.date,
    }));

    const prompt = `Niche: "${niche}"
Opportunity angle: "${oppAngle}"

Search results (top 24):
${JSON.stringify(sources, null, 2)}

Synthesize a research dossier.
Return JSON in EXACTLY this shape:
{
  "summary": "3-4 sentence executive summary of the niche + opportunity landscape.",
  "marketData": [{ "label": "...", "value": "..." }, ...4-7 items — concrete numbers/size/growth with sources],
  "competitors": [{ "channel": "...", "positioning": "...", "weakness": "the specific content gap" }, ...3-5 items],
  "audienceInsights": ["...", ...4-6 items — what the audience wants, fears, misunderstands],
  "news": [{ "title": "...", "source": "host_name", "date": "...", "relevance": "why it matters" }, ...3-5 items],
  "references": [{ "title": "...", "url": "<only from provided search results>", "note": "..." }, ...4-6 items],
  "knowledgeGaps": ["...", ...3-5 items — what NO current creator is covering well]
}`;

    const { data, raw } = await llmJson<LLMDossier>(prompt, { system: SYSTEM });
    const llm: LLMDossier =
      data ?? {
        summary: `Research dossier for ${niche} (fallback — LLM JSON parse failed).`,
        marketData: [],
        competitors: [],
        audienceInsights: [],
        news: [],
        references: sources.slice(0, 4).map((s) => ({ title: s.name, url: s.url, note: s.snippet.slice(0, 80) })),
        knowledgeGaps: [],
      };

    const created = await db.researchDossier.upsert({
      where: { projectId },
      create: {
        projectId,
        summary: llm.summary,
        marketData: jstr(llm.marketData ?? []),
        competitors: jstr(llm.competitors ?? []),
        audienceInsights: jstr(llm.audienceInsights ?? []),
        news: jstr(llm.news ?? []),
        references: jstr(llm.references ?? []),
        knowledgeGaps: jstr(llm.knowledgeGaps ?? []),
      },
      update: {
        summary: llm.summary,
        marketData: jstr(llm.marketData ?? []),
        competitors: jstr(llm.competitors ?? []),
        audienceInsights: jstr(llm.audienceInsights ?? []),
        news: jstr(llm.news ?? []),
        references: jstr(llm.references ?? []),
        knowledgeGaps: jstr(llm.knowledgeGaps ?? []),
      },
    });

    await db.project.update({ where: { id: projectId }, data: { stage: "dossier", status: "research" } });

    await ensureApprovalGate({
      projectId,
      stage: "dossier",
      agentType: AGENT,
      payload: {
        title: "Research Dossier",
        summary: llm.summary,
        highlights: [
          `${(llm.marketData ?? []).length} market data points`,
          `${(llm.competitors ?? []).length} competitors analyzed`,
          `${(llm.audienceInsights ?? []).length} audience insights`,
          `${(llm.knowledgeGaps ?? []).length} knowledge gaps identified`,
        ],
        artifacts: [
          { label: "Niche", value: niche },
          { label: "Angle", value: oppAngle },
          { label: "Summary", value: llm.summary },
        ],
      },
    });

    await logActivity({
      projectId,
      type: "agent",
      message: `Research Analyst assembled dossier — ${llm.marketData?.length ?? 0} data points, ${llm.knowledgeGaps?.length ?? 0} gaps`,
      meta: { agent: AGENT, rawLen: raw.length },
    });

    const record: DossierRecord = {
      id: created.id,
      projectId,
      summary: created.summary,
      marketData: asArr(llm.marketData),
      competitors: asArr(llm.competitors),
      audienceInsights: asArr(llm.audienceInsights),
      news: asArr(llm.news),
      references: asArr(llm.references),
      knowledgeGaps: asArr(llm.knowledgeGaps),
    };
    return record;
  });
}
