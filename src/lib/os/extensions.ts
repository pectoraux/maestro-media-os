// Extension Manager — extensions declare capabilities, agents, and permissions
// via a manifest. The OS discovers them dynamically.

import { db } from "@/lib/db";
import { jparseArr, jparseObj, jstr } from "@/lib/json";
import { registerCapability, listCapabilities } from "./capabilities";
import type { ExtensionRecord } from "@/lib/types";

export async function listExtensions(filter?: { status?: string }): Promise<ExtensionRecord[]> {
  const where: Record<string, unknown> = {};
  if (filter?.status) where.status = filter.status;
  const rows = await db.extension.findMany({ where, orderBy: { createdAt: "asc" } });
  return rows.map(decode);
}

export async function getExtension(extId: string): Promise<ExtensionRecord | null> {
  const row = await db.extension.findUnique({ where: { extId } });
  return row ? decode(row) : null;
}

// Install an available extension: registers its capabilities + marks installed
export async function installExtension(extId: string): Promise<ExtensionRecord> {
  const ext = await db.extension.findUnique({ where: { extId } });
  if (!ext) throw new Error(`Extension "${extId}" not found`);
  if (ext.status === "installed") return decode(ext);

  // Register each capability the extension provides (if not already present)
  const capKeys = jparseArr<string>(ext.capabilities);
  const existingCaps = await listCapabilities();
  const existingKeys = new Set(existingCaps.map((c) => c.key));

  for (const key of capKeys) {
    if (!existingKeys.has(key)) {
      // Register a stub capability for this extension-provided skill
      await registerCapability({
        key,
        name: key.split(".").pop()?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? key,
        description: `Provided by ${ext.name}`,
        category: "production",
        inputs: { input: "any" },
        outputs: { output: "any" },
        cost: "high",
        latency: "slow",
        quality: "production",
        source: `extension:${extId}`,
        extensionId: ext.id,
        status: "active",
      });
    } else {
      // Capability already exists (builtin); mark its source as extension-enhanced
      await db.capability.updateMany({
        where: { key },
        data: { source: `extension:${extId}`, extensionId: ext.id },
      });
    }
  }

  const updated = await db.extension.update({
    where: { extId },
    data: { status: "installed", installedAt: new Date() },
  });

  await db.auditEvent?.create?.({
    data: {
      actor: "creator",
      action: "extension.installed",
      entityType: "extension",
      entityId: ext.id,
      summary: `Installed extension "${ext.name}" v${ext.version}`,
      details: jstr({ extId, capabilities: capKeys }),
      severity: "info",
    },
  }).catch(() => {}); // auditEvent may not exist in this schema version

  return decode(updated);
}

// Disable an installed extension (its capabilities become unavailable)
export async function disableExtension(extId: string): Promise<ExtensionRecord> {
  const ext = await db.extension.findUnique({ where: { extId } });
  if (!ext) throw new Error(`Extension "${extId}" not found`);
  const updated = await db.extension.update({
    where: { extId },
    data: { status: "available", installedAt: null },
  });
  // Disable its capabilities
  await db.capability.updateMany({
    where: { extensionId: ext.id },
    data: { status: "disabled" },
  });
  return decode(updated);
}

// Check if a capability's providing extension is installed
export async function isCapabilityAvailable(capabilityKey: string): Promise<boolean> {
  const cap = await db.capability.findUnique({ where: { key: capabilityKey } });
  if (!cap || cap.status !== "active") return false;
  if (cap.source === "builtin") return true;
  // extension-provided: check the extension is installed
  if (cap.extensionId) {
    const ext = await db.extension.findUnique({ where: { id: cap.extensionId } });
    return ext?.status === "installed";
  }
  return false;
}

function decode(r: any): ExtensionRecord {
  return {
    id: r.id,
    extId: r.extId,
    name: r.name,
    version: r.version,
    description: r.description,
    publisher: r.publisher,
    capabilities: jparseArr(r.capabilities),
    agents: jparseArr(r.agents),
    permissions: jparseArr(r.permissions),
    category: r.category,
    status: r.status,
    installedAt: r.installedAt?.toISOString() ?? null,
    manifest: jparseObj(r.manifest),
    createdAt: r.createdAt.toISOString(),
  };
}
