// Agent 12 — Chief Director ("Maestro")
// Orchestrator. Three actions: interview_questions, advance, generate_assets.

import { db } from "@/lib/db";
import { jstr, jparseArr, jparseObj } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import type { AgentType, AssetRecord } from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, type AgentCtx } from "./_helpers";
import { STAGE_INDEX, PIPELINE } from "@/lib/agents-registry";
import { runResearchAnalyst } from "./research-analyst";
import { runCompetitorIntelligence } from "./competitor-intelligence";
import { runStoryArchitect } from "./story-architect";
import { runScriptWriter } from "./script-writer";
import { runFactChecker } from "./fact-checker";
import { runHookEngineer } from "./hook-engineer";
import { runThumbnailDirector } from "./thumbnail-director";
import { runProductionDesigner } from "./production-designer";
import { runSeoSpecialist } from "./seo-specialist";
import { runPublishingManager } from "./publishing-manager";
import { runAnalyticsScientist } from "./analytics-scientist";

const AGENT: AgentType = "chief_director";

type Action = "interview_questions" | "advance" | "generate_assets";

interface InterviewQuestionsLLM {
  questions: { question: string; themeTag: string }[];
}

interface AssetSpec {
  type: AssetRecord["type"];
  title: string;
  prompt: string;
  spec: Record<string, unknown>;
}

interface AssetsLLM {
  assets: AssetSpec[];
}

const SYSTEM = `You are Maestro, the Chief Creative Director orchestrating a YouTube production pipeline.
You think in terms of editorial coherence, originality, and creator authenticity. You route work between specialists.
Return STRICT JSON only — no prose, no markdown fences.`;

export async function runChiefDirector(
  ctx: AgentCtx & { action?: Action },
): Promise<unknown> {
  const action = (ctx.action ?? (ctx.input?.action as Action) ?? "advance") as Action;
  return withRun(AGENT, { ...ctx, input: { ...ctx.input, action } }, async () => {
    const projectId = ctx.projectId;
    if (!projectId) throw new Error("projectId is required for chief_director");

    if (action === "interview_questions") {
      return interviewQuestions(projectId);
    }
    if (action === "generate_assets") {
      return generateAssets(projectId);
    }
    // advance
    return advance(projectId, ctx.input);
  });
}

async function interviewQuestions(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { opportunity: true, dossier: true, interviews: true },
  });
  if (!project) throw new Error("Project not found");
  const dossier = project.dossier;
  const niche = project.opportunity?.niche ?? project.niche;
  const angle = project.opportunity?.angle ?? project.brief ?? "";
  const existing = project.interviews.map((i) => i.question);

  const prompt = `Niche: "${niche}"
Opportunity angle: "${angle}"
Dossier summary: ${dossier?.summary ?? ""}
Dossier knowledge gaps: ${dossier?.knowledgeGaps ?? "[]"}
Existing interview questions already asked (avoid duplicates): ${JSON.stringify(existing)}

Generate 5-8 interview questions for the creator that surface ORIGINAL expertise, opinions, stories, and war-stories NOT already in the research. These should reveal what only the creator can say — lived experience, contrarian takes, surprising stories.
Return JSON:
{
  "questions": [
    { "question": "...", "themeTag": "expertise|opinion|story|war_story|contrarian" },
    ...5-8 items
  ]
}`;

  const { data, raw } = await llmJson<InterviewQuestionsLLM>(prompt, { system: SYSTEM });
  const qs = (data?.questions ?? []).slice(0, 8);
  if (qs.length === 0) {
    throw new Error("LLM produced no interview questions");
  }

  const created = [];
  for (const q of qs) {
    const row = await db.creatorInterview.create({
      data: { projectId, question: q.question, answer: "", themeTag: q.themeTag },
    });
    created.push({ id: row.id, question: row.question, themeTag: row.themeTag, answer: "" });
  }

  await db.project.update({ where: { id: projectId }, data: { stage: "interview" } });

  await ensureApprovalGate({
    projectId,
    stage: "interview",
    agentType: AGENT,
    payload: {
      title: "Creator Interview Questions",
      summary: `${created.length} questions targeting original expertise & war-stories.`,
      highlights: created.map((q) => `[${q.themeTag}] ${q.question.slice(0, 80)}`),
      artifacts: [{ label: "Questions", value: String(created.length) }],
    },
  });

  await logActivity({
    projectId,
    type: "agent",
    message: `Chief Director generated ${created.length} interview questions`,
    meta: { agent: AGENT, action: "interview_questions", count: created.length, rawLen: raw.length },
  });
  return { questions: created };
}

