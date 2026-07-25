import { getPrimitive, traceProvenance } from "@/lib/os/primitives";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(_req.url);
    if (url.searchParams.get("trace") === "true") {
      const chain = await traceProvenance(id);
      return Response.json({ chain });
    }
    const primitive = await getPrimitive(id);
    if (!primitive) return Response.json({ error: "Primitive not found" }, { status: 404 });
    return Response.json({ primitive });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
