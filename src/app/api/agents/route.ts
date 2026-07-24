import { db } from "@/lib/db";
import { AGENTS } from "@/lib/agents-registry";
import { jparseObj } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Aggregate last run + count per agentType
    const runs = await db.agentRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 500, // recent window for status derivation
    });
    const seen = new Map<string, { status: string; createdAt: Date; count: number }>();
    for (const r of runs) {
      const entry = seen.get(r.agentType);
      if (!entry) {
        seen.set(r.agentType, { status: r.status, createdAt: r.createdAt, count: 1 });
      } else {
        entry.count++;
        // keep most recent run's status
      }
    }
    // Recompute counts + most recent status properly:
    const byAgent = new Map<string, { runs: typeof runs }>();
    for (const r of runs) {
      const arr = byAgent.get(r.agentType) ?? { runs: [] };
      arr.runs.push(r);
      byAgent.set(r.agentType, arr);
    }

    const agents = AGENTS.map((a) => {
      const arr = byAgent.get(a.type)?.runs ?? [];
      const latest = arr[0];
      const status = latest ? latest.status : "idle"; // running | succeeded | failed | idle
      return {
        type: a.type,
        name: a.name,
        role: a.role,
        icon: a.icon,
        color: a.color,
        capabilities: a.capabilities,
        stage: a.stage,
        status,
        lastRunAt: latest ? latest.createdAt.toISOString() : null,
        runCount: arr.length,
        lastOutput: latest ? jparseObj(latest.output) : null,
      };
    });
    return Response.json({ agents });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
