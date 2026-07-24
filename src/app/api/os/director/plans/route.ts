import { listPlans, getPlan, approvePlan } from "@/lib/os/director";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId") ?? undefined;
    const plans = await listPlans(projectId);
    return Response.json({ plans });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
