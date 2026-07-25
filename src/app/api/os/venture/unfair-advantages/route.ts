import { getUnfairAdvantages, discoverUnfairAdvantages } from "@/lib/os/venture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const advantages = await getUnfairAdvantages();
    return Response.json({ advantages });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const advantages = await discoverUnfairAdvantages();
    return Response.json({ advantages });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
