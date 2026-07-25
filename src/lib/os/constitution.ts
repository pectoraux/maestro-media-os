// Creative Constitution — the "why" layer.
//
// The Constitution encodes principles (not just style). Every artifact is
// checked against it. Authenticity becomes Constitutional AI: scoring
// alignment with principles, not just sounding like the creator.
//
// Categories: truthfulness | teaching | tone | business | audience | editing

import { db } from "@/lib/db";
import { jstr, jparseArr } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import type {
  ConstitutionPrincipleRecord,
  ConstitutionViolationRecord,
  ConstitutionCheckResult,
  ConstitutionCategory,
} from "@/lib/types";

export const CONSTITUTION_CATEGORIES: { category: ConstitutionCategory; label: string; icon: string; color: string; description: string }[] = [
  { category: "truthfulness", label: "Truthfulness", icon: "ShieldCheck", color: "emerald", description: "Never fabricate. Distinguish opinion from fact. Don't exaggerate certainty." },
  { category: "teaching", label: "Teaching", icon: "GraduationCap", color: "teal", description: "Explain before persuading. First principles. Show tradeoffs." },
  { category: "tone", label: "Tone", icon: "MessageSquare", color: "amber", description: "Curious, calm, never condescending. No manufactured urgency." },
  { category: "business", label: "Business", icon: "Briefcase", color: "violet", description: "No bad recommendations. Disclose sponsorships." },
  { category: "audience", label: "Audience", icon: "Users", color: "rose", description: "Respect beginners. Never optimize for outrage." },
  { category: "editing", label: "Editing", icon: "Scissors", color: "emerald", description: "Remove filler. Keep the strongest argument." },
];

export async function getConstitution(): Promise<ConstitutionPrincipleRecord[]> {
  const rows = await db.constitutionPrinciple.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });
  return rows.map(decode);
}

export async function getConstitutionByCategory(category: ConstitutionCategory): Promise<ConstitutionPrincipleRecord[]> {
  const rows = await db.constitutionPrinciple.findMany({
    where: { isActive: true, category },
    orderBy: { order: "asc" },
  });
  return rows.map(decode);
}

export async function updatePrinciple(id: string, patch: Partial<ConstitutionPrincipleRecord>): Promise<void> {
  const data: Record<string, unknown> = {};
  if (patch.principle !== undefined) data.principle = patch.principle;
  if (patch.rationale !== undefined) data.rationale = patch.rationale;
  if (patch.enforcement !== undefined) data.enforcement = patch.enforcement;
  if (patch.isActive !== undefined) data.isActive = patch.isActive;
  if (patch.examples !== undefined) data.examples = jstr(patch.examples);
  await db.constitutionPrinciple.update({ where: { id }, data });
}

export async function addPrinciple(data: {
  category: ConstitutionCategory;
  principle: string;
  rationale: string;
  enforcement?: string;
  examples?: string[];
}): Promise<ConstitutionPrincipleRecord> {
  const created = await db.constitutionPrinciple.create({
    data: {
      category: data.category,
      principle: data.principle,
      rationale: data.rationale,
      enforcement: data.enforcement ?? "warn",
      examples: jstr(data.examples ?? []),
    },
  });
  return decode(created);
}

// ── Enforcement engine ──────────────────────────────────────────────────────
// Checks an artifact against the constitution. Returns alignment score,
// violations, per-category scores, and risk level.

export interface ConstitutionCheckInput {
  artifactType: string;
  content: string;
  projectId?: string;
  artifactRef?: string;
}

