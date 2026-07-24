import { dispatchAgent } from "@/lib/agents";
import type { AgentType } from "@/lib/types";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const agentType = body.agentType as AgentType;
    const projectId = body.projectId as string | undefined;
    const input = body.input as Record<string, unknown> | undefined;

    if (!agentType) {
      return Response.json({ error: "agentType is required" }, { status: 400 });
    }

    // Validate projectId exists when provided
    if (projectId) {
      const project = await db.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return Response.json({ error: "Project not found" }, { status: 404 });
      }
    }

    const response = await dispatchAgent(agentType, { projectId, input });

    if (response.status === "failed") {
      return Response.json({ error: response.error ?? "Agent failed", runId: response.runId }, { status: 500 });
    }
    return Response.json(response);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
