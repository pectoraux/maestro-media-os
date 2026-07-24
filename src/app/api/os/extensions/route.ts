import { listExtensions, installExtension, disableExtension } from "@/lib/os/extensions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;
    const exts = await listExtensions(status ? { status } : undefined);
    return Response.json({ extensions: exts });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "install") {
      const ext = await installExtension(body.extId);
      return Response.json({ extension: ext });
    }
    if (body.action === "disable") {
      const ext = await disableExtension(body.extId);
      return Response.json({ extension: ext });
    }
    return Response.json({ error: "Unknown action. Use 'install' or 'disable'." }, { status: 400 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
