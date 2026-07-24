// Creator Voice DNA Extractor
// Expanded voice profiling: writing style, vocabulary, storytelling patterns,
// humor, pacing, content preferences, emotional tone — learned from interviews
// and published scripts.

import { db } from "@/lib/db";
import { jstr, jparseArr, jparseObj } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import type { VoiceDNARecord, CreatorProfileRecord } from "@/lib/types";

interface VoiceSample {
  from: string; // "interview:projectId" | "script:projectId" | "manual"
  excerpt: string;
}

// Gather all voice samples for a creator (interviews + published scripts)
export async function gatherVoiceSamples(): Promise<VoiceSample[]> {
  const samples: VoiceSample[] = [];

  // All creator interviews across projects
  const interviews = await db.creatorInterview.findMany({ take: 50 });
  for (const i of interviews) {
    if (i.answer && i.answer.length > 40) {
      samples.push({
        from: `interview:${i.projectId}`,
        excerpt: i.answer.slice(0, 1500),
      });
    }
  }

  // All scripts (drafts + finals) across projects
  const scripts = await db.script.findMany({
    where: { stage: { in: ["draft", "final", "expanded_outline"] } },
    take: 20,
  });
  for (const s of scripts) {
    if (s.content && s.content.length > 100) {
      samples.push({
        from: `script:${s.projectId}`,
        excerpt: s.content.slice(0, 2000),
      });
    }
  }

  return samples.slice(0, 25); // cap for prompt size
}

// Extract expanded Voice DNA from samples via LLM
export async function extractVoiceDNA(samples: VoiceSample[]): Promise<VoiceDNARecord | null> {
  if (samples.length === 0) return null;

  const corpus = samples
    .map((s, i) => `--- SAMPLE ${i + 1} (from ${s.from}) ---\n${s.excerpt}`)
    .join("\n\n");

  const prompt = `You are Echo, a creator-voice analyst. Analyze these writing/speaking samples from a YouTube creator and extract their Voice DNA.

Samples:
${corpus}

Return STRICT JSON in EXACTLY this shape — every field is required:
{
  "writingStyle": {
    "avgSentenceLength": "<short|medium|long> + approximate word count",
    "structure": "<how sentences are built, e.g. 'declarative statements followed by evidence'>",
    "complexity": "<plain|technical|mixed> + note",
    "register": "<casual|formal| Conversational-expert>"
  },
  "vocabulary": {
    "signaturePhrases": ["<phrase they reuse>", "...3-6 items"],
    "favoriteWords": ["<word>", "...5-10 items"],
    "jargon": ["<domain terms they use>", "..."],
    "avoidedTerms": ["<words they conspicuously avoid>", "..."]
  },
  "storytellingPatterns": {
    "openings": ["<how they open, e.g. 'contrarian question'>", "..."],
    "callbacks": ["<do they reference earlier points?>", "..."],
    "frameworks": ["<mental models they use, e.g. 'trade-offs over absolutes'>", "..."],
    "transitions": ["<how they move between sections>", "..."]
  },
  "humor": {
    "style": "<dry|witty|self-deprecating|absurdist|none>",
    "frequency": "<rare|occasional|frequent>",
    "type": "<observation|analogy|exaggeration|irony>",
    "examples": ["<quoted example if present>", "..."]
  },
  "pacing": {
    "wordsPerMinute": "<estimated range, e.g. '140-160'>",
    "pausePattern": "<where they pause and why>",
    "sectionLength": "<how long their sections run>",
    "rhythm": "<the cadence pattern>"
  },
  "contentPreferences": {
    "preferredFormats": ["<explainer|debate|tutorial|essay|story>", "..."],
    "idealLength": "<their sweet-spot video length>",
    "structurePreference": "<problem-solution|compare-contrast|framework|narrative>",
    "depthLevel": "<introductory|intermediate|advanced>"
  },
  "emotionalTone": {
    "defaultTone": "<their baseline, e.g. 'analytical-warm'>",
    "range": "<how far they shift, e.g. 'measured to animated'>",
    "shifts": "<what triggers tonal shifts>",
    "intensity": "<low|medium|high>"
  },
  "uniquenessScore": <0-100, how distinct this voice is from generic AI/explainer output>,
  "rationale": "<2-3 sentences on what makes this voice distinctive>"
}`;

  const { data, raw } = await llmJson<any>(prompt, {
    system:
      "You are Echo, an expert creator-voice analyst. You capture what makes a voice recognizable and non-generic. Return strict JSON only.",
  });

  if (!data) return null;

  const uniqueness = clamp(Number(data.uniquenessScore) ?? 60);

  // Persist as a new VoiceDNA row
  const created = await db.voiceDNA.create({
    data: {
      writingStyle: jstr(data.writingStyle ?? {}),
      vocabulary: jstr(data.vocabulary ?? {}),
      storytellingPatterns: jstr(data.storytellingPatterns ?? {}),
      humor: jstr(data.humor ?? {}),
      pacing: jstr(data.pacing ?? {}),
      contentPreferences: jstr(data.contentPreferences ?? {}),
      emotionalTone: jstr(data.emotionalTone ?? {}),
      uniquenessScore: uniqueness,
      sourceSamples: jstr(samples.map((s) => ({ from: s.from, excerpt: s.excerpt.slice(0, 200) }))),
      sampleCount: samples.length,
    },
  });

  // Also update the legacy CreatorProfile distinctivenessScore for continuity
  const profile = await db.creatorProfile.findFirst();
  if (profile) {
    await db.creatorProfile.update({
      where: { id: profile.id },
      data: { distinctivenessScore: uniqueness / 100 },
    });
  }

  return decode(created);
}

// Get the latest Voice DNA
export async function getLatestVoiceDNA(): Promise<VoiceDNARecord | null> {
  const latest = await db.voiceDNA.findFirst({ orderBy: { createdAt: "desc" } });
  if (!latest) return null;
  return decode(latest);
}

function clamp(n: number): number {
  if (!isFinite(n)) return 60;
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

function decode(v: any): VoiceDNARecord {
  return {
    id: v.id,
    writingStyle: jparseObj(v.writingStyle),
    vocabulary: jparseObj(v.vocabulary),
    storytellingPatterns: jparseObj(v.storytellingPatterns),
    humor: jparseObj(v.humor),
    pacing: jparseObj(v.pacing),
    contentPreferences: jparseObj(v.contentPreferences),
    emotionalTone: jparseObj(v.emotionalTone),
    uniquenessScore: v.uniquenessScore,
    sourceSamples: jparseArr(v.sourceSamples),
    sampleCount: v.sampleCount,
    createdAt: v.createdAt.toISOString(),
  };
}
