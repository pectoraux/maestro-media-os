// Authenticity Engine — the differentiator.
//
// The central question is NOT "can AI generate this?" but
// "does this feel like this creator actually made it?"
//
// Every artifact gets scored on 7 dimensions against the Media DNA + Identity.
// If overall < threshold OR a blocking dimension fails, publish is REFUSED.

import { db } from "@/lib/db";
import { jstr } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import { getMediaDNAContext } from "./media-dna";
import { getMemoryContext } from "./memory";
import { getIdentityContext } from "./identity";
import { checkConstitution } from "./constitution";
import type { AuthenticityCheckResult, AuthenticityDimensionScore, AuthenticityScoreRecord, PipelineArtifact, PipelineAuthenticityResult } from "@/lib/types";

export const DEFAULT_THRESHOLD = 70;

export interface ArtifactToCheck {
  type: "script" | "trifecta" | "thumbnail" | "scene" | "full_production";
  content: string; // the artifact text/representation to check
  ref?: string; // artifact id
  projectId?: string;
  context?: string; // extra context (e.g. what stage, what intent)
}

// Score an artifact against the creator's Media DNA + Identity + Semantic Memory.
export async function checkAuthenticity(artifact: ArtifactToCheck, threshold = DEFAULT_THRESHOLD): Promise<AuthenticityCheckResult> {
  const [dnaContext, memoryContext, identityContext] = await Promise.all([
    getMediaDNAContext(),
    getMemoryContext(),
    getIdentityContext(),
  ]);

  const prompt = `You are the Authenticity Engine — the guardian of the creator's voice.

${identityContext}

${dnaContext}

${memoryContext}

ARTIFACT TO CHECK:
Type: ${artifact.type}
${artifact.context ? `Context: ${artifact.context}\n` : ""}Content:
${artifact.content.slice(0, 4000)}

Score this artifact on 7 authenticity dimensions (0-100 each). The question is NOT "is this good content?" but "does this feel like THIS creator actually made it?"

Dimensions:
1. voice — does it match the Voice DNA (tone, pacing, signatures)?
2. reasoning — does it match the creator's reasoning style (first-principles, trade-offs, skepticism)?
3. humor — does it match the creator's humor (style, frequency, type)?
4. vocabulary — does it use the creator's vocabulary (signature phrases, favorite words, avoids avoided terms)?
5. editing — does the structure/editing match the Editing + Story DNA (pacing, transitions, arc)?
6. visualIdentity — does the visual language match the Visual + Brand DNA (if applicable; for scripts, assess scene/structure descriptions)?
7. audienceExpectation — does it meet what the audience comes for and trusts?

Be rigorous. A score of 90+ means "indistinguishable from the creator." 70-80 means "close but detectable." Below 60 means "clearly not the creator's voice."

Return STRICT JSON:
{
  "dimensions": { "voice": N, "reasoning": N, "humor": N, "vocabulary": N, "editing": N, "visualIdentity": N, "audienceExpectation": N },
  "overall": N,
  "rationale": "2-3 sentences explaining the scores — what felt authentic and what didn't",
  "blockingReason": "if any dimension < 60 or overall < ${threshold}, explain why publishing should be blocked. Otherwise null."
}`;

  const { data, raw } = await llmJson<any>(prompt, {
    system: "You are the Authenticity Engine. You are rigorous and honest. You do not give high scores to be kind — a fake 95 is worse than an honest 72. Return strict JSON.",
  });

  const dims: AuthenticityDimensionScore = {
    voice: clamp(data?.dimensions?.voice),
    reasoning: clamp(data?.dimensions?.reasoning),
    humor: clamp(data?.dimensions?.humor),
    vocabulary: clamp(data?.dimensions?.vocabulary),
    editing: clamp(data?.dimensions?.editing),
    visualIdentity: clamp(data?.dimensions?.visualIdentity),
    audienceExpectation: clamp(data?.dimensions?.audienceExpectation),
  };

  const overall = clamp(data?.overall ?? computeOverall(dims));
  const blockingReason = data?.blockingReason ?? null;

  // Pass condition: overall >= threshold AND no dimension below 60 (blocking floor)
  const minDim = Math.min(...Object.values(dims));
  let passed = overall >= threshold && minDim >= 60;
  let finalBlockingReason = passed ? null : (blockingReason || `Overall ${overall} or a dimension below 60 (min: ${minDim}) does not meet the authenticity threshold (${threshold}).`);

  // ── Constitutional AI: also check against the Creative Constitution ──
  const constitutionResult = await checkConstitution({
    artifactType: artifact.type,
    content: artifact.content,
    projectId: artifact.projectId,
    artifactRef: artifact.ref,
  }).catch(() => null);

  const constitutionAlignment = constitutionResult?.overallAlignment ?? 100;
  const constitutionViolations = constitutionResult?.violations ?? [];
  const hasBlockingViolation = constitutionViolations.some((v) => v.severity === "block");

  // If constitution has a blocking violation, the artifact cannot pass
  if (hasBlockingViolation) {
    passed = false;
    const blockV = constitutionViolations.find((v) => v.severity === "block");
    finalBlockingReason = `Constitution violation (${blockV?.category}): ${blockV?.reason}`;
  } else if (constitutionAlignment < 70) {
    passed = false;
    finalBlockingReason = `Constitution alignment ${constitutionAlignment}/100 is below threshold. Risk: ${constitutionResult?.riskLevel}.`;
  }

  const rationale = data?.rationale ?? "Authenticity assessment complete.";
  const fullRationale = constitutionResult
    ? `${rationale} Constitution alignment: ${constitutionAlignment}/100 (${constitutionResult.riskLevel} risk, ${constitutionViolations.length} violations).`
    : rationale;

  // Persist the score
  const score = await db.authenticityScore.create({
    data: {
      projectId: artifact.projectId ?? null,
      artifactType: artifact.type,
      artifactRef: artifact.ref ?? null,
      overall,
      voice: dims.voice,
      reasoning: dims.reasoning,
      humor: dims.humor,
      vocabulary: dims.vocabulary,
      editing: dims.editing,
      visualIdentity: dims.visualIdentity,
      audienceExpectation: dims.audienceExpectation,
      passed,
      blockingReason: finalBlockingReason,
      threshold,
      rationale: fullRationale,
    },
  });

  return {
    passed,
    overall,
    dimensions: dims,
    blockingReason: finalBlockingReason,
    threshold,
    rationale: fullRationale,
    scoreId: score.id,
    constitution: constitutionResult ? {
      alignment: constitutionAlignment,
      riskLevel: constitutionResult.riskLevel,
      violations: constitutionViolations,
      categoryScores: constitutionResult.categoryScores,
    } : null,
  };
}

