// Holy Trifecta Optimization Engine
// Generates and evaluates title + thumbnail concept + opening hook as ONE
// connected system, optimized for expectation matching and retention.
//
// Key insight: title, thumbnail and hook must tell the SAME story. The engine
// generates multiple candidates, scores each on 4 dimensions, and returns the
// best composite.

import { db } from "@/lib/db";
import { jstr, jparseArr, jparseObj } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import { getLatestVoiceDNA } from "./voice-dna";
import type { TrifectaCandidate, VoiceDNARecord } from "@/lib/types";

interface TrifectaInput {
  projectId: string;
  scriptContent: string;
  niche: string;
  angle: string;
  voiceDNA?: VoiceDNARecord | null;
}

// Generate N trifecta candidates, then score & rank them
export async function optimizeHolyTrifecta(input: TrifectaInput): Promise<{
  candidates: TrifectaCandidate[];
  winner: TrifectaCandidate;
  voiceDNAUsed: boolean;
}> {
  const voiceDNA = input.voiceDNA ?? (await getLatestVoiceDNA());

  const voiceContext = voiceDNA
    ? `Creator voice DNA:
- Signature phrases: ${(voiceDNA.vocabulary?.signaturePhrases ?? []).slice(0, 5).join(", ")}
- Tone: ${voiceDNA.emotionalTone?.defaultTone ?? "analytical"}
- Storytelling: ${(voiceDNA.storytellingPatterns?.openings ?? []).slice(0, 3).join(", ")}
- Humor: ${voiceDNA.humor?.style ?? "dry"}`
    : "No voice DNA available — use a confident analytical tone.";

  const scriptExcerpt = input.scriptContent.slice(0, 3000);

  const genPrompt = `You are Spark + Canvas, the Holy Trifecta optimization engine. Generate 4 candidate sets of (title + thumbnail concept + opening hook) for this video. They must work AS ONE CONNECTED SYSTEM — the title, thumbnail and hook must tell the same story and set the same expectation.

Niche: ${input.niche}
Editorial angle: ${input.angle}
${voiceContext}

Script (excerpt):
${scriptExcerpt}

Generate 4 DISTINCT candidates. Each must use a different approach (e.g. contrarian, problem-framed, framework-named, story-led). For each, also self-assess 4 scores (0-100):
- expectationMatch: how perfectly do title+thumbnail+hook align? (high = no bait-and-switch)
- curiosityGap: how strong is the curiosity created?
- retentionPrediction: will viewers stay past the hook?
- ctrPrediction: will this get clicked?

Return STRICT JSON:
{
  "candidates": [
    {
      "title": "<60-80 chars>",
      "thumbnailConcept": "<detailed visual concept, 1-2 sentences>",
      "openingHook": "<first 15-30 seconds of script, spoken>",
      "expectationMatch": N,
      "curiosityGap": N,
      "retentionPrediction": N,
      "ctrPrediction": N,
      "rationale": "<why this trifecta works as a unit>"
    }
  ]
}`;

  const { data } = await llmJson<{ candidates: any[] }>(genPrompt, {
    system:
      "You are the Holy Trifecta optimization engine. Title+thumbnail+hook are ONE system. Never generate a trifecta where they tell different stories. Return strict JSON.",
  });

  const rawCandidates = data?.candidates ?? [];

  const candidates: TrifectaCandidate[] = rawCandidates.map((c) => {
    const expectationMatch = clamp(c.expectationMatch);
    const curiosityGap = clamp(c.curiosityGap);
    const retentionPrediction = clamp(c.retentionPrediction);
    const ctrPrediction = clamp(c.ctrPrediction);
    // Composite: weighted. Expectation match is most important (retention depends on it).
    const compositeScore =
      expectationMatch * 0.30 +
      curiosityGap * 0.20 +
      retentionPrediction * 0.25 +
      ctrPrediction * 0.25;
    return {
      title: c.title ?? "",
      thumbnailConcept: c.thumbnailConcept ?? "",
      openingHook: c.openingHook ?? "",
      expectationMatch,
      curiosityGap,
      retentionPrediction,
      ctrPrediction,
      compositeScore: Math.round(compositeScore * 10) / 10,
      rationale: c.rationale ?? "",
    };
  });

  const sorted = [...candidates].sort((a, b) => b.compositeScore - a.compositeScore);
  const winner = sorted[0] ?? fallbackCandidate(input);

  // Persist the winner as the project's HolyTrifecta
  await db.holyTrifecta.upsert({
    where: { projectId: input.projectId },
    create: {
      projectId: input.projectId,
      title: winner.title,
      thumbnailStrategy: jstr({
        concept: winner.thumbnailConcept,
        textOverlay: "",
        focal: "",
        colorMood: "",
        emotion: "",
      }),
      openingHook: winner.openingHook,
      rationale: winner.rationale,
      variants: jstr(sorted.slice(1).map((c) => ({ title: c.title, hook: c.openingHook }))),
      expectationMatch: `Winner scored ${winner.compositeScore}/100. Expectation match ${winner.expectationMatch}, curiosity ${winner.curiosityGap}, retention ${winner.retentionPrediction}, CTR ${winner.ctrPrediction}.`,
    },
    update: {
      title: winner.title,
      thumbnailStrategy: jstr({
        concept: winner.thumbnailConcept,
        textOverlay: "",
        focal: "",
        colorMood: "",
        emotion: "",
      }),
      openingHook: winner.openingHook,
      rationale: winner.rationale,
      variants: jstr(sorted.slice(1).map((c) => ({ title: c.title, hook: c.openingHook }))),
      expectationMatch: `Winner scored ${winner.compositeScore}/100. Expectation match ${winner.expectationMatch}, curiosity ${winner.curiosityGap}, retention ${winner.retentionPrediction}, CTR ${winner.ctrPrediction}.`,
    },
  });

  return { candidates: sorted, winner, voiceDNAUsed: !!voiceDNA };
}

