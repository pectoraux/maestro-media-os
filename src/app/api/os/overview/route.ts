import { getOverview } from "@/lib/os/director";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const overview = await getOverview();
    return Response.json(overview);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
