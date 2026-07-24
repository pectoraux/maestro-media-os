import { listChannels, connectChannel, disconnectChannel } from "@/lib/os/connectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;
    const channels = await listChannels(status ? { status } : undefined);
    return Response.json({ channels });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "connect") {
      const ch = await connectChannel(body.key, body.config ?? {});
      return Response.json({ channel: ch });
    }
    if (body.action === "disconnect") {
      const ch = await disconnectChannel(body.key);
      return Response.json({ channel: ch });
    }
    return Response.json({ error: "Unknown action. Use 'connect' or 'disconnect'." }, { status: 400 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
