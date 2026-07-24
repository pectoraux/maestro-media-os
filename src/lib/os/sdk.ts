// Developer SDK — the defineExtension() abstraction.
//
// Developers publish extensions via a manifest. The kernel discovers the new
// capabilities automatically — no core code changes needed.
//
// Usage:
//   defineExtension({
//     id: "real-video", version: "2.1",
//     name: "Realistic Video Studio",
//     capabilities: [{ key: "video.generate", name: "Video Generation", ... }],
//     agents: ["Video Director"], connectors: ["runway", "veo"],
//     workflows: ["youtube-video"], permissions: ["project.read", "video.generate"]
//   })

import { db } from "@/lib/db";
import { jstr } from "@/lib/json";
import { registerCapability } from "./capabilities";
import type { ExtensionManifest, ExtensionRecord } from "@/lib/types";

// The canonical manifest shape (exported for SDK consumers)
export function defineExtension(manifest: ExtensionManifest): ExtensionManifest {
  // Validate
  if (!manifest.id) throw new Error("Extension manifest requires an id");
  if (!manifest.version) throw new Error("Extension manifest requires a version");
  if (!manifest.capabilities || manifest.capabilities.length === 0) throw new Error("Extension must declare at least one capability");
  return manifest;
}

// Publish a developer extension: creates the Extension row + registers capabilities
export async function publishExtension(manifest: ExtensionManifest): Promise<ExtensionRecord> {
  const existing = await db.extension.findUnique({ where: { extId: manifest.id } });
  if (existing) {
    // Update existing extension's manifest + capabilities
    const updated = await db.extension.update({
      where: { extId: manifest.id },
      data: {
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        capabilities: jstr(manifest.capabilities.map((c) => c.key)),
        agents: jstr(manifest.agents),
        permissions: jstr(manifest.permissions),
        manifest: jstr(manifest),
      },
    });
    // Register/update capabilities
    for (const cap of manifest.capabilities) {
      const existingCap = await db.capability.findUnique({ where: { key: cap.key } });
      if (!existingCap) {
        await registerCapability({
          key: cap.key,
          name: cap.name,
          description: cap.description,
          category: "production", // SDK extensions default to production
          inputs: Object.fromEntries((cap.inputs ?? []).map((i) => [i, "any"])),
          outputs: Object.fromEntries((cap.outputs ?? []).map((o) => [o, "any"])),
          cost: "medium",
          latency: "medium",
          quality: "production",
          source: `extension:${manifest.id}`,
          extensionId: updated.id,
          status: updated.status === "installed" ? "active" : "disabled",
        });
      }
    }
    return decode(updated);
  }

  // Create new extension (available, not installed by default)
  const created = await db.extension.create({
    data: {
      extId: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      publisher: "Developer SDK",
      capabilities: jstr(manifest.capabilities.map((c) => c.key)),
      agents: jstr(manifest.agents),
      permissions: jstr(manifest.permissions),
      manifest: jstr(manifest),
      category: "studio",
      status: "available",
    },
  });

  // Register the capabilities (disabled until installed)
  for (const cap of manifest.capabilities) {
    await registerCapability({
      key: cap.key,
      name: cap.name,
      description: cap.description,
      category: "production",
      inputs: Object.fromEntries((cap.inputs ?? []).map((i) => [i, "any"])),
      outputs: Object.fromEntries((cap.outputs ?? []).map((o) => [o, "any"])),
      cost: "medium",
      latency: "medium",
      quality: "production",
      source: `extension:${manifest.id}`,
      extensionId: created.id,
      status: "disabled",
    });
  }

  return decode(created);
}

// Example manifests (for the SDK reference view)
export const EXAMPLE_MANIFESTS: { name: string; manifest: ExtensionManifest }[] = [
  {
    name: "Realistic Video Studio",
    manifest: {
      id: "real-video",
      version: "2.1",
      name: "Realistic Video Studio",
      description: "Generate talking-head video, B-roll, lip sync, emotion control, shot planning, camera motion.",
      capabilities: [
        { key: "video.generate", name: "Video Generation", description: "Generate talking-head video from script", inputs: ["script", "scene"], outputs: ["videoUrl"] },
        { key: "video.lipsync", name: "Lip Sync", description: "Sync audio to generated video", inputs: ["videoUrl", "audioUrl"], outputs: ["syncedVideoUrl"] },
        { key: "video.camera_motion", name: "Camera Motion", description: "Plan and generate camera movements", inputs: ["scene"], outputs: ["cameraPlan"] },
      ],
      agents: ["Video Director"],
      connectors: ["runway", "veo", "kling"],
      workflows: ["youtube-video", "instagram-reel"],
      permissions: ["project.read", "video.generate", "asset.write"],
    },
  },
  {
    name: "Voice Studio",
    manifest: {
      id: "voice-studio-dev",
      version: "2.1",
      name: "Voice Studio",
      description: "Voice cloning, accent control, emotion, breathing, pacing, whisper, singing.",
      capabilities: [
        { key: "voice.clone", name: "Voice Clone", description: "Clone the creator's voice from samples", inputs: ["voiceSamples"], outputs: ["voiceModelId"] },
        { key: "voice.synthesize", name: "Speech Synthesis", description: "Synthesize speech in the cloned voice", inputs: ["script", "voiceModelId"], outputs: ["audioUrl"] },
        { key: "voice.emotion", name: "Emotion Control", description: "Apply emotional modulation to synthesized speech", inputs: ["audioUrl", "emotion"], outputs: ["emotionalAudioUrl"] },
      ],
      agents: ["Voice Director"],
      connectors: ["elevenlabs"],
      workflows: ["podcast", "youtube-video"],
      permissions: ["voice.read", "voice.synthesize"],
    },
  },
];

function decode(r: any): ExtensionRecord {
  return {
    id: r.id,
    extId: r.extId,
    name: r.name,
    version: r.version,
    description: r.description,
    publisher: r.publisher,
    capabilities: JSON.parse(r.capabilities),
    agents: JSON.parse(r.agents),
    permissions: JSON.parse(r.permissions),
    category: r.category,
    status: r.status,
    installedAt: r.installedAt?.toISOString() ?? null,
    manifest: JSON.parse(r.manifest),
    createdAt: r.createdAt.toISOString(),
  };
}
