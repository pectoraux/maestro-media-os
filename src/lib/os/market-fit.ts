// Creator-Market Fit — the most important score in the platform.
//
// Not "can this niche make money?" but "can THIS creator sustainably dominate THIS niche?"
// Like product-market fit, but for a creator.

import { db } from "@/lib/db";
import { jstr, jparseObj } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import { getIdentity } from "./identity";
import type { MarketOpportunityRecord, CreatorMarketFitResult } from "@/lib/types";

export async function getMarketOpportunities(): Promise<MarketOpportunityRecord[]> {
  const rows = await db.marketOpportunity.findMany({ orderBy: { creatorMarketFit: "desc" } });
  return rows.map(decode);
}

// Compute Creator-Market Fit for a specific opportunity
export async function computeCreatorMarketFit(opportunityId: string): Promise<CreatorMarketFitResult> {
  const opp = await db.marketOpportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) throw new Error("Market opportunity not found");

  const identity = await getIdentity();

  const prompt = `You are a venture analyst computing Creator-Market Fit — like product-market fit, but for a creator.

Creator Identity:
- Mission: ${identity?.mission ?? "—"}
- Experiences: ${identity?.experiences.map((e) => `${e.area} (${e.years}y)`).join("; ")}
- Frameworks: ${identity?.frameworks.map((f) => f.name).join(", ")}
- Values: ${identity?.values.join(", ")}

Market Opportunity:
- Niche: ${opp.niche}
- Audience: ${opp.audience}
- Competition: ${opp.competition}
- Growth: ${opp.growthRate}
- Monetization: ${opp.monetization}

Score 0-100 on 9 dimensions:
1. knowledgeMatch — does the creator have deep knowledge in this niche?
2. skillMatch — do their skills (teaching, explaining, researching) fit?
3. interestMatch — is this aligned with their interests?
4. identityMatch — does this fit their identity and values?
5. audienceMatch — does their existing audience overlap?
6. competitionAdvantage — can they outcompete existing creators?
7. monetizationPotential — how well can they monetize?
8. enjoyment — will they enjoy doing this long-term?
9. longevity — is this evergreen or trendy?

Return STRICT JSON:
{
  "dimensions": { "knowledgeMatch": N, "skillMatch": N, "interestMatch": N, "identityMatch": N, "audienceMatch": N, "competitionAdvantage": N, "monetizationPotential": N, "enjoyment": N, "longevity": N },
  "overall": N,
  "rationale": "2-3 sentences on whether THIS creator can sustainably dominate THIS niche"
}`;

  const { data } = await llmJson<any>(prompt, {
    system: "You are a venture analyst. You assess creator-market fit rigorously. A high score means this specific creator has a genuine, sustainable advantage in this specific market. Return strict JSON.",
  });

  const dimensions = {
    knowledgeMatch: clamp(data?.dimensions?.knowledgeMatch),
    skillMatch: clamp(data?.dimensions?.skillMatch),
    interestMatch: clamp(data?.dimensions?.interestMatch),
    identityMatch: clamp(data?.dimensions?.identityMatch),
    audienceMatch: clamp(data?.dimensions?.audienceMatch),
    competitionAdvantage: clamp(data?.dimensions?.competitionAdvantage),
    monetizationPotential: clamp(data?.dimensions?.monetizationPotential),
    enjoyment: clamp(data?.dimensions?.enjoyment),
    longevity: clamp(data?.dimensions?.longevity),
  };

  const overall = clamp(data?.overall ?? Math.round(Object.values(dimensions).reduce((s, v) => s + v, 0) / 9));

  // Update the opportunity with the computed fit
  await db.marketOpportunity.update({
    where: { id: opportunityId },
    data: { creatorMarketFit: overall, personalFit: dimensions.knowledgeMatch / 100 },
  });

  return {
    overall,
    dimensions,
    rationale: data?.rationale ?? "Creator-market fit assessed.",
  };
}

function decode(r: any): MarketOpportunityRecord {
  return {
    id: r.id,
    niche: r.niche,
    audience: r.audience,
    marketSize: r.marketSize,
    competition: r.competition,
    difficulty: r.difficulty,
    growthRate: r.growthRate,
    monetization: r.monetization,
    trustPotential: r.trustPotential,
    longevity: r.longevity,
    personalFit: r.personalFit,
    expectedROI: r.expectedROI,
    creatorMarketFit: r.creatorMarketFit,
    createdAt: r.createdAt.toISOString(),
  };
}

function clamp(n: unknown): number {
  const num = Number(n);
  if (!isFinite(num)) return 50;
  return Math.max(0, Math.min(100, Math.round(num * 10) / 10));
}
