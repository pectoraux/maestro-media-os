// Agent 3 — Story Architect ("Verity")
// Designs narrative structure: outline → expanded outline, with retention hooks.

import { db } from "@/lib/db";
import { jparseArr } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import type { AgentType } from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, type AgentCtx } from "./_helpers";

const AGENT: AgentType = "story_architect";

interface ScriptResult {
  content: string;
  version: number;
  notes: string;
}

const SYSTEM = `You are Verity, a story architect who designs durable narrative structures for long-form YouTube essays.
You anchor every outline on (a) the creator's own interviews — original opinions, stories, war stories — and (b) editorial rules:
- Open with a curiosity gap, not a thesis.
- Each section must escalate stakes or specificity.
- Plant payoffs early; deliver them later.
- Vary rhythm: data → story → mechanism → implication.
- End on a forward-looking implication, never a recap.
Return STRICT JSON only — no prose, no markdown fences.`;

export async function runStoryArchitect(ctx: AgentCtx & { stage: "outline" | "expanded" }): Promise<ScriptResult> {
  return withRun(AGENT, ctx, async () => {
    const projectId = ctx.projectId!;
    const stage = ctx.stage;
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        opportunity: true,
        dossier: true,
        interviews: true,
        scripts: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!project) throw new Error("Project not found");

    const niche = project.opportunity?.niche ?? project.niche;
    const angle = project.opportunity?.angle ?? project.brief ?? "";
    const dossierSummary = project.dossier?.summary ?? "";
    const audienceInsights = jparseArr<string>(project.dossier?.audienceInsights);
    const knowledgeGaps = jparseArr<string>(project.dossier?.knowledgeGaps);
    const interviews = project.interviews.map((i) => ({ q: i.question, a: i.answer, tag: i.themeTag }));
    const creatorVoice = `Original creator interviews: ${interviews.length ? JSON.stringify(interviews) : "(none yet — rely on dossier + angle)"}`;

    if (stage === "outline") {
      const prompt = `Niche: "${niche}"
Opportunity angle: "${angle}"
Dossier summary: "${dossierSummary}"
Audience insights: ${JSON.stringify(audienceInsights)}
Knowledge gaps: ${JSON.stringify(knowledgeGaps)}
${creatorVoice}

Design the narrative OUTLINE for this video (~14 minutes).
Return JSON in EXACTLY this shape:
{
  "content": "## Title\\n\\n## Section 1: <hook>\\n- ...\\n\\n## Section 2: ...\\n\\n## Section 3: ...\\n\\n## Section 4: ...\\n\\n## Section 5: <payoff/implication>",
  "notes": "3-5 bullet editorial notes — what makes this structure work, where the curiosity gap is, what the payoff plants are."
}
Use markdown headings (##) for sections. Cover 5-7 sections. Each section: 2-4 bullet points of what it covers.`;

      const { data, raw } = await llmJson<{ content: string; notes: string }>(prompt, { system: SYSTEM });
      const content = data?.content ?? `## Outline (fallback)\n\n1. Hook\n2. Context\n3. Mechanism\n4. Story\n5. Implication`;
      const notes = data?.notes ?? "Fallback outline — LLM JSON parse failed.";

      const version = await nextVersion(projectId, "outline");
      await db.script.create({
        data: { projectId, stage: "outline", content, version, notes },
      });
      await db.project.update({ where: { id: projectId }, data: { stage: "outline", status: "scripting" } });

      await ensureApprovalGate({
        projectId,
        stage: "outline",
        agentType: AGENT,
        payload: {
          title: "Narrative Outline",
          summary: `Outline with ${content.split(/^## /m).length - 1} sections anchored on creator interviews + editorial rules.`,
          highlights: notes.split(/\n/).filter(Boolean).slice(0, 4),
          artifacts: [{ label: "Stage", value: "outline" }],
        },
      });
      await logActivity({
        projectId,
        type: "agent",
        message: `Story Architect generated outline v${version}`,
        meta: { agent: AGENT, stage: "outline", rawLen: raw.length },
      });
      return { content, version, notes };
    }

    // expanded
    const outlineRow = project.scripts.find((s) => s.stage === "outline");
    if (!outlineRow) throw new Error("No approved outline found — run stage=outline first");

    const prompt = `Niche: "${niche}"
Angle: "${angle}"
Approved outline:
${outlineRow.content}

${creatorVoice}

Expand the outline into a DETAILED expanded outline. For each section produce: (a) the key beats (3-6), (b) the retention hook for that section (what keeps the viewer watching), (c) any specific examples/data/stories to include, (d) a transition into the next section.
Return JSON:
{
  "content": "## Section 1: <title>\\n**Beats:** ...\\n**Retention hook:** ...\\n**Examples:** ...\\n**Transition:** ...\\n\\n## Section 2: ...",
  "notes": "3-5 bullets on pacing, where retention risk is highest, and which beats need fact-check."
}`;

    const { data, raw } = await llmJson<{ content: string; notes: string }>(prompt, { system: SYSTEM });
    const content = data?.content ?? `## Expanded outline (fallback)\n\n${outlineRow.content}`;
    const notes = data?.notes ?? "Fallback expanded outline — LLM JSON parse failed.";

    const version = await nextVersion(projectId, "expanded_outline");
    await db.script.create({
      data: { projectId, stage: "expanded_outline", content, version, notes },
    });
    await db.project.update({ where: { id: projectId }, data: { stage: "expanded" } });

    await ensureApprovalGate({
      projectId,
      stage: "expanded",
      agentType: AGENT,
      payload: {
        title: "Expanded Outline",
        summary: "Detailed beats + retention hooks per section.",
        highlights: notes.split(/\n/).filter(Boolean).slice(0, 4),
        artifacts: [{ label: "Stage", value: "expanded_outline" }],
      },
    });
    await logActivity({
      projectId,
      type: "agent",
      message: `Story Architect generated expanded outline v${version}`,
      meta: { agent: AGENT, stage: "expanded", rawLen: raw.length },
    });
    return { content, version, notes };
  });
}

async function nextVersion(projectId: string, stage: string): Promise<number> {
  const count = await db.script.count({ where: { projectId, stage } });
  return count + 1;
}
