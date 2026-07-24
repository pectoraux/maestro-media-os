// Real Opportunity Intelligence Engine
// Gathers live signals from YouTube (via search), Google Trends (via search),
// Reddit (via search + page reader), news, and competitor analysis — then
// scores them with an advanced 6-factor algorithm.
//
// This replaces Phase 1's seeded intelligence with real web data + LLM synthesis.

import { db } from "@/lib/db";
import {
  webSearch,
  readPage,
  llmJson,
  multiWebSearch,
} from "@/lib/zai";
import type {
  TrendSignalRecord,
  AdvancedScoreBreakdown,
} from "@/lib/types";

// ── Signal gathering ────────────────────────────────────────────────────────

interface RawSignal {
  source: TrendSignalRecord["source"];
  title: string;
  url: string;
  snippet: string;
  metric?: string;
  metricValue?: number;
  rawDate?: string;
}

// Parse a view/subscriber/like count string like "1.2M views", "339K", "12,000"
export function parseCount(s: string): number | null {
  if (!s) return null;
  const m = s.replace(/,/g, "").match(/([\d.]+)\s*([KMB]?)/i);
  if (!m) return null;
  const num = parseFloat(m[1]);
  if (!isFinite(num)) return null;
  const unit = (m[2] || "").toUpperCase();
  const mult = unit === "K" ? 1e3 : unit === "M" ? 1e6 : unit === "B" ? 1e9 : 1;
  return Math.round(num * mult);
}

// Extract a YouTube video ID from various URL forms
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// Gather YouTube signals: search for top videos in the niche, capture view counts
export async function gatherYouTubeSignals(niche: string): Promise<RawSignal[]> {
  const queries = [
    `${niche} youtube`,
    `${niche} explained youtube 2024`,
    `${niche} tutorial youtube best`,
  ];
  const results = await multiWebSearch(queries, 6);
  const signals: RawSignal[] = [];
  for (const { results: rs } of results) {
    for (const r of rs) {
      if (!/youtube\.com|youtu\.be/i.test(r.url)) continue;
      const views = parseCount(r.snippet) ?? parseCount(r.name);
      signals.push({
        source: "youtube",
        title: r.name,
        url: r.url,
        snippet: r.snippet,
        metric: "views",
        metricValue: views ?? undefined,
        rawDate: r.date,
      });
    }
  }
  // de-dupe by videoId
  const seen = new Set<string>();
  return signals.filter((s) => {
    const id = extractVideoId(s.url);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  }).slice(0, 12);
}

// Gather Google Trends signals (via search, since no direct API)
export async function gatherTrendsSignals(niche: string): Promise<RawSignal[]> {
  const queries = [
    `${niche} google trends`,
    `${niche} trending 2024 interest`,
    `${niche} search volume growing`,
  ];
  const results = await multiWebSearch(queries, 5);
  const signals: RawSignal[] = [];
  for (const { results: rs } of results) {
    for (const r of rs) {
      if (/youtube\.com|youtu\.be|reddit\.com/i.test(r.url)) continue;
      signals.push({
        source: "google_trends",
        title: r.name,
        url: r.url,
        snippet: r.snippet,
        metric: "interest",
        rawDate: r.date,
      });
    }
  }
  return signals.slice(0, 8);
}

// Gather Reddit signals — search for threads, optionally read top ones for content
export async function gatherRedditSignals(niche: string, readTop = 2): Promise<RawSignal[]> {
  const queries = [
    `site:reddit.com ${niche}`,
    `${niche} reddit discussion questions`,
    `${niche} reddit "does anyone" OR "am I the only one"`,
  ];
  const results = await multiWebSearch(queries, 6);
  const signals: RawSignal[] = [];
  for (const { results: rs } of results) {
    for (const r of rs) {
      if (!/reddit\.com/i.test(r.url)) continue;
      const upvotes = parseCount(r.snippet);
      signals.push({
        source: "reddit",
        title: r.name,
        url: r.url,
        snippet: r.snippet,
        metric: "upvotes",
        metricValue: upvotes ?? undefined,
        rawDate: r.date,
      });
    }
  }
  // Optionally read the top 1-2 threads for richer audience-pain signals
  const top = signals.slice(0, readTop);
  await Promise.all(
    top.map(async (s) => {
      const page = await readPage(s.url);
      if (page && page.text) {
        s.snippet = (page.text.slice(0, 600) + " …");
      }
    }),
  );
  return signals.slice(0, 10);
}

