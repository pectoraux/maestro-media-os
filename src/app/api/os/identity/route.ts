import { getIdentity, updateIdentity, recomputeAuthenticity } from "@/lib/os/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const identity = await getIdentity();
    return Response.json({ identity });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const patch = await request.json();
    const updated = await updateIdentity(patch);
    return Response.json({ identity: updated });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const score = await recomputeAuthenticity();
    const identity = await getIdentity();
    return Response.json({ identity, authenticityScore: score });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
