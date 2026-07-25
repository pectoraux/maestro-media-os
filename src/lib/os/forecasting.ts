// Financial Forecasting — scenario-based projections.
//
// Not "this niche is good" but "if you publish 2 videos/week for 18 months
// with quality 83 and retention 47%, targeting startup founders, then..."
// Conservative / Expected / Aggressive scenarios with confidence intervals.

import { db } from "@/lib/db";
import { jstr, jparseObj } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import { getVenture } from "./venture";
import type { FinancialForecastRecord } from "@/lib/types";

export interface ForecastInput {
  videosPerWeek: number;
  qualityLevel: number; // 0-100
  retention: number; // percentage
  targetAudience: string;
  horizonMonths?: number;
}

export async function generateForecast(input: ForecastInput): Promise<FinancialForecastRecord[]> {
  const venture = await getVenture();
  const currentSubs = 34000; // would come from YouTube API
  const horizon = input.horizonMonths ?? 18;

  const scenarios = ["conservative", "expected", "aggressive"] as const;
  const results: FinancialForecastRecord[] = [];

  for (const scenario of scenarios) {
    const prompt = `You are a financial forecaster for a creator venture. Generate a ${scenario} forecast.

Current state:
- Current subscribers: ${currentSubs}
- Current monthly revenue: ~$7,100 (ads + sponsorships + consulting)
- Revenue streams: ${JSON.stringify(venture?.revenueStreams ?? [])}

Assumptions:
- Videos per week: ${input.videosPerWeek}
- Quality level: ${input.qualityLevel}/100
- Retention: ${input.retention}%
- Target audience: ${input.targetAudience}
- Horizon: ${horizon} months
- Scenario: ${scenario}

Generate projections for ${horizon} months from now:
- subscribers (total)
- monthlyViews
- sponsorshipRevenue (monthly $)
- affiliateRevenue (monthly $)
- courseSales (monthly $, 0 if no course yet)
- consultingLeads (per month)
- arr (annualized recurring revenue)

For ${scenario}: ${scenario === "conservative" ? "assume below-average growth, no viral hits, slower product launch" : scenario === "expected" ? "assume average growth, steady cadence, course launches on time" : "assume above-average growth, some viral hits, course exceeds expectations"}

Also provide confidenceLow and confidenceHigh (the range around the expected projection).

Return STRICT JSON:
{
  "projections": { "subscribers": N, "monthlyViews": N, "sponsorshipRevenue": N, "affiliateRevenue": N, "courseSales": N, "consultingLeads": N, "arr": N },
  "confidenceLow": { "subscribers": N, "monthlyViews": N, "sponsorshipRevenue": N, "affiliateRevenue": N, "courseSales": N, "consultingLeads": N, "arr": N },
  "confidenceHigh": { "subscribers": N, "monthlyViews": N, "sponsorshipRevenue": N, "affiliateRevenue": N, "courseSales": N, "consultingLeads": N, "arr": N },
  "confidence": 0.0-1.0
}`;

    const { data } = await llmJson<any>(prompt, {
      system: "You are a conservative financial forecaster. You produce realistic projections, not hype. Return strict JSON.",
    });

    const created = await db.financialForecast.create({
      data: {
        scenario,
        horizonMonths: horizon,
        assumptions: jstr(input),
        projections: jstr(data?.projections ?? {}),
        confidenceLow: jstr(data?.confidenceLow ?? {}),
        confidenceHigh: jstr(data?.confidenceHigh ?? {}),
        confidence: clamp01(data?.confidence ?? 0.5),
      },
    });

    results.push({
      id: created.id,
      scenario,
      horizonMonths: horizon,
      assumptions: jparseObj(created.assumptions),
      projections: jparseObj(created.projections),
      confidenceLow: jparseObj(created.confidenceLow),
      confidenceHigh: jparseObj(created.confidenceHigh),
      confidence: created.confidence,
      createdAt: created.createdAt.toISOString(),
    });
  }

  return results;
}

export async function getForecasts(): Promise<FinancialForecastRecord[]> {
  const rows = await db.financialForecast.findMany({ orderBy: { createdAt: "desc" }, take: 9 });
  return rows.map((r) => ({
    id: r.id,
    scenario: r.scenario,
    horizonMonths: r.horizonMonths,
    assumptions: jparseObj(r.assumptions),
    projections: jparseObj(r.projections),
    confidenceLow: jparseObj(r.confidenceLow),
    confidenceHigh: jparseObj(r.confidenceHigh),
    confidence: r.confidence,
    createdAt: r.createdAt.toISOString(),
  }));
}

function clamp01(n: unknown): number {
  const num = Number(n);
  if (!isFinite(num)) return 0.5;
  return Math.max(0, Math.min(1, Math.round(num * 100) / 100));
}
