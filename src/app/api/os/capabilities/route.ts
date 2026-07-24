import { listCapabilities } from "@/lib/os/capabilities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category") ?? undefined;
    const caps = await listCapabilities(category ? { category } : undefined);
    return Response.json({ capabilities: caps });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
