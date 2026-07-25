// Capability Contracts — the enriched metadata the Director uses to optimize plans.
//
// Each capability declares: inputs, outputs, cost, latency, quality, authenticity
// support (which DNA types it can be checked against), improvesDNA (which DNA
// types it provides reference data for), requires (permissions), provider.
//
// The Director uses these to make intelligent trade-offs: "I need an emotionally
// expressive narration — the Voice Studio capability supports voice+emotion DNA
// at 0.9 quality, $0.22, 30s latency."

import { db } from "@/lib/db";
import { jparseArr, jparseObj } from "@/lib/json";
import type { CapabilityContract, MediaDNAType } from "@/lib/types";

export async function getContract(key: string): Promise<CapabilityContract | null> {
  const row = await db.capability.findUnique({ where: { key } });
  if (!row) return null;
  return decode(row);
}

export async function listContracts(category?: string): Promise<CapabilityContract[]> {
  const where: Record<string, unknown> = { status: "active" };
  if (category) where.category = category;
  const rows = await db.capability.findMany({ where, orderBy: { category: "asc" } });
  return rows.map(decode);
}

// Find capabilities that support a given DNA type (for authenticity checking)
export async function findByDNASupport(dnaType: MediaDNAType): Promise<CapabilityContract[]> {
  const all = await listContracts();
  return all.filter((c) => c.authenticitySupport.includes(dnaType));
}

// Find capabilities that improve a given DNA type (extensions that enhance a DNA model)
export async function findByDNAImprovement(dnaType: MediaDNAType): Promise<CapabilityContract[]> {
  const all = await listContracts();
  return all.filter((c) => c.improvesDNA.includes(dnaType));
}

// Find capabilities that produce a given output primitive type
export async function findByOutput(outputType: string): Promise<CapabilityContract[]> {
  const all = await listContracts();
  return all.filter((c) => c.outputs.some((o) => o.includes(outputType) || outputType.includes(o)));
}

// Director optimization: rank capabilities by a weighted score
// (quality * w1 - cost * w2 - latency * w3)
export function rankCapabilities(caps: CapabilityContract[], opts: { preferQuality?: boolean; preferSpeed?: boolean; preferCost?: boolean } = {}): CapabilityContract[] {
  const w = {
    quality: opts.preferQuality ? 0.6 : opts.preferSpeed ? 0.2 : 0.4,
    cost: opts.preferCost ? 0.5 : 0.2,
    latency: opts.preferSpeed ? 0.5 : 0.2,
    availability: 0.1,
  };
  return [...caps].sort((a, b) => {
    const scoreA = a.qualityScore * w.quality - a.costUsd * w.cost - (a.latencySec / 100) * w.latency;
    const scoreB = b.qualityScore * w.quality - b.costUsd * w.cost - (b.latencySec / 100) * w.latency;
    return scoreB - scoreA;
  });
}

function decode(r: any): CapabilityContract {
  return {
    key: r.key,
    name: r.name,
    description: r.description,
    category: r.category,
    inputs: jparseArr(r.inputs),
    outputs: jparseArr(r.outputs),
    cost: r.cost,
    costUsd: r.costUsd,
    latency: r.latency,
    latencySec: r.latencySec,
    quality: r.quality,
    qualityScore: r.qualityScore,
    authenticitySupport: jparseArr(r.authenticitySupport),
    improvesDNA: jparseArr(r.improvesDNA),
    requires: jparseArr(r.requires),
    provider: r.provider ?? "builtin",
    source: r.source,
  };
}
