// /api/youtube
// GET  → returns the current YouTube connection state.
// POST { action: "connect" | "disconnect", channelName? } → connect/disconnect.

import {
  getConnection,
  connectChannel,
  disconnectChannel,
} from "@/lib/intelligence/youtube-publishing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const connection = await getConnection();
    return Response.json({ connection });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action as "connect" | "disconnect" | undefined;

    if (action === "connect") {
      const channelName = (body.channelName as string | undefined) ?? "My YouTube Channel";
      const connection = await connectChannel(channelName);
      return Response.json({ connection });
    }

    if (action === "disconnect") {
      await disconnectChannel();
      const connection = await getConnection();
      return Response.json({ connection });
    }

    return Response.json(
      { error: `Unknown action "${action}" — must be "connect" or "disconnect"` },
      { status: 400 },
    );
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
