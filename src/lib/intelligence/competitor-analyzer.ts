// Competitor Video Intelligence
// Deep analysis of competing YouTube videos: titles, thumbnails (via VLM),
// transcripts (via page reader), comments — extracting winning patterns.

import { db } from "@/lib/db";
import { jstr } from "@/lib/json";
import { webSearch, readPage, llmJson, visionChat } from "@/lib/zai";
import { parseCount, extractVideoId } from "./opportunity-engine";
import type { CompetitorVideoRecord } from "@/lib/types";

// Find top competing videos for a niche via search
export async function findCompetitorVideos(niche: string, limit = 4): Promise<
  {
    url: string;
    title: string;
    channel: string;
    snippet: string;
    videoId: string;
  }[]
> {
  const queries = [
    `${niche} youtube top videos`,
    `${niche} explained popular youtube`,
  ];
  const results = await Promise.all(queries.map((q) => webSearch(q, 8)));
  const seen = new Set<string>();
  const videos: { url: string; title: string; channel: string; snippet: string; videoId: string }[] = [];
  for (const rs of results) {
    for (const r of rs) {
      if (!/youtube\.com\/watch|youtu\.be/i.test(r.url)) continue;
      const id = extractVideoId(r.url);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      // channel often appears in snippet or host
      const channel = r.host_name?.replace(/^www\./, "").replace(/^m\./, "") || "unknown";
      videos.push({
        url: r.url,
        title: r.name,
        channel,
        snippet: r.snippet,
        videoId: id,
      });
      if (videos.length >= limit) return videos;
    }
  }
  return videos;
}

// Read a YouTube video page to extract transcript + metadata text
export async function readVideoPage(url: string): Promise<{
  text: string;
  publishedAt?: string;
}> {
  const page = await readPage(url);
  if (!page) return { text: "" };
  return { text: page.text, publishedAt: page.publishedTime };
}

// Analyze a single competitor video deeply
export async function analyzeCompetitorVideo(
  video: { url: string; title: string; channel: string; snippet: string; videoId: string },
  niche: string,
): Promise<CompetitorVideoRecord | null> {
  // Read the video page for transcript/metadata
  const page = await readVideoPage(video.url);
  const pageText = page.text.slice(0, 6000);

  // Thumbnail URL (maxres default)
  const thumbUrl = `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`;

  // Parse view count from snippet
  const views = parseCount(video.snippet) ?? 0;

  // Run the deep analysis via LLM
  const analysisPrompt = `You are Scout, a competitor intelligence analyst. Analyze this YouTube video deeply.

Niche: ${niche}
Video title: ${video.title}
Channel: ${video.channel}
URL: ${video.url}
Page content (transcript/metadata, truncated):
${pageText || video.snippet}

Produce a rigorous analysis. Return STRICT JSON in EXACTLY this shape:
{
  "titleAnalysis": {
    "pattern": "<the title formula/pattern used, e.g. 'X vs Y: the truth'>",
    "hooks": ["<curiosity word/phrase 1>", "..."],
    "curiosityTriggers": ["<specific trigger 1>", "..."],
    "length": <character count of title>,
    "sentiment": "<positive|negative|neutral|contrarian>"
  },
  "transcriptSummary": {
    "structure": "<how the video is structured, e.g. 'hook → problem → 3 examples → framework → CTA'>",
    "keyPoints": ["<point 1>", "...3-5 points"],
    "retentionPattern": "<what they do to keep viewers, e.g. 'open loops every 2min, visual proof at 4:00'>",
    "callsToAction": ["<CTA 1>", "..."]
  },
  "commentInsights": {
    "topQuestions": ["<unanswered audience question 1>", "..."],
    "painPoints": ["<audience pain 1>", "..."],
    "praises": ["<what viewers loved 1>", "..."],
    "objections": ["<disagreement/skepticism 1>", "..."],
    "audienceQuestions": ["<question viewers ask that a future video could answer>", "..."]
  },
  "winningPatterns": [
    { "pattern": "<the reusable pattern>", "whyItWorked": "<reason>", "applicability": "<how our creator could use it>" }
  ],
  "performanceScore": <0-100, normalized: views/engagement quality>
}`;

  const { data, raw } = await llmJson<any>(analysisPrompt, {
    system:
      "You are Scout, an expert competitor intelligence analyst. You extract reusable winning patterns, not copy them. Return strict JSON only.",
  });

  if (!data) {
    // Fallback: minimal record
    return null;
  }

  // Try VLM thumbnail analysis (best-effort, non-blocking on failure)
  let thumbnailAnalysis = {
    composition: "unknown",
    focal: "unknown",
    textOverlay: "unknown",
    emotion: "unknown",
    colorMood: "unknown",
    readability: 50,
  };
  try {
    const vlmRes = await visionChat(
      `Analyze this YouTube thumbnail. Return JSON: { "composition": "...", "focal": "main subject", "textOverlay": "any text shown", "emotion": "dominant emotion", "colorMood": "color palette + mood", "readability": 0-100 mobile readability score }. Be concise.`,
      thumbUrl,
    );
    const vlmJson = vlmRes.match(/\{[\s\S]*\}/);
    if (vlmJson) {
      try {
        const parsed = JSON.parse(vlmJson[0]);
        thumbnailAnalysis = { ...thumbnailAnalysis, ...parsed, readability: Number(parsed.readability) || 50 };
      } catch {
        /* keep defaults */
      }
    }
  } catch {
    /* VLM optional */
  }

  const performanceScore = Number(data.performanceScore) || Math.min(100, Math.log10(views + 1) * 20);

  // Persist
  const created = await db.competitorVideo.create({
    data: {
      niche,
      url: video.url,
      channel: video.channel,
      title: video.title,
      views,
      likes: 0,
      comments: 0,
      publishedAt: page.publishedAt ?? null,
      durationSec: 0,
      titleAnalysis: jstr(data.titleAnalysis ?? {}),
      thumbnailAnalysis: jstr(thumbnailAnalysis),
      transcriptSummary: jstr(data.transcriptSummary ?? {}),
      commentInsights: jstr(data.commentInsights ?? {}),
      winningPatterns: jstr(data.winningPatterns ?? []),
      performanceScore: Math.round(performanceScore * 10) / 10,
    },
  });

  return decode(created);
}

