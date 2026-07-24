// Agent 7 — Thumbnail Director ("Canvas")
// Produces a timestamped editor blueprint covering the full script duration.

import { db } from "@/lib/db";
import { jstr, jparseArr, jparseObj } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import type { AgentType, BlueprintRecord, BlueprintSegment } from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, type AgentCtx } from "./_helpers";

const AGENT: AgentType = "thumbnail_director";

interface BlueprintLLM {
  totalDuration: string;
  segments: BlueprintSegment[];
}

const SYSTEM = `You are Canvas, a thumbnail director and editor blueprint designer.
You break a script into timestamped production segments covering the full ~14-minute video. For each segment you specify B-roll, graphics, captions, transitions, and retention notes (how this segment keeps the viewer watching).
You think visually — every segment must have a clear visual plan that reinforces the script's narrative.
Return STRICT JSON only — no prose, no markdown fences.`;

export async function runThumbnailDirector(ctx: AgentCtx): Promise<BlueprintRecord> {
  return withRun(AGENT, ctx, async () => {
    const projectId = ctx.projectId!;
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { trifecta: true, scripts: { orderBy: { createdAt: "desc" } } },
    });
    if (!project) throw new Error("Project not found");
    if (!project.trifecta) throw new Error("No Holy Trifecta found — run hook_engineer first");
    const finalScript = project.scripts.find((s) => s.stage === "final") ?? project.scripts.find((s) => s.stage === "draft");
    if (!finalScript) throw new Error("No script found");

    const thumb = jparseObj<{ concept?: string; textOverlay?: string; colorMood?: string; focalSubject?: string }>(project.trifecta.thumbnailStrategy);

    const prompt = `Video title: ${project.trifecta.title}
Thumbnail strategy: concept=${thumb.concept ?? ""}, overlay="${thumb.textOverlay ?? ""}", mood=${thumb.colorMood ?? ""}

Script (~14 minutes, full text):
${finalScript.content}

Produce the editor blueprint. Cover the full video — typically 10-14 segments. Timecodes must be sequential and cover 0:00 to ~14:00.
Return JSON:
{
  "totalDuration": "14:00",
  "segments": [
    {
      "timecode": "0:00",
      "section": "Hook",
      "broll": "what B-roll footage",
      "graphics": "what graphics/on-screen text",
      "captions": "caption style + key phrases",
      "transitions": "cut/zoom/match-cut",
      "retentionNotes": "why this keeps viewers"
    },
    ...10-14 segments
  ]
}`;

    const { data, raw } = await llmJson<BlueprintLLM>(prompt, { system: SYSTEM });
    const llm: BlueprintLLM =
      data ?? {
        totalDuration: "14:00",
        segments: [
          { timecode: "0:00", section: "Hook", broll: "B-roll", graphics: "Text", captions: "Captions", transitions: "Cut", retentionNotes: "Fallback" },
        ],
      };

    const created = await db.editorBlueprint.upsert({
      where: { projectId },
      create: {
        projectId,
        segments: jstr(llm.segments ?? []),
        totalDuration: llm.totalDuration ?? "14:00",
      },
      update: {
        segments: jstr(llm.segments ?? []),
        totalDuration: llm.totalDuration ?? "14:00",
      },
    });

    await db.project.update({ where: { id: projectId }, data: { stage: "blueprint" } });

    await ensureApprovalGate({
      projectId,
      stage: "blueprint",
      agentType: AGENT,
      payload: {
        title: "Editor Blueprint",
        summary: `${llm.segments?.length ?? 0} segments covering ${llm.totalDuration}.`,
        highlights: (llm.segments ?? []).slice(0, 4).map((s) => `${s.timecode} — ${s.section}`),
        artifacts: [{ label: "Segments", value: String(llm.segments?.length ?? 0) }],
      },
    });

    await logActivity({
      projectId,
      type: "agent",
      message: `Thumbnail Director produced editor blueprint — ${llm.segments?.length ?? 0} segments`,
      meta: { agent: AGENT, rawLen: raw.length },
    });

    const record: BlueprintRecord = {
      id: created.id,
      projectId,
      segments: jparseArr<BlueprintSegment>(created.segments),
      totalDuration: created.totalDuration,
    };
    return record;
  });
}