// Generate a detailed thumbnail brief from a trifecta winner
export async function generateThumbnailBrief(
  projectId: string,
  winner: TrifectaCandidate,
): Promise<{
  concept: string;
  visualLayout: Record<string, string>;
  textOverlay: Record<string, string>;
  emotionalTriggers: { trigger: string; how: string }[];
  colorMood: { palette: string[]; mood: string; contrast: string };
  mobileReadability: number;
  readabilityNotes: string;
  aiPrompts: { variant: string; prompt: string; size: string; styleNotes: string }[];
}> {
  const prompt = `You are Canvas, the Thumbnail Director. Turn this winning trifecta into a detailed thumbnail brief.

Title: ${winner.title}
Thumbnail concept: ${winner.thumbnailConcept}
Opening hook: ${winner.openingHook}

Produce a production-ready thumbnail brief. Return STRICT JSON:
{
  "concept": "<1-2 sentence concept summary>",
  "visualLayout": {
    "composition": "<rule of thirds / centered / diagonal>",
    "focalSubject": "<the single most important visual element>",
    "background": "<background description>",
    "depth": "<shallow / deep / flat>",
    "ruleOfThirds": "<how the subject sits on the grid>"
  },
  "textOverlay": {
    "text": "<1-4 words max, large>",
    "font": "<bold sans / condensed / hand-drawn>",
    "size": "<relative: fills 30-40% of frame>",
    "position": "<top-left / bottom-center / right>",
    "contrast": "<how it stands from background>"
  },
  "emotionalTriggers": [
    { "trigger": "<e.g. shock / curiosity / contrast>", "how": "<how the visual creates it>" }
  ],
  "colorMood": {
    "palette": ["<hex or name>", "...3-5 colors"],
    "mood": "<the emotional mood>",
    "contrast": "<high-contrast / muted / vibrant>"
  },
  "mobileReadability": <0-100, how readable on a 320px phone screen>,
  "readabilityNotes": "<what to fix if readability is low>",
  "aiPrompts": [
    { "variant": "A", "prompt": "<full image-gen prompt for variant A>", "size": "1792x1024", "styleNotes": "<style guidance>" },
    { "variant": "B", "prompt": "<different composition>", "size": "1792x1024", "styleNotes": "..." },
    { "variant": "C", "prompt": "<different emotion>", "size": "1792x1024", "styleNotes": "..." }
  ]
}`;

  const { data } = await llmJson<any>(prompt, {
    system:
      "You are Canvas, an expert YouTube thumbnail director. Optimize for mobile readability and emotional stop-power. Return strict JSON.",
  });

  const brief = data ?? fallbackBrief(winner);

  // Persist
  await db.thumbnailBrief.create({
    data: {
      projectId,
      concept: brief.concept ?? winner.thumbnailConcept,
      visualLayout: jstr(brief.visualLayout ?? {}),
      textOverlay: jstr(brief.textOverlay ?? {}),
      emotionalTriggers: jstr(brief.emotionalTriggers ?? []),
      colorMood: jstr(brief.colorMood ?? {}),
      mobileReadability: clamp(brief.mobileReadability),
      readabilityNotes: brief.readabilityNotes ?? "",
      aiPrompts: jstr(brief.aiPrompts ?? []),
      status: "brief",
    },
  });

  return brief;
}

function clamp(n: unknown): number {
  const num = Number(n);
  if (!isFinite(num)) return 50;
  return Math.max(0, Math.min(100, Math.round(num * 10) / 10));
}

function fallbackCandidate(input: TrifectaInput): TrifectaCandidate {
  return {
    title: input.angle.slice(0, 70),
    thumbnailConcept: "A bold visual representing the core tension of the video.",
    openingHook: `Here's what nobody tells you about ${input.niche}.`,
    expectationMatch: 60,
    curiosityGap: 60,
    retentionPrediction: 55,
    ctrPrediction: 55,
    compositeScore: 57.5,
    rationale: "Fallback candidate (LLM JSON parse failed).",
  };
}

function fallbackBrief(winner: TrifectaCandidate) {
  return {
    concept: winner.thumbnailConcept,
    visualLayout: { composition: "rule of thirds", focalSubject: "subject", background: "contextual", depth: "shallow", ruleOfThirds: "left-third" },
    textOverlay: { text: winner.title.split(" ").slice(0, 3).join(" "), font: "bold sans", size: "large", position: "right", contrast: "high" },
    emotionalTriggers: [{ trigger: "curiosity", how: "incomplete information" }],
    colorMood: { palette: ["#0ea5e9", "#f59e0b"], mood: "intriguing", contrast: "high" },
    mobileReadability: 65,
    readabilityNotes: "Keep text minimal; test at 320px.",
    aiPrompts: [{ variant: "A", prompt: winner.thumbnailConcept, size: "1792x1024", styleNotes: "high contrast" }],
  };
}