// Analyze multiple competitor videos for a niche
export async function analyzeCompetitorsForNiche(
  niche: string,
  projectId?: string,
  limit = 4,
): Promise<CompetitorVideoRecord[]> {
  const videos = await findCompetitorVideos(niche, limit);
  if (videos.length === 0) return [];
  const results: CompetitorVideoRecord[] = [];
  // Sequential to avoid hammering the LLM/VLM APIs
  for (const v of videos) {
    const rec = await analyzeCompetitorVideo(v, niche);
    if (rec) {
      if (projectId) {
        await db.competitorVideo.update({ where: { id: rec.id }, data: { projectId } });
        rec.projectId = projectId;
      }
      results.push(rec);
    }
  }
  return results;
}

// Extract aggregated winning patterns across all analyzed competitor videos
export async function aggregateWinningPatterns(
  videos: CompetitorVideoRecord[],
): Promise<{ pattern: string; frequency: number; applicability: string }[]> {
  const allPatterns = videos.flatMap((v) => v.winningPatterns);
  if (allPatterns.length === 0) return [];
  const { data } = await llmJson<{ aggregated: { pattern: string; frequency: number; applicability: string }[] }>(
    `Aggregate these winning patterns from competitor videos. Group similar patterns, count frequency, and keep the best applicability note.
Patterns:
${JSON.stringify(allPatterns, null, 2)}
Return JSON: { "aggregated": [{ "pattern": "...", "frequency": N, "applicability": "..." }] }`,
    { system: "You are a pattern analyst. Return strict JSON." },
  );
  return data?.aggregated ?? [];
}

// Decode a DB row into the typed record
function decode(c: any): CompetitorVideoRecord {
  return {
    id: c.id,
    projectId: c.projectId,
    niche: c.niche,
    url: c.url,
    channel: c.channel,
    title: c.title,
    views: c.views,
    likes: c.likes,
    comments: c.comments,
    publishedAt: c.publishedAt,
    durationSec: c.durationSec,
    titleAnalysis: safeJson(c.titleAnalysis, { pattern: "", hooks: [], curiosityTriggers: [], length: 0, sentiment: "" }),
    thumbnailAnalysis: safeJson(c.thumbnailAnalysis, { composition: "", focal: "", textOverlay: "", emotion: "", colorMood: "", readability: 50 }),
    transcriptSummary: safeJson(c.transcriptSummary, { structure: "", keyPoints: [], retentionPattern: "", callsToAction: [] }),
    commentInsights: safeJson(c.commentInsights, { topQuestions: [], painPoints: [], praises: [], objections: [], audienceQuestions: [] }),
    winningPatterns: safeJson(c.winningPatterns, []),
    performanceScore: c.performanceScore,
    capturedAt: c.capturedAt.toISOString(),
  };
}

function safeJson<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