// Gather news signals
export async function gatherNewsSignals(niche: string): Promise<RawSignal[]> {
  const queries = [`${niche} news 2024`, `${niche} announcement funding launch`];
  const results = await multiWebSearch(queries, 5);
  const signals: RawSignal[] = [];
  for (const { results: rs } of results) {
    for (const r of rs) {
      if (/youtube\.com|youtu\.be|reddit\.com/i.test(r.url)) continue;
      signals.push({
        source: "news",
        title: r.name,
        url: r.url,
        snippet: r.snippet,
        metric: "recency",
        rawDate: r.date,
      });
    }
  }
  return signals.slice(0, 8);
}

// Gather all signals for a niche in parallel
export async function gatherAllSignals(niche: string): Promise<{
  youtube: RawSignal[];
  trends: RawSignal[];
  reddit: RawSignal[];
  news: RawSignal[];
}> {
  const [youtube, trends, reddit, news] = await Promise.all([
    gatherYouTubeSignals(niche),
    gatherTrendsSignals(niche),
    gatherRedditSignals(niche),
    gatherNewsSignals(niche),
  ]);
  return { youtube, trends, reddit, news };
}

// ── Persist signals as TrendSignal rows ─────────────────────────────────────
export async function persistSignals(
  niche: string,
  signals: RawSignal[],
  projectId?: string,
): Promise<TrendSignalRecord[]> {
  if (signals.length === 0) return [];
  const created = await db.$transaction(
    signals.slice(0, 30).map((s) =>
      db.trendSignal.create({
        data: {
          projectId: projectId ?? null,
          niche,
          source: s.source,
          title: s.title.slice(0, 300),
          url: s.url.slice(0, 1000),
          snippet: s.snippet.slice(0, 2000),
          metric: s.metric ?? null,
          metricValue: s.metricValue ?? null,
          momentum: null,
        },
      }),
    ),
  );
  return created.map((t) => ({
    id: t.id,
    projectId: t.projectId,
    niche: t.niche,
    source: t.source as TrendSignalRecord["source"],
    title: t.title,
    url: t.url,
    snippet: t.snippet,
    metric: t.metric,
    metricValue: t.metricValue,
    momentum: null,
    capturedAt: t.capturedAt.toISOString(),
  }));
}

// ── Momentum analysis: classify each signal's momentum via LLM ──────────────
export async function classifyMomentum(
  signals: TrendSignalRecord[],
): Promise<void> {
  if (signals.length === 0) return;
  const compact = signals.map((s, i) => ({
    i,
    source: s.source,
    title: s.title.slice(0, 100),
    snippet: s.snippet.slice(0, 160),
  }));
  const { data } = await llmJson<{ classifications: { i: number; momentum: string }[] }>(
    `Classify the momentum of each signal as one of: rising, peaking, stable, declining.
Signals:
${JSON.stringify(compact, null, 2)}
Return JSON: { "classifications": [{ "i": 0, "momentum": "rising" }, ...] }`,
    {
      system:
        "You are a trends analyst. Classify momentum based on language cues (e.g. 'funding', 'breaking', 'new' = rising/peaking; 'guide', 'explainer' = stable; 'deprecated', 'replaced' = declining). Return strict JSON.",
    },
  );
  const classifications = data?.classifications ?? [];
  for (const c of classifications) {
    const sig = signals[c.i];
    if (sig && ["rising", "peaking", "stable", "declining"].includes(c.momentum)) {
      await db.trendSignal.update({
        where: { id: sig.id },
        data: { momentum: c.momentum },
      });
      sig.momentum = c.momentum as TrendSignalRecord["momentum"];
    }
  }
}

