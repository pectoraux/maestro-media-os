// Agent 6 — Hook Engineer ("Spark")
// Produces the Holy Trifecta: title + thumbnail strategy + opening hook, as one aligned unit.

import { db } from "@/lib/db";
import { jstr, jparseObj, jparseArr } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import type { AgentType, TrifectaRecord } from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, type AgentCtx } from "./_helpers";

const AGENT: AgentType = "hook_engineer";

interface Trifecta {
  title: string;
  thumbnailStrategy: {
    concept: string;
    textOverlay: string;
    focalSubject: string;
    colorMood: string;
    emotion: string;
  };
  openingHook: string;
  rationale: string;
  variants: { title: string; hook: string }[];
  expectationMatch: string;
}

const SYSTEM = `You are Spark, a hook engineer who designs the "Holy Trifecta" — title, thumbnail, and opening 30 seconds — as a single coordinated unit.
The trifecta must satisfy expectation matching: the title promises X, the thumbnail promises X, the hook delivers X within 15 seconds.
You engineer curiosity gaps, never clickbait. You maximize first-30s retention without lying.
Return STRICT JSON only — no prose, no markdown fences.`;

export async function runHookEngineer(ctx: AgentCtx): Promise<TrifectaRecord> {
  return withRun(AGENT, ctx, async () => {
    const projectId = ctx.projectId!;
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { scripts: { orderBy: { createdAt: "desc" } } },
    });
    if (!project) throw new Error("Project not found");

    // Pull final or draft script + creator voice
    const finalScript = project.scripts.find((s) => s.stage === "final") ?? project.scripts.find((s) => s.stage === "draft");
    if (!finalScript) throw new Error("No script found — run script_writer first");

    let voice: { tone?: string; signatures?: string[] } = {};
    const creator = await db.creatorProfile.findFirst();
    if (creator) voice = jparseObj(creator.voiceProfile);

    const prompt = `Project title: ${project.title}
Niche: ${project.niche}

Script (final/draft) — first 600 chars + last 400 chars:
${finalScript.content.slice(0, 600)}
...
${finalScript.content.slice(-400)}

Creator voice — tone: ${voice.tone ?? "(unspecified)"}; signatures: ${JSON.stringify(voice.signatures ?? [])}

Produce the Holy Trifecta. The title must be 50-70 chars, specific, curiosity-driven. The thumbnail strategy must visually echo the title. The opening hook must deliver on the title's promise within 15 seconds.
Return JSON:
{
  "title": "...",
  "thumbnailStrategy": {
    "concept": "what the thumbnail shows — composition",
    "textOverlay": "short text on thumbnail (max 5 words)",
    "focalSubject": "the central visual element",
    "colorMood": "color palette + emotional tone",
    "emotion": "the emotion the thumbnail should evoke"
  },
  "openingHook": "the first 30-60 seconds of script, spoken word",
  "rationale": "3-4 sentences on why this trifecta works",
  "variants": [{ "title": "...", "hook": "..." }, ...3 alternates],
  "expectationMatch": "1-2 sentences on how title/thumbnail/hook align"
}`;

    const { data, raw } = await llmJson<Trifecta>(prompt, { system: SYSTEM });
    const t: Trifecta =
      data ?? {
        title: project.title,
        thumbnailStrategy: { concept: "Concept", textOverlay: "Text", focalSubject: "Subject", colorMood: "Mood", emotion: "Curiosity" },
        openingHook: "[Hook fallback — LLM JSON parse failed]",
        rationale: "Fallback trifecta.",
        variants: [],
        expectationMatch: "",
      };

    const created = await db.holyTrifecta.upsert({
      where: { projectId },
      create: {
        projectId,
        title: t.title,
        thumbnailStrategy: jstr(t.thumbnailStrategy),
        openingHook: t.openingHook,
        rationale: t.rationale,
        variants: jstr(t.variants ?? []),
        expectationMatch: t.expectationMatch,
      },
      update: {
        title: t.title,
        thumbnailStrategy: jstr(t.thumbnailStrategy),
        openingHook: t.openingHook,
        rationale: t.rationale,
        variants: jstr(t.variants ?? []),
        expectationMatch: t.expectationMatch,
      },
    });

    await db.project.update({ where: { id: projectId }, data: { stage: "trifecta" } });

    await ensureApprovalGate({
      projectId,
      stage: "trifecta",
      agentType: AGENT,
      payload: {
        title: `Trifecta: ${t.title}`,
        summary: t.rationale,
        highlights: [
          `Thumbnail: ${t.thumbnailStrategy.textOverlay} — ${t.thumbnailStrategy.focalSubject}`,
          `${t.variants?.length ?? 0} alternate variants`,
          `Hook length: ${t.openingHook.length} chars`,
        ],
        artifacts: [
          { label: "Title", value: t.title },
          { label: "Hook", value: t.openingHook.slice(0, 120) },
          { label: "Expectation match", value: t.expectationMatch },
        ],
      },
    });

    await logActivity({
      projectId,
      type: "agent",
      message: `Hook Engineer produced Holy Trifecta — "${t.title}"`,
      meta: { agent: AGENT, rawLen: raw.length },
    });

    const record: TrifectaRecord = {
      id: created.id,
      projectId,
      title: created.title,
      thumbnailStrategy: jparseObj(created.thumbnailStrategy),
      openingHook: created.openingHook,
      rationale: created.rationale,
      variants: jparseArr(created.variants),
      expectationMatch: created.expectationMatch,
    };
    return record;
  });
}
