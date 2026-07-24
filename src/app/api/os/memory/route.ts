import { listMemories, createMemory, getMemoryCounts } from "@/lib/os/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? undefined;
    const [memories, counts] = await Promise.all([listMemories(type as any), getMemoryCounts()]);
    return Response.json({ memories, counts });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const memory = await createMemory(body);
    return Response.json({ memory });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
