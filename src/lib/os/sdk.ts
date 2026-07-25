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
        { key: "video.generate", name: "Video Generation", description: "Generate talking-head video from script", inputs: ["script", "scene"], outputs: ["videoUrl"], authenticity: ["visual", "editing"], improvesDNA: ["visual", "editing"], cost: 0.5, latencySec: 120, qualityScore: 0.8 },
        { key: "video.lipsync", name: "Lip Sync", description: "Sync audio to generated video", inputs: ["videoUrl", "audioUrl"], outputs: ["syncedVideoUrl"], authenticity: ["visual"], improvesDNA: ["visual"], cost: 0.1, latencySec: 30, qualityScore: 0.85 },
        { key: "video.camera_motion", name: "Camera Motion", description: "Plan and generate camera movements", inputs: ["scene"], outputs: ["cameraPlan"], authenticity: ["visual"], improvesDNA: ["visual"], cost: 0.05, latencySec: 15, qualityScore: 0.8 },
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
        { key: "voice.clone", name: "Voice Clone", description: "Clone the creator's voice from samples", inputs: ["voiceSamples"], outputs: ["voiceModelId"], authenticity: ["voice"], improvesDNA: ["voice"], cost: 0.5, latencySec: 60, qualityScore: 0.92 },
        { key: "voice.synthesize", name: "Speech Synthesis", description: "Synthesize speech in the cloned voice", inputs: ["script", "voiceModelId"], outputs: ["audioUrl"], authenticity: ["voice"], improvesDNA: ["voice"], cost: 0.22, latencySec: 18, qualityScore: 0.9 },
        { key: "voice.emotion", name: "Emotion Control", description: "Apply emotional modulation to synthesized speech", inputs: ["audioUrl", "emotion"], outputs: ["emotionalAudioUrl"], authenticity: ["voice"], improvesDNA: ["voice"], cost: 0.05, latencySec: 10, qualityScore: 0.88 },
      ],
      agents: ["Voice Director"],
      connectors: ["elevenlabs"],
      workflows: ["podcast", "youtube-video"],
      permissions: ["voice.read", "voice.synthesize"],
    },
  },
  {
    name: "Research Pro",
    manifest: {
      id: "research-pro",
      version: "1.0",
      name: "Research Pro",
      description: "Deep Reddit scanning, scientific paper search, and automated fact verification.",
      capabilities: [
        { key: "research.reddit_deep_scan", name: "Reddit Deep Scan", description: "Mine Reddit for audience questions, objections, and pain points", inputs: ["niche"], outputs: ["audienceInsights"], authenticity: ["reasoning"], improvesDNA: ["reasoning"], cost: 0.05, latencySec: 20, qualityScore: 0.85 },
        { key: "research.papers", name: "Scientific Paper Search", description: "Search academic papers for evidence", inputs: ["query"], outputs: ["papers"], improvesDNA: ["reasoning"], cost: 0.03, latencySec: 10, qualityScore: 0.9 },
        { key: "research.fact_check", name: "Web Fact Check", description: "Automated fact verification with source cross-checking", inputs: ["claim"], outputs: ["verification"], authenticity: ["reasoning"], improvesDNA: ["reasoning"], cost: 0.02, latencySec: 8, qualityScore: 0.88 },
      ],
      agents: ["Research Analyst"],
      connectors: [],
      workflows: ["youtube-video", "newsletter"],
      permissions: ["project.read", "knowledge.write"],
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
