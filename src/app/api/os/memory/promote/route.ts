import { promoteMemory, getMemoriesByLifecycle, getLifecycleDistribution, createObservation } from "@/lib/os/memory-lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const stage = url.searchParams.get("stage") ?? undefined;
    const [memories, distribution] = await Promise.all([
      getMemoriesByLifecycle(stage as any),
      getLifecycleDistribution(),
    ]);
    return Response.json({ memories, distribution });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "promote") {
      const memory = await promoteMemory(body.id, body.evidence);
      return Response.json({ memory });
    }
    if (body.action === "observe") {
      const memory = await createObservation(body);
      return Response.json({ memory });
    }
    return Response.json({ error: "Unknown action. Use 'promote' or 'observe'." }, { status: 400 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