export async function checkConstitution(input: ConstitutionCheckInput): Promise<ConstitutionCheckResult> {
  const principles = await getConstitution();
  if (principles.length === 0) {
    return {
      passed: true,
      overallAlignment: 100,
      violations: [],
      categoryScores: CONSTITUTION_CATEGORIES.map((c) => ({ category: c.category, score: 100 })),
      riskLevel: "low",
    };
  }

  const principlesDigest = principles.map((p) => ({
    category: p.category,
    principle: p.principle,
    rationale: p.rationale,
    enforcement: p.enforcement,
  }));

  const prompt = `You are the Creative Constitution enforcement engine. Check this artifact against the creator's principles.

CREATOR'S CONSTITUTION (machine-readable principles):
${JSON.stringify(principlesDigest, null, 2)}

ARTIFACT TO CHECK:
Type: ${input.artifactType}
Content:
${input.content.slice(0, 4000)}

Evaluate the artifact against EACH principle. For each category, give a score 0-100 (100 = fully aligned, 0 = flagrant violation). Identify specific violations.

Return STRICT JSON:
{
  "categoryScores": [
    { "category": "truthfulness", "score": N },
    { "category": "teaching", "score": N },
    { "category": "tone", "score": N },
    { "category": "business", "score": N },
    { "category": "audience", "score": N },
    { "category": "editing", "score": N }
  ],
  "violations": [
    {
      "category": "tone",
      "principle": "Never manufacture urgency",
      "severity": "block",
      "reason": "The thumbnail text 'You're doing X WRONG' manufactures urgency, violating the tone principle."
    }
  ],
  "overallAlignment": N,
  "riskLevel": "low|medium|high"
}`;

  const { data } = await llmJson<any>(prompt, {
    system: "You are a constitutional AI evaluator. You are rigorous and honest. You detect subtle violations (manufactured urgency, exaggerated certainty, condescension, one-sided recommendations) that a surface check would miss. Return strict JSON.",
  });

  const categoryScores: { category: ConstitutionCategory; score: number }[] = (data?.categoryScores ?? CONSTITUTION_CATEGORIES.map((c) => ({ category: c.category, score: 80 }))).map((cs: any) => ({
    category: cs.category,
    score: clamp(cs.score),
  }));

  const violations: ConstitutionCheckResult["violations"] = (data?.violations ?? []).map((v: any) => ({
    category: v.category,
    principle: v.principle,
    severity: v.severity ?? "warn",
    reason: v.reason ?? "",
  }));

  const overallAlignment = clamp(data?.overallAlignment ?? Math.round(categoryScores.reduce((s, c) => s + c.score, 0) / categoryScores.length));
  const hasBlocking = violations.some((v) => v.severity === "block");
  const passed = overallAlignment >= 70 && !hasBlocking;
  const riskLevel = (data?.riskLevel ?? (hasBlocking ? "high" : overallAlignment >= 80 ? "low" : "medium")) as "low" | "medium" | "high";

  // Persist violations
  for (const v of violations) {
    const principleRow = principles.find((p) => p.principle === v.principle || p.category === v.category);
    await db.constitutionViolation.create({
      data: {
        principleId: principleRow?.id ?? null,
        category: v.category,
        principle: v.principle,
        artifactType: input.artifactType,
        artifactRef: input.artifactRef ?? null,
        projectId: input.projectId ?? null,
        severity: v.severity,
        reason: v.reason,
        context: jstr({ excerpt: input.content.slice(0, 500), artifactType: input.artifactType }),
        status: v.severity === "block" ? "open" : "resolved",
      },
    });
  }

  return {
    passed,
    overallAlignment,
    violations,
    categoryScores,
    riskLevel,
  };
}

// Get open violations (for the dashboard + constitution view)
export async function getOpenViolations(limit = 50): Promise<ConstitutionViolationRecord[]> {
  const rows = await db.constitutionViolation.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    principleId: r.principleId,
    category: r.category,
    principle: r.principle,
    artifactType: r.artifactType,
    artifactRef: r.artifactRef,
    projectId: r.projectId,
    severity: r.severity,
    reason: r.reason,
    context: jparseArr(r.context) as any,
    status: r.status,
    resolution: r.resolution,
    createdAt: r.createdAt.toISOString(),
  }));
}

// Resolve a violation
export async function resolveViolation(id: string, resolution: "resolved" | "overridden", reason: string): Promise<void> {
  await db.constitutionViolation.update({
    where: { id },
    data: { status: resolution, resolution: jstr({ reason }) },
  });
}

function decode(r: any): ConstitutionPrincipleRecord {
  return {
    id: r.id,
    category: r.category,
    principle: r.principle,
    rationale: r.rationale,
    enforcement: r.enforcement,
    examples: jparseArr(r.examples),
    isActive: r.isActive,
    order: r.order,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function clamp(n: unknown): number {
  const num = Number(n);
  if (!isFinite(num)) return 70;
  return Math.max(0, Math.min(100, Math.round(num * 10) / 10));
}
