import { getKnowledgeGraph } from "@/lib/os/knowledge-graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") ?? "100");
    const graph = await getKnowledgeGraph(limit);
    return Response.json(graph);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