async function generateAssets(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { blueprint: true, trifecta: true, scripts: { orderBy: { createdAt: "desc" } } },
  });
  if (!project) throw new Error("Project not found");
  const script = project.scripts[0];
  const segments = jparseArr<{ timecode: string; section: string; broll: string; graphics: string }>(project.blueprint?.segments);

  const prompt = `Video title: ${project.trifecta?.title ?? project.title}
Niche: ${project.niche}

Blueprint segments:
${JSON.stringify(segments.slice(0, 8))}

Script (first 1200 chars):
${script?.content.slice(0, 1200) ?? ""}

Generate asset specs for this video — diagrams, infographics, social cuts, repurposed blog/short, and a thumbnail concept.
Return JSON:
{
  "assets": [
    {
      "type": "diagram|infographic|social|repurposed_short|repurposed_blog|thumbnail_concept",
      "title": "short title",
      "prompt": "the prompt a designer/AI would use to produce this asset — be specific about content, style, dimensions",
      "spec": { ... arbitrary spec fields like dimensions, format, references ... }
    },
    ...4-7 assets
  ]
}`;

  const { data, raw } = await llmJson<AssetsLLM>(prompt, { system: SYSTEM });
  const assets = data?.assets ?? [];

  const created: AssetRecord[] = [];
  for (const a of assets.slice(0, 8)) {
    const row = await db.asset.create({
      data: {
        projectId,
        type: a.type,
        title: a.title,
        prompt: a.prompt,
        status: "pending",
        spec: jstr(a.spec ?? {}),
      },
    });
    created.push({
      id: row.id,
      projectId,
      type: row.type as AssetRecord["type"],
      title: row.title,
      prompt: row.prompt,
      status: "pending",
      url: null,
      spec: jparseObj(row.spec),
    });
  }

  await db.project.update({ where: { id: projectId }, data: { stage: "assets" } });

  await logActivity({
    projectId,
    type: "agent",
    message: `Chief Director generated ${created.length} asset specs`,
    meta: { agent: AGENT, action: "generate_assets", count: created.length, rawLen: raw.length },
  });
  return created;
}

async function advance(projectId: string, input?: Record<string, unknown>) {
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");

  const currentIdx = STAGE_INDEX[project.stage] ?? 0;
  const currentStage = PIPELINE[currentIdx];
  if (!currentStage) {
    return { message: `Unknown stage "${project.stage}".`, stage: project.stage };
  }

  // If current stage has a pending approval gate, refuse to advance — the creator
  // must approve or reject the gate first (preserves human-in-the-loop).
  if (currentStage.requiresApproval) {
    const pending = await db.approvalGate.findFirst({
      where: { projectId, stage: project.stage, status: "pending" },
    });
    if (pending) {
      return {
        message: `Cannot advance — stage "${project.stage}" has a pending approval gate (${pending.id}). Approve or reject it first.`,
        stage: project.stage,
        blockingGateId: pending.id,
      };
    }
  }

  // Dispatch to the agent for the CURRENT project.stage.
  // After approval, project.stage moves to the next pipeline stage; advance then
  // produces the work for that stage.
  const targetAgent = currentStage.agent;
  // Override: the dossier stage now dispatches to competitor_intelligence (Scout)
  // for the real deep-video analysis, instead of research_analyst. The research_analyst
  // can still be invoked explicitly via /api/agents/run.
  if (currentStage.key === "dossier") {
    return runCompetitorIntelligence({ projectId, input });
  }
  switch (targetAgent) {
    case "opportunity_hunter":
      // Re-running opportunity_hunter would create a NEW project; refuse here.
      return {
        message: "Opportunity Hunter runs standalone (POST /api/opportunities). It cannot be advanced from within a project.",
        stage: project.stage,
      };
    case "research_analyst":
      return runResearchAnalyst({ projectId });
    case "competitor_intelligence":
      return runCompetitorIntelligence({ projectId, input });
    case "chief_director":
      // current stage is "interview" — produce interview questions
      return interviewQuestions(projectId);
    case "story_architect": {
      const target = currentStage.key === "expanded" ? "expanded" : "outline";
      return runStoryArchitect({ projectId, stage: target });
    }
    case "script_writer": {
      const target = currentStage.key === "final" ? "final" : "draft";
      return runScriptWriter({ projectId, stage: target });
    }
    case "fact_checker":
      return runFactChecker({ projectId });
    case "hook_engineer":
      return runHookEngineer({ projectId });
    case "thumbnail_director":
      return runThumbnailDirector({ projectId });
    case "production_designer":
      return runProductionDesigner({ projectId });
    case "seo_specialist":
      return runSeoSpecialist({ projectId });
    case "publishing_manager":
      return runPublishingManager({ projectId, input });
    case "analytics_scientist":
      return runAnalyticsScientist({ projectId, input });
    case "knowledge_curator":
      // current stage is "assets" — generate assets instead (knowledge_curator runs explicitly)
      return generateAssets(projectId);
    default:
      throw new Error(`Cannot advance — unknown agent "${targetAgent}" for stage "${currentStage.key}"`);
  }
}
