// Capability Registry — everything the OS can do is a capability.
// Capabilities are discoverable, composable, and can be provided by builtin
// agents or by installed extensions.

import { db } from "@/lib/db";
import { jparseObj } from "@/lib/json";
import type { CapabilityRecord } from "@/lib/types";

export async function listCapabilities(filter?: { category?: string; status?: string }): Promise<CapabilityRecord[]> {
  const where: Record<string, unknown> = {};
  if (filter?.category) where.category = filter.category;
  if (filter?.status) where.status = filter.status;
  const rows = await db.capability.findMany({ where, orderBy: { category: "asc" } });
  return rows.map(decode);
}

export async function getCapabilityByKey(key: string): Promise<CapabilityRecord | null> {
  const row = await db.capability.findUnique({ where: { key } });
  return row ? decode(row) : null;
}

// Discover capabilities that can produce a given output type
export async function discoverByOutput(outputType: string): Promise<CapabilityRecord[]> {
  const all = await listCapabilities({ status: "active" });
  return all.filter((c) => Object.values(c.outputs).some((o) => o.includes(outputType) || outputType.includes(o)));
}

// Discover capabilities that accept a given input type
export async function discoverByInput(inputType: string): Promise<CapabilityRecord[]> {
  const all = await listCapabilities({ status: "active" });
  return all.filter((c) => Object.keys(c.inputs).some((i) => i.includes(inputType) || inputType.includes(i)));
}

// Register a new capability (from an extension install)
export async function registerCapability(data: Omit<CapabilityRecord, "id" | "createdAt">): Promise<CapabilityRecord> {
  const created = await db.capability.create({
    data: {
      key: data.key,
      name: data.name,
      description: data.description,
      category: data.category,
      inputs: JSON.stringify(data.inputs),
      outputs: JSON.stringify(data.outputs),
      cost: data.cost,
      latency: data.latency,
      quality: data.quality,
      source: data.source,
      extensionId: data.extensionId ?? null,
      agentType: data.agentType ?? null,
      status: data.status,
    },
  });
  return decode(created);
}

function decode(r: any): CapabilityRecord {
  return {
    id: r.id,
    key: r.key,
    name: r.name,
    description: r.description,
    category: r.category,
    inputs: jparseObj(r.inputs),
    outputs: jparseObj(r.outputs),
    cost: r.cost,
    latency: r.latency,
    quality: r.quality,
    source: r.source,
    extensionId: r.extensionId,
    agentType: r.agentType,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
}
