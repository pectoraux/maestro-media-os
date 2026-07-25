import { getGoals, createGoal } from "@/lib/os/goals-audiences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;
    const goals = await getGoals(status ?? undefined);
    return Response.json({ goals });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const goal = await createGoal(body);
    return Response.json({ goal });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
