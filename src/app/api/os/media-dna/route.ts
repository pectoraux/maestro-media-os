import { listMediaDNA, updateMediaDNA } from "@/lib/os/media-dna";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dnas = await listMediaDNA();
    return Response.json({ dnas });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateMediaDNA(body.type, body.content, body.confidence);
    return Response.json({ dna: updated });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
