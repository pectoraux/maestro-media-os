// Output Connectors — YouTube is one of many distribution channels.
// Each channel is a connector. The OS produces once, distributes to many.

import { db } from "@/lib/db";
import { jparseObj, jstr } from "@/lib/json";
import type { OutputChannelRecord } from "@/lib/types";

export async function listChannels(filter?: { status?: string }): Promise<OutputChannelRecord[]> {
  const where: Record<string, unknown> = {};
  if (filter?.status) where.status = filter.status;
  const rows = await db.outputChannel.findMany({ where, orderBy: { category: "asc" } });
  return rows.map(decode);
}

export async function getChannel(key: string): Promise<OutputChannelRecord | null> {
  const row = await db.outputChannel.findUnique({ where: { key } });
  return row ? decode(row) : null;
}

// Connect a channel (in production: OAuth flow; here: record connection config)
export async function connectChannel(key: string, config: Record<string, unknown>): Promise<OutputChannelRecord> {
  const updated = await db.outputChannel.update({
    where: { key },
    data: {
      status: "connected",
      config: jstr(config),
      connectedAt: new Date(),
    },
  });
  return decode(updated);
}

export async function disconnectChannel(key: string): Promise<OutputChannelRecord> {
  const updated = await db.outputChannel.update({
    where: { key },
    data: {
      status: "available",
      config: jstr({}),
      connectedAt: null,
    },
  });
  return decode(updated);
}

// Get all connected channels (the distribution surface)
export async function getConnectedChannels(): Promise<OutputChannelRecord[]> {
  return listChannels({ status: "connected" });
}

function decode(r: any): OutputChannelRecord {
  return {
    id: r.id,
    key: r.key,
    name: r.name,
    icon: r.icon,
    category: r.category,
    description: r.description,
    status: r.status,
    config: jparseObj(r.config),
    connectedAt: r.connectedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
