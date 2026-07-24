// /api/interview/[projectId]
// GET  → returns the session state + the next question.
// POST { action: "start" | "answer" | "complete", question?, answer?, topic? }

import {
  getSession,
  getNextQuestion,
  startInterviewSession,
  recordAnswer,
  completeSession,
} from "@/lib/intelligence/interview-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const session = await getSession(projectId);
    const nextQuestion = await getNextQuestion(projectId);
    return Response.json({ session, nextQuestion });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action as "start" | "answer" | "complete";

    if (action === "start") {
      const session = await startInterviewSession(projectId);
      return Response.json({ session });
    }

    if (action === "answer") {
      const question = body.question as string;
      const answer = body.answer as string;
      const topic = body.topic as string | undefined;
      if (!question || !answer) {
        return Response.json({ error: "question + answer required for action=answer" }, { status: 400 });
      }
      const { extracted, session } = await recordAnswer(projectId, question, answer, topic);
      const nextQuestion = await getNextQuestion(projectId);
      return Response.json({ extracted, session, nextQuestion });
    }

    if (action === "complete") {
      const session = await completeSession(projectId);
      return Response.json({ session });
    }

    return Response.json({ error: `Unknown action "${action}" — must be start|answer|complete` }, { status: 400 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
