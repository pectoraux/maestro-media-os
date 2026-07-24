// Agent 4 — Script Writer ("Quill")
// Drafts the script in the creator's voice, then applies fact-check revisions to a final.

import { db } from "@/lib/db";
import { jparseObj, jparseArr } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import type { AgentType } from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, type AgentCtx } from "./_helpers";

const AGENT: AgentType = "script_writer";

interface ScriptResult {
  content: string;
  version: number;
  notes: string;
}

const SYSTEM = `You are Quill, a script writer who writes in the creator's exact voice — preserving their tone, pacing, vocabulary, and signature phrases.
You write spoken-word scripts, not essays. You include only material the creator would actually say.
You weave in the creator's own interview answers (opinions, stories, war-stories) authentically — never paraphrasing them into something generic.
Return STRICT JSON only — no prose, no markdown fences.`;

export async function runScriptWriter(ctx: AgentCtx & { stage: "draft" | "final" }): Promise<ScriptResult> {
  return withRun(AGENT, ctx, async () => {
    const projectId = ctx.projectId!;
    const stage = ctx.stage;
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        interviews: true,
        scripts: { orderBy: { createdAt: "asc" } },
        agentRuns: { where: { agentType: "fact_checker" }, orderBy: { createdAt: "desc" }, take: 1 },
        approvals: { where: { stage: "factcheck" }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!project) throw new Error("Project not found");

    // Load creator profile (first one)
    const creator = await db.creatorProfile.findFirst();
    const voice = creator ? jparseObj<{ tone?: string; pacing?: string; vocabulary?: string; signatures?: string[] }>(creator.voiceProfile) : {};
    const expertise = jparseArr(creator?.expertise);
    const recurringThemes = jparseArr(creator?.recurringThemes);

    const interviews = project.interviews.map((i) => `Q: ${i.question}\nA: ${i.answer}`);
    const interviewBlock = interviews.length ? interviews.join("\n\n") : "(no creator interviews yet)";

    if (stage === "draft") {
      const expanded = project.scripts.find((s) => s.stage === "expanded_outline") ?? project.scripts.find((s) => s.stage === "outline");
      if (!expanded) throw new Error("No expanded outline found — run story_architect stage=expanded first");

      const prompt = `Creator voice profile:
- Tone: ${voice.tone ?? "(unspecified)"}
- Pacing: ${voice.pacing ?? "(unspecified)"}
- Vocabulary: ${voice.vocabulary ?? "(unspecified)"}
- Signature phrases: ${JSON.stringify(voice.signatures ?? [])}
- Expertise: ${JSON.stringify(expertise)}
- Recurring themes: ${JSON.stringify(recurringThemes)}

Expanded outline to draft from:
${expanded.content}

Creator interviews (use these AUTHENTICALLY — these are the creator's actual words/opinions):
${interviewBlock}

Write the FULL SPOKEN-WORD SCRIPT (~14 minutes, ~2000-2400 words). Use the creator's voice. Weave in interview answers verbatim where they fit. Use verbal cues like (pause), (emphasis), [B-roll: ...] sparingly.
Return JSON:
{
  "content": "the full script as markdown — ## Section headings + spoken paragraphs",
  "notes": "3-5 bullets on voice choices made, where you used interview material, and what may need fact-check."
}`;

      const { data, raw } = await llmJson<{ content: string; notes: string }>(prompt, { system: SYSTEM });
      const content = data?.content ?? "## Script (fallback)\n\n[Script draft — LLM JSON parse failed]";
      const notes = data?.notes ?? "Fallback draft.";

      const version = await nextVersion(projectId, "draft");
      await db.script.create({ data: { projectId, stage: "draft", content, version, notes } });
      await db.project.update({ where: { id: projectId }, data: { stage: "draft" } });

      await ensureApprovalGate({
        projectId,
        stage: "draft",
        agentType: AGENT,
        payload: {
          title: "Script Draft",
          summary: `Full draft in creator voice (~${Math.round(content.length / 6)} min read).`,
          highlights: notes.split(/\n/).filter(Boolean).slice(0, 4),
          artifacts: [{ label: "Stage", value: "draft" }],
        },
      });
      await logActivity({
        projectId,
        type: "agent",
        message: `Script Writer drafted v${version} in creator voice`,
        meta: { agent: AGENT, stage: "draft", rawLen: raw.length },
      });
      return { content, version, notes };
    }

    // final
    const draft = project.scripts.find((s) => s.stage === "draft");
    if (!draft) throw new Error("No draft script found — run script_writer stage=draft first");

    // Pull fact-check findings from the most recent fact_checker AgentRun output, falling back to the approval payload.
    let factCheck: unknown = null;
    const fcRun = project.agentRuns[0];
    if (fcRun) {
      try {
        factCheck = JSON.parse(fcRun.output);
      } catch {
        factCheck = null;
      }
    }
    if (!factCheck && project.approvals[0]) {
      try {
        factCheck = JSON.parse(project.approvals[0].payload);
      } catch {
        factCheck = null;
      }
    }

    const prompt = `Creator voice profile:
- Tone: ${voice.tone ?? "(unspecified)"}
- Pacing: ${voice.pacing ?? "(unspecified)"}
- Vocabulary: ${voice.vocabulary ?? "(unspecified)"}
- Signatures: ${JSON.stringify(voice.signatures ?? [])}

DRAFT SCRIPT (to be revised into final):
${draft.content}

FACT-CHECK FINDINGS (apply revisions; if absent, just polish):
${JSON.stringify(factCheck) ?? "(none)"}

Produce the FINAL script. Apply every fact-check correction. Preserve the creator's voice. Tighten pacing where the draft rambles. Add [CITATION: ...] inline notes where claims were verified/revised.
Return JSON:
{
  "content": "the final polished script as markdown",
  "notes": "3-5 bullets on what changed from draft, which fact-check findings were applied, any remaining open risks."
}`;

    const { data, raw } = await llmJson<{ content: string; notes: string }>(prompt, { system: SYSTEM });
    const content = data?.content ?? draft.content;
    const notes = data?.notes ?? "Fallback final (used draft as-is).";

    const version = await nextVersion(projectId, "final");
    await db.script.create({ data: { projectId, stage: "final", content, version, notes } });
    await db.project.update({ where: { id: projectId }, data: { stage: "final", status: "packaging" } });

    await ensureApprovalGate({
      projectId,
      stage: "final",
      agentType: AGENT,
      payload: {
        title: "Final Script",
        summary: `Final script — fact-check revisions applied. v${version}.`,
        highlights: notes.split(/\n/).filter(Boolean).slice(0, 4),
        artifacts: [{ label: "Stage", value: "final" }],
      },
    });
    await logActivity({
      projectId,
      type: "agent",
      message: `Script Writer produced final v${version} — fact-check applied`,
      meta: { agent: AGENT, stage: "final", rawLen: raw.length },
    });
    return { content, version, notes };
  });
}

async function nextVersion(projectId: string, stage: string): Promise<number> {
  const count = await db.script.count({ where: { projectId, stage } });
  return count + 1;
}
