// Creator Identity Engine — the unified identity layer.
// AI should imitate YOU, not imitate ANYONE. Every script is grounded in this identity.

import { db } from "@/lib/db";
import { jparseArr, jparseObj, jstr } from "@/lib/json";
import type { CreatorIdentityRecord } from "@/lib/types";

export async function getIdentity(): Promise<CreatorIdentityRecord | null> {
  const row = await db.creatorIdentity.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!row) return null;
  return decode(row);
}

export async function updateIdentity(patch: Partial<CreatorIdentityRecord>): Promise<CreatorIdentityRecord> {
  const existing = await db.creatorIdentity.findFirst();
  if (!existing) throw new Error("No creator identity found. Seed the OS first.");

  const data: Record<string, unknown> = {};
  if (patch.mission !== undefined) data.mission = patch.mission;
  if (patch.beliefs !== undefined) data.beliefs = jstr(patch.beliefs);
  if (patch.experiences !== undefined) data.experiences = jstr(patch.experiences);
  if (patch.stories !== undefined) data.stories = jstr(patch.stories);
  if (patch.frameworks !== undefined) data.frameworks = jstr(patch.frameworks);
  if (patch.analogies !== undefined) data.analogies = jstr(patch.analogies);
  if (patch.humor !== undefined) data.humor = jstr(patch.humor);
  if (patch.values !== undefined) data.values = jstr(patch.values);
  if (patch.vocabulary !== undefined) data.vocabulary = jstr(patch.vocabulary);
  if (patch.audienceExpectations !== undefined) data.audienceExpectations = jstr(patch.audienceExpectations);
  if (patch.authenticityScore !== undefined) data.authenticityScore = patch.authenticityScore;

  const updated = await db.creatorIdentity.update({ where: { id: existing.id }, data });
  return decode(updated);
}

// Re-compute the authenticity score based on how complete the identity is
export async function recomputeAuthenticity(): Promise<number> {
  const id = await getIdentity();
  if (!id) return 0;
  let score = 0;
  const checks = [
    [id.mission, 0.1],
    [id.beliefs.length > 0, 0.15],
    [id.experiences.length > 0, 0.1],
    [id.stories.length > 0, 0.15],
    [id.frameworks.length > 0, 0.1],
    [id.analogies.length > 0, 0.05],
    [id.values.length > 0, 0.1],
    [id.vocabulary.signaturePhrases.length > 0, 0.1],
    [id.audienceExpectations.whatTheyComeFor, 0.05],
    [id.authenticityScore > 0 || true, 0], // baseline
  ] as const;
  for (const [ok, weight] of checks) {
    if (ok) score += weight as number;
  }
  const rounded = Math.min(1, Math.round(score * 100) / 100);
  await updateIdentity({ authenticityScore: rounded });
  return rounded;
}

// Get a compact identity context string for grounding LLM prompts
export async function getIdentityContext(): Promise<string> {
  const id = await getIdentity();
  if (!id) return "No creator identity available.";
  return `CREATOR IDENTITY (ground every output in this):
Mission: ${id.mission ?? "—"}
Beliefs: ${id.beliefs.map((b) => b.belief).join("; ")}
Experiences: ${id.experiences.map((e) => `${e.area} (${e.years}y)`).join("; ")}
Frameworks: ${id.frameworks.map((f) => f.name).join("; ")}
Values: ${id.values.join("; ")}
Signature phrases: ${id.vocabulary.signaturePhrases.join("; ")}
Avoided terms: ${id.vocabulary.avoidedTerms.join("; ")}
Humor: ${id.humor.style}, ${id.humor.frequency}
Audience expects: ${id.audienceExpectations.whatTheyComeFor}
Audience rejects: ${id.audienceExpectations.whatTheyReject}

PRINCIPLE: AI should imitate THIS creator, not a generic model. Every script must sound like it came from this specific human.`;
}

function decode(r: any): CreatorIdentityRecord {
  return {
    id: r.id,
    mission: r.mission,
    beliefs: jparseArr(r.beliefs),
    experiences: jparseArr(r.experiences),
    stories: jparseArr(r.stories),
    frameworks: jparseArr(r.frameworks),
    analogies: jparseArr(r.analogies),
    humor: jparseObj(r.humor),
    values: jparseArr(r.values),
    vocabulary: jparseObj(r.vocabulary),
    audienceExpectations: jparseObj(r.audienceExpectations),
    voiceDNAId: r.voiceDNAId,
    authenticityScore: r.authenticityScore,
    updatedAt: r.updatedAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  };
}
