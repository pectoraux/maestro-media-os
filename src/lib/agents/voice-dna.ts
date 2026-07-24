// Agent — Voice DNA Analyst ("Echo")
// Extracts an expanded voice DNA from creator interviews + published scripts.
// Operates across all creator content (no projectId needed).

import type { AgentType, VoiceDNARecord } from "@/lib/types";
import { withRun, logActivity, type AgentCtx } from "./_helpers";
import { gatherVoiceSamples, extractVoiceDNA } from "@/lib/intelligence/voice-dna";

const AGENT: AgentType = "voice_dna";

export async function runVoiceDNA(ctx: AgentCtx): Promise<VoiceDNARecord> {
  return withRun(AGENT, ctx, async () => {
    // 1. Gather voice samples from all creator interviews + scripts.
    const samples = await gatherVoiceSamples();
    if (samples.length === 0) {
      throw new Error(
        "No voice samples found — conduct an interview or write a script first.",
      );
    }

    // 2. Extract the expanded Voice DNA via LLM.
    const dna = await extractVoiceDNA(samples);
    if (!dna) {
      throw new Error("Voice DNA extraction failed — the LLM returned no usable output. Try again.");
    }

    await logActivity({
      type: "agent",
      message: `Voice DNA Analyst (Echo) extracted voice DNA from ${samples.length} samples, uniqueness score ${dna.uniquenessScore}/100`,
      meta: {
        agent: AGENT,
        sampleCount: samples.length,
        uniquenessScore: dna.uniquenessScore,
      },
    });

    return dna;
  });
}
