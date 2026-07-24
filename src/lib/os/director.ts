// Capability Graph + Director AI
//
// The Director takes a creative intent, discovers available capabilities (from
// builtin + installed extensions), and compiles a dynamic production plan.
// The plan is grounded in the Creator Identity — "AI should imitate YOU."
//
// This replaces hardcoded agent pipelines with dynamic, capability-driven orchestration.

import { db } from "@/lib/db";
import { jstr } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import { listCapabilities, getCapabilityByKey, type CapabilityRecord } from "./capabilities";
import { isCapabilityAvailable } from "./extensions";
import { getIdentityContext } from "./identity";
import { getConnectedChannels } from "./connectors";
import type { CompiledPlan, ProductionPlanStep, ProductionPlanRecord } from "@/lib/types";

// The canonical production phases (the Director reasons over these)
const PRODUCTION_PHASES = [
  { phase: "intelligence", label: "Intelligence", description: "Gather signals, analyze competitors, build research dossier" },
  { phase: "creative", label: "Creative", description: "Interview creator, model voice, architect story, write script, optimize trifecta" },
  { phase: "production", label: "Production", description: "Design scenes, generate assets (video/voice/thumbnails), edit" },
  { phase: "distribution", label: "Distribution", description: "SEO, multi-channel repurposing, publish to output channels" },
  { phase: "learning", label: "Learning", description: "Analyze performance, extract lessons, update knowledge graph" },
] as const;

export interface DirectorInput {
  intent: string; // e.g. "Make a 12-min video on vector databases for senior engineers"
  targetChannel?: string; // e.g. "youtube" (default: primary connected channel)
  projectId?: string;
  preferences?: {
    useVoiceCloning?: boolean;
    useVideoGeneration?: boolean;
    multiChannel?: boolean;
    targetLength?: number;
  };
}

// Compile a production plan from a creative intent
export async function compilePlan(input: DirectorInput): Promise<CompiledPlan> {
  const identity = await getIdentityContext();
  const allCaps = await listCapabilities({ status: "active" });
  const channels = await getConnectedChannels();
  const targetChannel = input.targetChannel ?? channels[0]?.key ?? "youtube";

  // Filter to available capabilities (extension-provided ones must have the extension installed)
  const available: CapabilityRecord[] = [];
  for (const cap of allCaps) {
    const ok = await isCapabilityAvailable(cap.key);
    if (ok) available.push(cap);
  }

  // Apply preferences: explicitly opt into extension capabilities
  if (input.preferences?.useVoiceCloning) {
    const vc = allCaps.find((c) => c.key === "production.voice_cloning");
    if (vc && !available.includes(vc)) available.push(vc);
  }
  if (input.preferences?.useVideoGeneration) {
    const vg = allCaps.find((c) => c.key === "production.video_generation");
    if (vg && !available.includes(vg)) available.push(vg);
  }

  const capabilitiesDigest = available.map((c) => ({
    key: c.key,
    name: c.name,
    category: c.category,
    description: c.description,
    inputs: Object.keys(c.inputs),
    outputs: Object.values(c.outputs),
    cost: c.cost,
    latency: c.latency,
    quality: c.quality,
    source: c.source,
  }));

  const prompt = `You are the Executive Director AI of a Media Operating System. Your job is to compile a production plan from a creative intent by selecting from the available capabilities.

${identity}

CREATIVE INTENT: "${input.intent}"
TARGET CHANNEL: ${targetChannel}
PREFERENCES: ${JSON.stringify(input.preferences ?? {})}

AVAILABLE CAPABILITIES (only use these — do not invent capabilities):
${JSON.stringify(capabilitiesDigest, null, 2)}

Compile a production plan that flows through the phases: Intelligence → Creative → Production → Distribution → Learning. For each step:
1. Select the best capability from the available list
2. Explain WHY this capability is the right choice (traceable rationale)
3. Note what it inputs and outputs
4. Mark whether human approval is required (creative decisions always require approval; intelligence/learning usually don't)

Design principles:
- Ground the plan in the Creator Identity above. The script must sound like THIS creator.
- Prefer builtin capabilities over extension capabilities unless preferences request extensions.
- If the creator requested voice cloning or video generation, include those steps.
- If multi-channel is requested, include a multi-channel repurposing step.
- The plan should be specific to the intent (not a generic template).

Return STRICT JSON:
{
  "steps": [
    {
      "stepKey": "intelligence.signals",
      "stepLabel": "Gather signals",
      "capabilityKey": "intelligence.signals",
      "capabilityName": "Signal Gathering",
      "agentType": "opportunity_hunter",
      "inputs": ["niche"],
      "outputs": ["signals", "score"],
      "rationale": "why this capability here",
      "requiresApproval": false
    }
  ],
  "rationale": "2-3 sentences on the overall plan strategy",
  "capabilitiesConsidered": [
    { "key": "production.video_generation", "name": "Video Generation", "used": false, "reason": "not requested by creator" }
  ],
  "extensionsRequired": ["voice-studio"],
  "identityGrounded": true
}`;

  const { data } = await llmJson<{ steps: any[]; rationale: string; capabilitiesConsidered: any[]; extensionsRequired: string[]; identityGrounded: boolean }>(prompt, {
    system: "You are the Executive Director AI of a Media Operating System. You compile production plans by composing available capabilities. You never invent capabilities — you only select from what's available. Return strict JSON.",
  });

  const steps: ProductionPlanStep[] = (data?.steps ?? []).map((s) => ({
    stepKey: s.stepKey ?? s.capabilityKey,
    stepLabel: s.stepLabel ?? s.capabilityName,
    capabilityKey: s.capabilityKey,
    capabilityName: s.capabilityName,
    agentType: s.agentType ?? null,
    inputs: s.inputs ?? [],
    outputs: s.outputs ?? [],
    rationale: s.rationale ?? "",
    requiresApproval: s.requiresApproval ?? true,
    status: "pending" as const,
  }));

  const capabilitiesUsed = steps.map((s) => s.capabilityKey);

  return {
    intent: input.intent,
    targetChannel,
    steps,
    rationale: data?.rationale ?? "Plan compiled by the Director AI.",
    capabilitiesUsed,
    capabilitiesConsidered: (data?.capabilitiesConsidered ?? []).map((c) => ({
      key: c.key,
      name: c.name,
      used: c.used ?? false,
      reason: c.reason ?? "",
    })),
    identityGrounded: data?.identityGrounded ?? true,
    extensionsRequired: data?.extensionsRequired ?? [],
  };
}