// ── Advanced Opportunity Scoring Algorithm ──────────────────────────────────
// Combines 6 factors into a weighted composite. Each factor 0-100.

export interface ScoringInputs {
  youtubeSignals: RawSignal[];
  trendsSignals: RawSignal[];
  redditSignals: RawSignal[];
  newsSignals: RawSignal[];
  creatorExpertise?: { area: string; depth: string }[];
  niche: string;
}

// Viral velocity: based on view counts of top YouTube videos (higher & more recent = higher)
function scoreViralVelocity(yt: RawSignal[]): number {
  if (yt.length === 0) return 30;
  const views = yt.map((s) => s.metricValue ?? 0).filter((v) => v > 0);
  if (views.length === 0) return 40;
  const max = Math.max(...views);
  const avg = views.reduce((a, b) => a + b, 0) / views.length;
  // map: avg 1M+ = ~90, avg 100k = ~70, avg 10k = ~50, avg <1k = ~30
  const avgScore = Math.min(100, 30 + (Math.log10(avg + 1) * 20));
  const maxScore = Math.min(100, 30 + (Math.log10(max + 1) * 20));
  return Math.round((avgScore * 0.6 + maxScore * 0.4) * 10) / 10;
}

// Search demand: count of signals across sources + trends presence
function scoreSearchDemand(trends: RawSignal[], yt: RawSignal[], reddit: RawSignal[]): number {
  const trendPresence = Math.min(40, trends.length * 8);
  const ytPresence = Math.min(35, yt.length * 4);
  const redditPresence = Math.min(25, reddit.length * 3);
  return Math.round(trendPresence + ytPresence + redditPresence);
}

// Competition gap: fewer high-view YouTube videos = bigger gap (inverse)
function scoreCompetitionGap(yt: RawSignal[]): number {
  if (yt.length === 0) return 80; // no competition = big gap
  const highView = yt.filter((s) => (s.metricValue ?? 0) > 500_000).length;
  const medView = yt.filter((s) => (s.metricValue ?? 0) > 50_000).length;
  // many high-view videos = saturated = low gap
  const saturation = Math.min(100, highView * 25 + medView * 8);
  return Math.round(Math.max(10, 100 - saturation));
}

// Monetization potential: derived via LLM from the niche + signals
async function scoreMonetization(inputs: ScoringInputs): Promise<number> {
  const sample = [...inputs.youtubeSignals, ...inputs.newsSignals]
    .slice(0, 6)
    .map((s) => s.title)
    .join("\n");
  const { data } = await llmJson<{ score: number; reason: string }>(
    `Niche: "${inputs.niche}"
Sample content titles:
${sample}

Score the monetization potential for a YouTube creator in this niche (0-100).
Consider: sponsor appeal (dev tools, SaaS, hardware), audience purchasing power,
course/product fit, affiliate potential. Higher = better monetization.
Return JSON: { "score": N, "reason": "..." }`,
    { system: "You are a YouTube monetization strategist. Return strict JSON." },
  );
  return clamp(data?.score ?? 55);
}

// Expertise alignment: match niche to creator's stored expertise
function scoreExpertiseAlignment(inputs: ScoringInputs): number {
  if (!inputs.creatorExpertise || inputs.creatorExpertise.length === 0) return 50;
  const nicheLower = inputs.niche.toLowerCase();
  const words = nicheLower.split(/\s+/).filter((w) => w.length > 3);
  let best = 0;
  for (const exp of inputs.creatorExpertise) {
    const areaLower = exp.area.toLowerCase();
    const match = words.some((w) => areaLower.includes(w)) || areaLower.includes(nicheLower);
    if (match) {
      best = Math.max(best, exp.depth === "expert" ? 95 : exp.depth === "proficient" ? 75 : 60);
    }
    // partial word match
    if (best === 0) {
      const partial = words.some((w) => areaLower.split(/\s+/).some((aw) => aw.length > 3 && (aw.includes(w) || w.includes(aw))));
      if (partial) best = Math.max(best, exp.depth === "expert" ? 70 : 55);
    }
  }
  return best > 0 ? best : 45;
}