// Get all authenticity scores (for the dashboard)
export async function listScores(projectId?: string, limit = 50): Promise<AuthenticityScoreRecord[]> {
  const where = projectId ? { projectId } : {};
  const rows = await db.authenticityScore.findMany({ where, orderBy: { createdAt: "desc" }, take: limit });
  return rows.map((r) => ({
    id: r.id,
    projectId: r.projectId,
    artifactType: r.artifactType as AuthenticityScoreRecord["artifactType"],
    artifactRef: r.artifactRef,
    overall: r.overall,
    dimensions: {
      voice: r.voice,
      reasoning: r.reasoning,
      humor: r.humor,
      vocabulary: r.vocabulary,
      editing: r.editing,
      visualIdentity: r.visualIdentity,
      audienceExpectation: r.audienceExpectation,
    },
    passed: r.passed,
    blockingReason: r.blockingReason,
    threshold: r.threshold,
    rationale: r.rationale,
    createdAt: r.createdAt.toISOString(),
  }));
}

// Get the latest score for a project's artifact type
export async function getLatestScore(projectId: string, artifactType: string): Promise<AuthenticityScoreRecord | null> {
  const row = await db.authenticityScore.findFirst({
    where: { projectId, artifactType },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.projectId,
    artifactType: row.artifactType as AuthenticityScoreRecord["artifactType"],
    artifactRef: row.artifactRef,
    overall: row.overall,
    dimensions: {
      voice: row.voice,
      reasoning: row.reasoning,
      humor: row.humor,
      vocabulary: row.vocabulary,
      editing: row.editing,
      visualIdentity: row.visualIdentity,
      audienceExpectation: row.audienceExpectation,
    },
    passed: row.passed,
    blockingReason: row.blockingReason,
    threshold: row.threshold,
    rationale: row.rationale,
    createdAt: row.createdAt.toISOString(),
  };
}

// Check if a project is clear to publish (latest full_production or script check passed)
export async function canPublish(projectId: string): Promise<{ allowed: boolean; reason?: string; score?: AuthenticityScoreRecord }> {
  const latest = await getLatestScore(projectId, "script")
    ?? await getLatestScore(projectId, "full_production");
  if (!latest) {
    return { allowed: false, reason: "No authenticity check has been run. Run the Authenticity Engine before publishing." };
  }
  if (!latest.passed) {
    return { allowed: false, reason: latest.blockingReason ?? "Authenticity check failed.", score: latest };
  }
  return { allowed: true, score: latest };
}

function clamp(n: unknown): number {
  const num = Number(n);
  if (!isFinite(num)) return 50;
  return Math.max(0, Math.min(100, Math.round(num * 10) / 10));
}

function computeOverall(d: AuthenticityDimensionScore): number {
  // Weighted: voice and reasoning are most important for authenticity
  const w = { voice: 0.2, reasoning: 0.2, vocabulary: 0.15, audienceExpectation: 0.15, humor: 0.1, editing: 0.1, visualIdentity: 0.1 };
  return Math.round(
    d.voice * w.voice + d.reasoning * w.reasoning + d.vocabulary * w.vocabulary +
    d.audienceExpectation * w.audienceExpectation + d.humor * w.humor + d.editing * w.editing + d.visualIdentity * w.visualIdentity
  );
}

// ── Pervasive Authenticity ──────────────────────────────────────────────────
// Authenticity isn't just for scripts. EVERY artifact passes through it:
// script → thumbnail → voice → video → description → publish.
// Each gets scored; the pipeline is blocked if any artifact fails.

export async function checkPipelineAuthenticity(
  artifacts: PipelineArtifact[],
  projectId?: string,
  threshold = DEFAULT_THRESHOLD,
): Promise<PipelineAuthenticityResult> {
  const results: PipelineAuthenticityResult["artifacts"] = [];
  const blocking: PipelineAuthenticityResult["blockingArtifacts"] = [];

  for (const artifact of artifacts) {
    const check = await checkAuthenticity(
      { type: artifact.type, content: artifact.content, ref: artifact.ref, projectId },
      threshold,
    );
    results.push({
      type: artifact.type,
      overall: check.overall,
      passed: check.passed,
      dimensions: check.dimensions,
    });
    if (!check.passed) {
      blocking.push({ type: artifact.type, reason: check.blockingReason ?? "Below threshold" });
    }
  }

  const overallPipeline = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.overall, 0) / results.length * 10) / 10
    : 0;
  const allPassed = blocking.length === 0;

  return {
    artifacts: results,
    overallPipeline,
    allPassed,
    blockingArtifacts: blocking,
    publishAllowed: allPassed,
  };
}
