// Production Designer — scene-by-scene breakdowns
// Generates granular editor instructions: B-roll, motion graphics, captions,
// transitions, asset requirements, retention notes per scene.

import { db } from "@/lib/db";
import { jstr, jparseArr } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import type { ProductionSceneRecord } from "@/lib/types";

interface ProductionInput {
  projectId: string;
  scriptContent: string;
  trifectaTitle: string;
  niche: string;
  targetDurationMin?: number;
}

export async function generateProductionScenes(input: ProductionInput): Promise<ProductionSceneRecord[]> {
  const targetMin = input.targetDurationMin ?? 14;
  const scriptExcerpt = input.scriptContent.slice(0, 5000);

  const prompt = `You are Forge, the Production Designer. Break this video script into a detailed scene-by-scene production blueprint.

Video title: ${input.trifectaTitle}
Niche: ${input.niche}
Target duration: ~${targetMin} minutes

Script (excerpt):
${scriptExcerpt}

Generate 6-10 scenes covering the full video. Each scene needs granular editor instructions. Return STRICT JSON:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "timecode": "0:00-0:30",
      "section": "<section name, e.g. 'Cold Open'>",
      "visualDescription": "<what the viewer sees>",
      "brollSuggestions": [{ "description": "...", "source": "<stock/original/screen-record>", "duration": "5s" }],
      "motionGraphics": [{ "type": "<lower-third|callout|animation|text-overlay>", "description": "...", "trigger": "<when it appears>" }],
      "editorInstructions": "<specific cut/pace/color notes for the editor>",
      "captions": [{ "text": "...", "timing": "0:02-0:05", "style": "<bold-emphasis|subtitle|keyword>" }],
      "transitions": [{ "from": "<scene N>", "to": "<scene N+1>", "type": "<cut|cross-dissolve|whip-pan|match-cut>" }],
      "assetRequirements": [{ "type": "<diagram|screenshot|stock-footage|custom-graphic|code-output>", "description": "...", "priority": "<must-have|nice-to-have>" }],
      "retentionNotes": "<what this scene does to keep viewers watching>"
    }
  ]
}`;

  const { data } = await llmJson<{ scenes: any[] }>(prompt, {
    system:
      "You are Forge, an expert video production designer. Every scene must have a retention purpose. Be specific enough that an editor could execute without further questions. Return strict JSON.",
  });

  const scenes = data?.scenes ?? [];
  if (scenes.length === 0) return [];

  // Clear old scenes for the project, then create new ones
  await db.productionScene.deleteMany({ where: { projectId: input.projectId } });

  const created = await db.$transaction(
    scenes.map((s) =>
      db.productionScene.create({
        data: {
          projectId: input.projectId,
          sceneNumber: Number(s.sceneNumber) || 1,
          timecode: s.timecode ?? "",
          section: s.section ?? "",
          visualDescription: s.visualDescription ?? "",
          brollSuggestions: jstr(s.brollSuggestions ?? []),
          motionGraphics: jstr(s.motionGraphics ?? []),
          editorInstructions: s.editorInstructions ?? "",
          captions: jstr(s.captions ?? []),
          transitions: jstr(s.transitions ?? []),
          assetRequirements: jstr(s.assetRequirements ?? []),
          retentionNotes: s.retentionNotes ?? "",
        },
      }),
    ),
  );

  // Also upsert a legacy EditorBlueprint for pipeline continuity
  const segments = created.map((c) => ({
    timecode: c.timecode,
    section: c.section,
    broll: jparseArr(c.brollSuggestions).map((b: any) => b.description).join("; "),
    graphics: jparseArr(c.motionGraphics).map((m: any) => m.description).join("; "),
    captions: jparseArr(c.captions).map((cap: any) => cap.text).join("; "),
    transitions: jparseArr(c.transitions).map((t: any) => t.type).join("; "),
    retentionNotes: c.retentionNotes,
  }));
  await db.editorBlueprint.upsert({
    where: { projectId: input.projectId },
    create: {
      projectId: input.projectId,
      segments: jstr(segments),
      totalDuration: `${targetMin}:00`,
    },
    update: {
      segments: jstr(segments),
      totalDuration: `${targetMin}:00`,
    },
  });

  return created.map((c) => ({
    id: c.id,
    projectId: c.projectId,
    sceneNumber: c.sceneNumber,
    timecode: c.timecode,
    section: c.section,
    visualDescription: c.visualDescription,
    brollSuggestions: jparseArr(c.brollSuggestions),
    motionGraphics: jparseArr(c.motionGraphics),
    editorInstructions: c.editorInstructions,
    captions: jparseArr(c.captions),
    transitions: jparseArr(c.transitions),
    assetRequirements: jparseArr(c.assetRequirements),
    retentionNotes: c.retentionNotes,
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function getProductionScenes(projectId: string): Promise<ProductionSceneRecord[]> {
  const scenes = await db.productionScene.findMany({
    where: { projectId },
    orderBy: { sceneNumber: "asc" },
  });
  return scenes.map((c) => ({
    id: c.id,
    projectId: c.projectId,
    sceneNumber: c.sceneNumber,
    timecode: c.timecode,
    section: c.section,
    visualDescription: c.visualDescription,
    brollSuggestions: jparseArr(c.brollSuggestions),
    motionGraphics: jparseArr(c.motionGraphics),
    editorInstructions: c.editorInstructions,
    captions: jparseArr(c.captions),
    transitions: jparseArr(c.transitions),
    assetRequirements: jparseArr(c.assetRequirements),
    retentionNotes: c.retentionNotes,
    createdAt: c.createdAt.toISOString(),
  }));
}
