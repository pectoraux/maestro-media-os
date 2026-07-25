import { getVenture, updateVenture } from "@/lib/os/venture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const venture = await getVenture();
    return Response.json({ venture });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const patch = await request.json();
    const venture = await updateVenture(patch);
    return Response.json({ venture });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
