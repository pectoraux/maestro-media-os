import { db } from "@/lib/db";
import { jstr } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const where = projectId ? { projectId } : {};
    const interviews = await db.creatorInterview.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
    return Response.json({
      interviews: interviews.map((i) => ({
        id: i.id,
        projectId: i.projectId,
        question: i.question,
        answer: i.answer,
        themeTag: i.themeTag,
        createdAt: i.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const projectId = body.projectId as string;
    const question = body.question as string;
    const answer = (body.answer as string) ?? "";
    const themeTag = (body.themeTag as string) || null;
    if (!projectId || !question) {
      return Response.json({ error: "projectId + question required" }, { status: 400 });
    }
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    const interview = await db.creatorInterview.create({
      data: { projectId, question, answer, themeTag },
    });
    await db.activityLog.create({
      data: {
        projectId,
        type: "creator",
        message: `Interview ${answer ? "answered" : "added"}: ${question.slice(0, 80)}`,
        meta: jstr({ interviewId: interview.id, themeTag }),
      },
    });
    return Response.json({
      interview: {
        id: interview.id,
        projectId,
        question,
        answer,
        themeTag,
        createdAt: interview.createdAt.toISOString(),
      },
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