// Trend momentum: aggregate momentum classification
function scoreTrendMomentum(signals: TrendSignalRecord[]): number {
  if (signals.length === 0) return 50;
  const map = { rising: 90, peaking: 75, stable: 55, declining: 25 };
  let total = 0;
  let count = 0;
  for (const s of signals) {
    if (s.momentum && s.momentum in map) {
      total += (map as any)[s.momentum];
      count++;
    }
  }
  return count > 0 ? Math.round(total / count) : 55;
}

function clamp(n: unknown): number {
  const num = Number(n);
  if (!isFinite(num)) return 50;
  return Math.max(0, Math.min(100, Math.round(num * 10) / 10));
}

export interface ScoreResult {
  breakdown: AdvancedScoreBreakdown;
  overall: number;
  weights: Record<keyof AdvancedScoreBreakdown, number>;
}

// Weights for the composite score (sum to 1.0)
const WEIGHTS: Record<keyof AdvancedScoreBreakdown, number> = {
  viralVelocity: 0.15,
  searchDemand: 0.20,
  competitionGap: 0.20,
  monetizationPotential: 0.15,
  expertiseAlignment: 0.15,
  trendMomentum: 0.15,
};

export async function computeAdvancedScore(
  inputs: ScoringInputs,
  classifiedSignals: TrendSignalRecord[],
): Promise<ScoreResult> {
  const breakdown: AdvancedScoreBreakdown = {
    viralVelocity: scoreViralVelocity(inputs.youtubeSignals),
    searchDemand: scoreSearchDemand(inputs.trendsSignals, inputs.youtubeSignals, inputs.redditSignals),
    competitionGap: scoreCompetitionGap(inputs.youtubeSignals),
    monetizationPotential: await scoreMonetization(inputs),
    expertiseAlignment: scoreExpertiseAlignment(inputs),
    trendMomentum: scoreTrendMomentum(classifiedSignals),
  };
  const overall =
    breakdown.viralVelocity * WEIGHTS.viralVelocity +
    breakdown.searchDemand * WEIGHTS.searchDemand +
    breakdown.competitionGap * WEIGHTS.competitionGap +
    breakdown.monetizationPotential * WEIGHTS.monetizationPotential +
    breakdown.expertiseAlignment * WEIGHTS.expertiseAlignment +
    breakdown.trendMomentum * WEIGHTS.trendMomentum;
  return {
    breakdown,
    overall: Math.round(overall * 10) / 10,
    weights: WEIGHTS,
  };
}

// ── Summary generator ───────────────────────────────────────────────────────
export async function generateScanSummary(
  niche: string,
  score: ScoreResult,
  signals: { youtube: number; trends: number; reddit: number; news: number },
): Promise<string> {
  const b = score.breakdown;
  const prompt = `Niche: "${niche}"
Signal counts: YouTube=${signals.youtube}, Trends=${signals.trends}, Reddit=${signals.reddit}, News=${signals.news}
Advanced scores (0-100):
- Viral velocity: ${b.viralVelocity}
- Search demand: ${b.searchDemand}
- Competition gap: ${b.competitionGap}
- Monetization potential: ${b.monetizationPotential}
- Expertise alignment: ${b.expertiseAlignment}
- Trend momentum: ${b.trendMomentum}
Overall: ${score.overall}

Write a 3-4 sentence intelligence summary explaining WHY this niche scores ${score.overall}/100 right now.
Highlight the strongest factor and the biggest risk. Be direct, no hype.`;
  const text = await llmJson<{ summary: string }>(
    `${prompt}\nReturn JSON: { "summary": "..." }`,
    { system: "You are a senior YouTube strategist. Return strict JSON." },
  );
  return text.data?.summary ?? `Niche "${niche}" scores ${score.overall}/100. Viral velocity ${b.viralVelocity}, demand ${b.searchDemand}, competition gap ${b.competitionGap}.`;
}
