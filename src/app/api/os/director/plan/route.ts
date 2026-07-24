import { compilePlan, savePlan } from "@/lib/os/director";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST: compile a plan from a creative intent
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { intent, targetChannel, projectId, preferences } = body;
    if (!intent) return Response.json({ error: "intent is required" }, { status: 400 });

    const plan = await compilePlan({ intent, targetChannel, projectId, preferences });
    const saved = await savePlan(plan, projectId);
    return Response.json({ plan: plan, savedPlan: saved });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
