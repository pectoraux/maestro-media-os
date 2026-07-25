import { listPrimitives, createPrimitive, getPrimitiveCounts, traceProvenance } from "@/lib/os/primitives";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? undefined;
    const projectId = url.searchParams.get("projectId") ?? undefined;
    const [primitives, counts] = await Promise.all([
      listPrimitives(type as any, projectId ?? undefined),
      getPrimitiveCounts(),
    ]);
    return Response.json({ primitives, counts });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const primitive = await createPrimitive(body);
    return Response.json({ primitive });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
