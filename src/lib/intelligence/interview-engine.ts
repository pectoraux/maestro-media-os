// Conversational Creator Interview Engine
// Maintains session state, asks follow-up questions based on answers,
// and extracts: stories, opinions, frameworks, examples, unique expertise.

import { db } from "@/lib/db";
import { jstr, jparseArr, jparseObj } from "@/lib/json";
import { llmJson } from "@/lib/zai";
import type { InterviewSessionRecord } from "@/lib/types";

const TOPIC_TAXONOMY = [
  "core_insight",
  "war_story",
  "contrarian_opinion",
  "framework",
  "concrete_example",
  "audience_question",
  "personal_philosophy",
  "failure_lesson",
] as const;

// Initialize a new interview session for a project
export async function startInterviewSession(projectId: string): Promise<InterviewSessionRecord> {
  // Load project context
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { opportunity: true, dossier: true },
  });
  if (!project) throw new Error("Project not found");

  const niche = project.niche;
  const angle = project.opportunity?.angle ?? project.brief ?? "";
  const dossierSummary = project.dossier?.summary ?? "";

  // Generate the initial question set targeting original expertise
  const { data } = await llmJson<{ questions: { question: string; intent: string; topic: string }[] }>(
    `You are Maestro, the Chief Creative Director conducting a creator interview. Generate 6-8 questions that extract ORIGINAL expertise, opinions, stories and examples that the creator could NOT find via search.

Project context:
- Niche: ${niche}
- Angle: ${angle}
- Research dossier summary: ${dossierSummary.slice(0, 800)}

Target these topic types (cover at least 5):
${TOPIC_TAXONOMY.join(", ")}

Each question should pull something only the creator knows: a war story, a contrarian opinion, a personal framework, a concrete example, a failure lesson.

Return STRICT JSON:
{
  "questions": [
    { "question": "<the question>", "intent": "<what we're extracting>", "topic": "<one of the topic types>" }
  ]
}`,
    {
      system:
        "You are an expert interviewer who extracts original expertise, not generic answers. Ask specific, slightly uncomfortable questions that surface stories and opinions. Return strict JSON.",
    },
  );

  const questions = (data?.questions ?? []).map((q, i) => ({
    id: `q${i + 1}`,
    question: q.question,
    intent: q.intent,
    topic: q.topic,
    asked: false,
  }));

  // Upsert session (one per project)
  const existing = await db.interviewSession.findUnique({ where: { projectId } });
  if (existing) {
    const updated = await db.interviewSession.update({
      where: { projectId },
      data: {
        status: "active",
        questions: jstr(questions),
        topicsCovered: jstr(TOPIC_TAXONOMY.map((t) => ({ topic: t, covered: false, depth: 0 }))),
        extracted: jstr([]),
        turnCount: 0,
      },
    });
    return decode(updated);
  }

  const created = await db.interviewSession.create({
    data: {
      projectId,
      status: "active",
      questions: jstr(questions),
      topicsCovered: jstr(TOPIC_TAXONOMY.map((t) => ({ topic: t, covered: false, depth: 0 }))),
      extracted: jstr([]),
      turnCount: 0,
    },
  });
  return decode(created);
}

// Get the next question to ask (the first un-asked one, or a follow-up)
export async function getNextQuestion(projectId: string): Promise<{
  question: string;
  intent: string;
  topic: string;
  isFollowUp: boolean;
  sessionId: string;
} | null> {
  const session = await db.interviewSession.findUnique({ where: { projectId } });
  if (!session) return null;
  const questions = jparseArr<{ id: string; question: string; intent: string; topic: string; asked: boolean }>(session.questions);
  const extracted = jparseArr<any>(session.extracted);

  // If the last answer was given, generate a follow-up to go deeper
  if (extracted.length > 0 && session.turnCount > 0) {
    const lastExt = extracted[extracted.length - 1];
    const askedQs = questions.filter((q) => q.asked).slice(-2);
    const followUp = await generateFollowUp(lastExt, askedQs, session);
    if (followUp) {
      return {
        question: followUp.question,
        intent: followUp.intent,
        topic: lastExt.themeTag || "follow_up",
        isFollowUp: true,
        sessionId: session.id,
      };
    }
  }

  // Otherwise, return the next un-asked question
  const next = questions.find((q) => !q.asked);
  if (!next) return null;
  return {
    question: next.question,
    intent: next.intent,
    topic: next.topic,
    isFollowUp: false,
    sessionId: session.id,
  };
}

