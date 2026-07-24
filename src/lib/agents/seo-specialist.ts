// Agent 8 — SEO Specialist ("Beacon")
// Generates upload metadata: description, chapters, tags, pinned comment, playlist, end screen.

import { db } from "@/lib/db";
import { jstr, jparseArr, jparseObj } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import type { AgentType, PublishMetadataRecord } from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, type AgentCtx } from "./_helpers";

const AGENT: AgentType = "seo_specialist";

interface SEO {
  description: string;
  chapters: { timecode: string; title: string }[];
  tags: string[];
  pinnedComment: string;
  playlist: string;
  endScreen: { type: string; target: string }[];
}

const SYSTEM = `You are Beacon, an SEO specialist for YouTube. You optimize description, chapters, tags, pinned comment, playlist placement, and end-screen strategy for discovery + retention.
Chapters must align with the editor blueprint's segment timecodes. Tags balance broad and long-tail. The pinned comment drives engagement or seeds a follow-up question.
Return STRICT JSON only — no prose, no markdown fences.`;

export async function runSeoSpecialist(ctx: AgentCtx): Promise<PublishMetadataRecord> {
  return withRun(AGENT, ctx, async () => {
    const projectId = ctx.projectId!;
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        trifecta: true,
        blueprint: true,
        scripts: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!project) throw new Error("Project not found");
    if (!project.trifecta) throw new Error("No Holy Trifecta found");

    const script = project.scripts.find((s) => s.stage === "final") ?? project.scripts.find((s) => s.stage === "draft");
    const segments = jparseArr<{ timecode: string; section: string }>(project.blueprint?.segments);

    const prompt = `Video title: ${project.trifecta.title}
Niche: ${project.niche}

Script (first 1500 chars):
${script?.content.slice(0, 1500) ?? ""}

Blueprint segment timecodes:
${JSON.stringify(segments.map((s) => ({ t: s.timecode, s: s.section })))}

Produce the upload metadata.
Return JSON:
{
  "description": "200-400 char description with hook + 1-2 sentences of value + CTA + 3-5 relevant hashtags",
  "chapters": [{ "timecode": "0:00", "title": "..." }, ...6-10 chapters matching blueprint timecodes],
  "tags": ["...", ...12-18 tags mixing broad + long-tail],
  "pinnedComment": "the pinned comment — drives engagement or seeds a question",
  "playlist": "the playlist this should be added to (name + rationale in parens)",
  "endScreen": [{ "type": "video|playlist|subscribe", "target": "what it points to" }, ...2-3 items]
}`;

    const { data, raw } = await llmJson<SEO>(prompt, { system: SYSTEM });
    const seo: SEO =
      data ?? {
        description: `${project.trifecta.title} — ${project.niche}.`,
        chapters: segments.map((s) => ({ timecode: s.timecode, title: s.section })),
        tags: [project.niche, "youtube"],
        pinnedComment: "What did you think?",
        playlist: `${project.niche} deep dives`,
        endScreen: [{ type: "subscribe", target: "channel" }],
      };

    const created = await db.publishMetadata.upsert({
      where: { projectId },
      create: {
        projectId,
        description: seo.description,
        chapters: jstr(seo.chapters ?? []),
        tags: jstr(seo.tags ?? []),
        pinnedComment: seo.pinnedComment,
        playlist: seo.playlist,
        endScreen: jstr(seo.endScreen ?? []),
      },
      update: {
        description: seo.description,
        chapters: jstr(seo.chapters ?? []),
        tags: jstr(seo.tags ?? []),
        pinnedComment: seo.pinnedComment,
        playlist: seo.playlist,
        endScreen: jstr(seo.endScreen ?? []),
      },
    });

    await db.project.update({ where: { id: projectId }, data: { stage: "metadata" } });

    await ensureApprovalGate({
      projectId,
      stage: "metadata",
      agentType: AGENT,
      payload: {
        title: "Upload Metadata",
        summary: `${seo.tags?.length ?? 0} tags, ${seo.chapters?.length ?? 0} chapters, pinned comment + end screen.`,
        highlights: [
          `Description: ${seo.description.length} chars`,
          `Tags: ${seo.tags?.length ?? 0}`,
          `Chapters: ${seo.chapters?.length ?? 0}`,
          `Playlist: ${seo.playlist}`,
        ],
        artifacts: [{ label: "Pinned comment", value: seo.pinnedComment }],
      },
    });

    await logActivity({
      projectId,
      type: "agent",
      message: `SEO Specialist produced metadata — ${seo.tags?.length ?? 0} tags, ${seo.chapters?.length ?? 0} chapters`,
      meta: { agent: AGENT, rawLen: raw.length },
    });

    const record: PublishMetadataRecord = {
      id: created.id,
      projectId,
      description: created.description,
      chapters: jparseArr(created.chapters),
      tags: jparseArr(created.tags),
      pinnedComment: created.pinnedComment,
      playlist: created.playlist,
      publishAt: created.publishAt?.toISOString() ?? null,
      endScreen: jparseArr(created.endScreen),
    };
    return record;
  });
}
