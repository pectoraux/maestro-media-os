import { publishExtension, defineExtension, EXAMPLE_MANIFESTS } from "@/lib/os/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ examples: EXAMPLE_MANIFESTS });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const manifest = await request.json();
    const validated = defineExtension(manifest);
    const extension = await publishExtension(validated);
    return Response.json({ extension });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
