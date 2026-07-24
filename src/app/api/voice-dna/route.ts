// /api/voice-dna
// GET  → returns the latest VoiceDNA record (or null).
// POST {} → re-extracts voice DNA from all creator samples.

import { getLatestVoiceDNA, gatherVoiceSamples, extractVoiceDNA } from "@/lib/intelligence/voice-dna";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const voiceDNA = await getLatestVoiceDNA();
    return Response.json({ voiceDNA });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(_request: Request) {
  try {
    const samples = await gatherVoiceSamples();
    if (samples.length === 0) {
      return Response.json(
        { error: "No voice samples found — conduct an interview or write a script first." },
        { status: 400 },
      );
    }
    const voiceDNA = await extractVoiceDNA(samples);
    if (!voiceDNA) {
      return Response.json(
        { error: "Voice DNA extraction failed — the LLM returned no usable output. Try again." },
        { status: 500 },
      );
    }
    return Response.json({ voiceDNA });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
