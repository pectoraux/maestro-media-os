import { db } from "@/lib/db";
import { jparseObj } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const where = projectId ? { projectId } : {};
    const logs = await db.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { project: { select: { title: true } } },
    });
    return Response.json({
      activities: logs.map((l) => ({
        id: l.id,
        projectId: l.projectId,
        projectTitle: l.project?.title ?? null,
        type: l.type,
        message: l.message,
        meta: jparseObj(l.meta),
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
