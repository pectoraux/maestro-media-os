// Trust Engine — the platform's biggest differentiator.
//
// The product isn't AI generation (commodity). It's identity & authenticity
// infrastructure. Every artifact gets a trust profile:
//   trustScore, evidenceScore, sourceDiversity, hallucinationRisk,
//   authenticityScore, constitutionAlignment, creatorConfidence,
//   audienceConfidence, reviewStatus, riskFactors, sources.
//
// Extensions can improve trust, not just generate content.

import { db } from "@/lib/db";
import { jstr } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import { checkAuthenticity } from "./authenticity";
import { checkConstitution } from "./constitution";
import type { TrustCheckResult, TrustProfileRecord } from "@/lib/types";

export interface TrustCheckInput {
  artifactType: string;
  content: string;
  projectId?: string;
  artifactRef?: string;
  declaredSources?: { type: string; url?: string; reliability?: number }[];
  creatorConfidence?: number; // 0-1, creator's stated confidence
}

// Compute a full trust profile for an artifact
export async function checkTrust(input: TrustCheckInput): Promise<TrustCheckResult> {
  // Run authenticity + constitution checks in parallel
  const [authResult, constResult] = await Promise.all([
    checkAuthenticity({
      type: input.artifactType as any,
      content: input.content,
      projectId: input.projectId,
      ref: input.artifactRef,
    }).catch(() => null),
    checkConstitution({
      artifactType: input.artifactType,
      content: input.content,
      projectId: input.projectId,
      artifactRef: input.artifactRef,
    }).catch(() => null),
  ]);

  const authenticityScore = authResult?.overall ?? 50;
  const constitutionAlignment = constResult?.overallAlignment ?? 50;

  // LLM-based trust analysis: evidence, source diversity, hallucination risk
  const trustPrompt = `You are the Trust Engine. Analyze this artifact for trustworthiness.

Artifact type: ${input.artifactType}
Content:
${input.content.slice(0, 3000)}

Declared sources: ${JSON.stringify(input.declaredSources ?? [])}

Evaluate:
1. evidenceScore (0-100): how well-supported are the claims by evidence?
2. sourceDiversity (0-100): how many independent sources back the claims? (0 = no sources, 100 = 5+ independent credible sources)
3. hallucinationRisk (0-100): likelihood the artifact contains fabricated/hallucinated content (0 = very unlikely, 100 = very likely). Look for: unsourced statistics, invented quotes, vague "studies show" claims, specific numbers without attribution.
4. audienceConfidence (0-100): how confident would the audience be in this content?
5. riskFactors: list specific trust risks (e.g. "unsourced statistic", "vague attribution", "emotionally manipulative")

Return STRICT JSON:
{
  "evidenceScore": N,
  "sourceDiversity": N,
  "hallucinationRisk": N,
  "audienceConfidence": N,
  "riskFactors": [{ "factor": "...", "severity": "high|medium|low" }],
  "sources": [{ "type": "research|interview|benchmark|news|docs", "url": "...", "reliability": 0-1 }],
  "rationale": "2-3 sentences on the trust profile"
}`;

  const { data } = await llmJson<any>(trustPrompt, {
    system: "You are a trust and safety analyst. You detect hallucinations, unsourced claims, and manipulative content. Be rigorous. Return strict JSON.",
  });

  const evidenceScore = clamp(data?.evidenceScore ?? 40);
  const sourceDiversity = clamp(data?.sourceDiversity ?? 30);
  const hallucinationRisk = clamp(data?.hallucinationRisk ?? 50);
  const audienceConfidence = clamp(data?.audienceConfidence ?? 50);
  const creatorConfidence = clamp((input.creatorConfidence ?? 0.7) * 100);
  const riskFactors = data?.riskFactors ?? [];
  const sources = data?.sources ?? input.declaredSources ?? [];
  const rationale = data?.rationale ?? "Trust analysis complete.";

  // Composite trust score: weighted combination
  // Higher evidence, source diversity, authenticity, constitution, confidence = higher trust
  // Higher hallucination risk = lower trust
  const trustScore = Math.round(
    evidenceScore * 0.20 +
    sourceDiversity * 0.15 +
    authenticityScore * 0.20 +
    constitutionAlignment * 0.15 +
    creatorConfidence * 0.10 +
    audienceConfidence * 0.10 +
    (100 - hallucinationRisk) * 0.10
  );

  const reviewStatus = trustScore >= 75 && hallucinationRisk < 40 ? "approved" : trustScore < 40 || hallucinationRisk > 70 ? "rejected" : "pending";

  // Persist the trust profile
  const profile = await db.trustProfile.create({
    data: {
      projectId: input.projectId ?? null,
      artifactType: input.artifactType,
      artifactRef: input.artifactRef ?? null,
      trustScore,
      evidenceScore,
      sourceDiversity,
      hallucinationRisk,
      authenticityScore,
      constitutionAlignment,
      creatorConfidence,
      audienceConfidence,
      reviewStatus,
      riskFactors: jstr(riskFactors),
      sources: jstr(sources),
    },
  });

  return {
    trustScore,
    evidenceScore,
    sourceDiversity,
    hallucinationRisk,
    authenticityScore,
    constitutionAlignment,
    creatorConfidence,
    audienceConfidence,
    reviewStatus,
    riskFactors,
    sources,
    trustProfileId: profile.id,
    rationale,
  };
}

// Get trust profiles
export async function listTrustProfiles(projectId?: string, limit = 50): Promise<TrustProfileRecord[]> {
  const where = projectId ? { projectId } : {};
  const rows = await db.trustProfile.findMany({ where, orderBy: { createdAt: "desc" }, take: limit });
  return rows.map(decode);
}

export async function getTrustProfile(id: string): Promise<TrustProfileRecord | null> {
  const row = await db.trustProfile.findUnique({ where: { id } });
  return row ? decode(row) : null;
}

// Update review status (creator reviews the trust profile)
export async function updateReviewStatus(id: string, status: "pending" | "reviewed" | "approved" | "rejected"): Promise<void> {
  await db.trustProfile.update({ where: { id }, data: { reviewStatus: status } });
}

function decode(r: any): TrustProfileRecord {
  return {
    id: r.id,
    projectId: r.projectId,
    artifactType: r.artifactType,
    artifactRef: r.artifactRef,
    trustScore: r.trustScore,
    evidenceScore: r.evidenceScore,
    sourceDiversity: r.sourceDiversity,
    hallucinationRisk: r.hallucinationRisk,
    authenticityScore: r.authenticityScore,
    constitutionAlignment: r.constitutionAlignment,
    creatorConfidence: r.creatorConfidence,
    audienceConfidence: r.audienceConfidence,
    reviewStatus: r.reviewStatus,
    riskFactors: JSON.parse(r.riskFactors || "[]"),
    sources: JSON.parse(r.sources || "[]"),
    createdAt: r.createdAt.toISOString(),
  };
}

function clamp(n: unknown): number {
  const num = Number(n);
  if (!isFinite(num)) return 50;
  return Math.max(0, Math.min(100, Math.round(num * 10) / 10));
}