// Persist a compiled plan
export async function savePlan(plan: CompiledPlan, projectId?: string): Promise<ProductionPlanRecord> {
  const created = await db.productionPlan.create({
    data: {
      projectId: projectId ?? null,
      intent: plan.intent,
      targetChannel: plan.targetChannel,
      steps: jstr(plan.steps),
      rationale: plan.rationale,
      capabilitiesUsed: jstr(plan.capabilitiesUsed),
      status: "draft",
    },
  });
  return decode(created);
}

// List plans
export async function listPlans(projectId?: string): Promise<ProductionPlanRecord[]> {
  const where = projectId ? { projectId } : {};
  const rows = await db.productionPlan.findMany({ where, orderBy: { createdAt: "desc" }, take: 20 });
  return rows.map(decode);
}

// Get a plan
export async function getPlan(id: string): Promise<ProductionPlanRecord | null> {
  const row = await db.productionPlan.findUnique({ where: { id } });
  return row ? decode(row) : null;
}

// Approve a plan (transition to "approved" → ready to execute)
export async function approvePlan(id: string): Promise<ProductionPlanRecord> {
  const updated = await db.productionPlan.update({ where: { id }, data: { status: "approved" } });
  return decode(updated);
}

// Media OS overview (for the kernel dashboard)
export async function getOverview(): Promise<{
  capabilityCount: number;
  extensionCount: number;
  installedExtensionCount: number;
  channelCount: number;
  connectedChannelCount: number;
  identityAuthenticity: number;
  capabilitiesByCategory: { category: string; count: number }[];
  activePlans: number;
}> {
  const caps = await listCapabilities({ status: "active" });
  const catCounts: Record<string, number> = {};
  for (const c of caps) catCounts[c.category] = (catCounts[c.category] ?? 0) + 1;

  const exts = await db.extension.findMany();
  const channels = await db.outputChannel.findMany();
  const identity = await db.creatorIdentity.findFirst();
  const activePlans = await db.productionPlan.count({ where: { status: { in: ["approved", "running"] } } });

  return {
    capabilityCount: caps.length,
    extensionCount: exts.length,
    installedExtensionCount: exts.filter((e) => e.status === "installed").length,
    channelCount: channels.length,
    connectedChannelCount: channels.filter((c) => c.status === "connected").length,
    identityAuthenticity: identity?.authenticityScore ?? 0,
    capabilitiesByCategory: Object.entries(catCounts).map(([category, count]) => ({ category, count })),
    activePlans,
  };
}

function decode(r: any): ProductionPlanRecord {
  return {
    id: r.id,
    projectId: r.projectId,
    intent: r.intent,
    targetChannel: r.targetChannel,
    steps: typeof r.steps === "string" ? JSON.parse(r.steps) : r.steps,
    rationale: r.rationale,
    capabilitiesUsed: typeof r.capabilitiesUsed === "string" ? JSON.parse(r.capabilitiesUsed) : r.capabilitiesUsed,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
