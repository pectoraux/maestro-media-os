import { listTrustProfiles } from "@/lib/os/trust-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId") ?? undefined;
    const profiles = await listTrustProfiles(projectId);
    return Response.json({ profiles });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
