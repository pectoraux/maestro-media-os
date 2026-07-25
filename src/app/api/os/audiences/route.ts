import { getAudiences, createAudience } from "@/lib/os/goals-audiences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const audiences = await getAudiences();
    return Response.json({ audiences });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const audience = await createAudience(body);
    return Response.json({ audience });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
