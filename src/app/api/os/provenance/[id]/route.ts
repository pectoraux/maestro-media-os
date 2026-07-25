import { traceProvenance, explainProvenance } from "@/lib/os/provenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(_req.url);
    if (url.searchParams.get("explain") === "true") {
      const explanation = await explainProvenance(id);
      return Response.json({ explanation });
    }
    const result = await traceProvenance(id);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
