import { getOutcomes, createOutcome, updateOutcomeProgress } from "@/lib/os/outcomes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;
    const outcomes = await getOutcomes(status ?? undefined);
    return Response.json({ outcomes });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "create") {
      const outcome = await createOutcome(body);
      return Response.json({ outcome });
    }
    if (body.action === "progress") {
      await updateOutcomeProgress(body.id, body.progress);
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
