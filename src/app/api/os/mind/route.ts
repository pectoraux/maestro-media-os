import { getCreatorMind, getMindBrief } from "@/lib/os/creator-mind";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("brief") === "true") {
      const brief = await getMindBrief();
      return Response.json({ brief });
    }
    const mind = await getCreatorMind();
    return Response.json(mind);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
