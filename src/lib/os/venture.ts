// Creator Venture Studio — the creator as a startup.
//
// The platform maximizes the economic value of a creator's unique abilities
// while remaining authentic. The optimization target is the creator's long-term
// success, not better videos.

import { db } from "@/lib/db";
import { jstr, jparseArr, jparseObj } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import { getIdentity } from "./identity";
import { getConstitution } from "./constitution";
import type { CreatorVentureRecord, UnfairAdvantageRecord } from "@/lib/types";

// ── Venture ─────────────────────────────────────────────────────────────────
export async function getVenture(): Promise<CreatorVentureRecord | null> {
  const row = await db.creatorVenture.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!row) return null;
  return decode(row);
}

export async function updateVenture(patch: Partial<CreatorVentureRecord>): Promise<CreatorVentureRecord> {
  const existing = await db.creatorVenture.findFirst();
  if (!existing) throw new Error("No venture found. Seed first.");
  const data: Record<string, unknown> = {};
  if (patch.stage !== undefined) data.stage = patch.stage;
  if (patch.vision !== undefined) data.vision = patch.vision;
  if (patch.projectedValue !== undefined) data.projectedValue = patch.projectedValue;
  if (patch.revenueStreams !== undefined) data.revenueStreams = jstr(patch.revenueStreams);
  if (patch.growthStrategy !== undefined) data.growthStrategy = jstr(patch.growthStrategy);
  if (patch.executionCapacity !== undefined) data.executionCapacity = jstr(patch.executionCapacity);
  if (patch.roadmap !== undefined) data.roadmap = jstr(patch.roadmap);
  const updated = await db.creatorVenture.update({ where: { id: existing.id }, data });
  return decode(updated);
}

// ── Unfair Advantages ───────────────────────────────────────────────────────
export async function getUnfairAdvantages(): Promise<UnfairAdvantageRecord[]> {
  const rows = await db.unfairAdvantage.findMany({ orderBy: { rarity: "desc" } });
  return rows.map(decodeAdvantage);
}

// Discover unfair advantages via LLM — what combination of skills/experiences/personality is rare?
export async function discoverUnfairAdvantages(): Promise<UnfairAdvantageRecord[]> {
  const [identity, constitution] = await Promise.all([getIdentity(), getConstitution()]);

  const prompt = `You are a venture analyst. Discover this creator's "unfair advantages" — combinations of skills, experiences, personality, network, and interests that are RARE and HARD TO COPY.

Creator Identity:
- Mission: ${identity?.mission ?? "—"}
- Beliefs: ${identity?.beliefs.map((b) => b.belief).join(", ")}
- Experiences: ${identity?.experiences.map((e) => `${e.area} (${e.years}y, ${e.notable})`).join("; ")}
- Frameworks: ${identity?.frameworks.map((f) => f.name).join(", ")}
- Values: ${identity?.values.join(", ")}
- Vocabulary signatures: ${identity?.vocabulary.signaturePhrases.join(", ")}

Constitution principles: ${constitution.map((p) => p.principle).join("; ")}

Identify 3-5 unfair advantages. For each, assess:
- rarity (0-1): how rare is this combination?
- defensibility (0-1): how hard to copy?
- monetization (0-1): how monetizable?

Return STRICT JSON:
{
  "advantages": [
    {
      "title": "short title",
      "description": "why this combination is rare and valuable",
      "components": [{ "type": "skill|experience|personality|network|interest", "value": "..." }],
      "rarity": 0.0-1.0,
      "defensibility": 0.0-1.0,
      "monetization": 0.0-1.0,
      "evidence": ["supporting evidence 1", "..."]
    }
  ]
}`;

  const { data } = await llmJson<{ advantages: any[] }>(prompt, {
    system: "You are a venture analyst who identifies unfair advantages. You think in combinations, not individual skills. Return strict JSON.",
  });

  const advantages = data?.advantages ?? [];
  const created: UnfairAdvantageRecord[] = [];
  for (const a of advantages) {
    const row = await db.unfairAdvantage.create({
      data: {
        title: a.title,
        description: a.description,
        components: jstr(a.components ?? []),
        rarity: clamp01(a.rarity),
        defensibility: clamp01(a.defensibility),
        monetization: clamp01(a.monetization),
        evidence: jstr(a.evidence ?? []),
      },
    });
    created.push(decodeAdvantage(row));
  }
  return created;
}

function decode(row: any): CreatorVentureRecord {
  return {
    id: row.id,
    stage: row.stage,
    vision: row.vision,
    projectedValue: row.projectedValue,
    revenueStreams: jparseArr(row.revenueStreams),
    growthStrategy: jparseArr(row.growthStrategy),
    executionCapacity: jparseObj(row.executionCapacity),
    roadmap: jparseArr(row.roadmap),
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function decodeAdvantage(row: any): UnfairAdvantageRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    components: jparseArr(row.components),
    rarity: row.rarity,
    defensibility: row.defensibility,
    monetization: row.monetization,
    evidence: jparseArr(row.evidence),
    createdAt: row.createdAt.toISOString(),
  };
}

function clamp01(n: unknown): number {
  const num = Number(n);
  if (!isFinite(num)) return 0.5;
  return Math.max(0, Math.min(1, Math.round(num * 100) / 100));
}