// Generate a context-aware follow-up question
async function generateFollowUp(
  lastExtracted: { type: string; content: string; themeTag: string },
  recentQuestions: { question: string }[],
  session: { id: string },
): Promise<{ question: string; intent: string } | null> {
  const { data } = await llmJson<{ question: string; intent: string }>(
    `You are Maestro, conducting a creator interview. The creator just answered:

"${(lastExtracted.content ?? "").slice(0, 800)}"

We extracted this as a ${lastExtracted.type} (theme: ${lastExtracted.themeTag}).

Recent questions asked:
${recentQuestions.map((q) => `- ${q.question}`).join("\n")}

Generate ONE follow-up question that goes DEEPER — surface a specific story, example, or nuance that the previous answer hinted at but didn't fully reveal. Do NOT repeat previous questions.

Return JSON: { "question": "...", "intent": "what deeper insight we're after" }`,
    { system: "You are an expert conversational interviewer. Go deeper, don't repeat. Return strict JSON." },
  );
  return data ?? null;
}

// Record an answer: extract insights, update session state, store the interview
export async function recordAnswer(
  projectId: string,
  question: string,
  answer: string,
  topic?: string,
): Promise<{
  extracted: { type: string; content: string; themeTag: string }[];
  session: InterviewSessionRecord;
}> {
  const session = await db.interviewSession.findUnique({ where: { projectId } });
  if (!session) throw new Error("No active interview session. Start one first.");

  // Extract insights from the answer via LLM
  const { data } = await llmJson<{ extractions: { type: string; content: string; themeTag: string }[] }>(
    `You are Maestro, extracting original expertise from a creator's interview answer.

Question: ${question}
Answer: "${answer.slice(0, 2000)}"

Extract every distinct piece of ORIGINAL expertise. Categorize each as one of: story, opinion, framework, example, expertise.
For each, write a concise content summary (1-3 sentences) that captures the specific, reusable insight.

Return STRICT JSON:
{
  "extractions": [
    { "type": "story|opinion|framework|example|expertise", "content": "<the extracted insight>", "themeTag": "<short tag like 'fintech_war_story' or 'contrarian_on_vector_dbs'>" }
  ]
}`,
    {
      system:
        "You extract specific, reusable expertise from creator answers. Avoid generic summaries — capture the unique angle. Return strict JSON.",
    },
  );

  const newExtractions = data?.extractions ?? [];

  // Store as a CreatorInterview row (for the existing pipeline + script writer)
  await db.creatorInterview.create({
    data: {
      projectId,
      question,
      answer,
      themeTag: topic ?? null,
    },
  });

  // Update session state
  const questions = jparseArr<{ id: string; question: string; intent: string; topic: string; asked: boolean }>(session.questions);
  // Mark the matching question as asked
  let matched = false;
  for (const q of questions) {
    if (!q.asked && (q.question === question || question.includes(q.question.slice(0, 40)))) {
      q.asked = true;
      matched = true;
      break;
    }
  }
  // If it was a follow-up (not in the original list), still mark topic coverage
  const topicsCovered = jparseArr<{ topic: string; covered: boolean; depth: number }>(session.topicsCovered);
  if (topic) {
    const t = topicsCovered.find((tc) => tc.topic === topic);
    if (t) {
      t.covered = true;
      t.depth = Math.min(1, t.depth + 0.3);
    } else {
      topicsCovered.push({ topic, covered: true, depth: 0.3 });
    }
  }

  const existingExtracted = jparseArr<any>(session.extracted);
  const updatedExtracted = [...existingExtracted, ...newExtractions];

  const updated = await db.interviewSession.update({
    where: { projectId },
    data: {
      questions: jstr(questions),
      topicsCovered: jstr(topicsCovered),
      extracted: jstr(updatedExtracted),
      turnCount: session.turnCount + 1,
      updatedAt: new Date(),
    },
  });

  return { extracted: newExtractions, session: decode(updated) };
}

// Complete the session
export async function completeSession(projectId: string): Promise<InterviewSessionRecord> {
  const updated = await db.interviewSession.update({
    where: { projectId },
    data: { status: "completed", updatedAt: new Date() },
  });
  return decode(updated);
}

// Get session state
export async function getSession(projectId: string): Promise<InterviewSessionRecord | null> {
  const session = await db.interviewSession.findUnique({ where: { projectId } });
  if (!session) return null;
  return decode(session);
}

function decode(s: any): InterviewSessionRecord {
  return {
    id: s.id,
    projectId: s.projectId,
    status: s.status,
    topicsCovered: jparseArr(s.topicsCovered),
    questions: jparseArr(s.questions),
    extracted: jparseArr(s.extracted),
    turnCount: s.turnCount,
    startedAt: s.startedAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}
