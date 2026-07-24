"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  MessagesSquare,
  Loader2,
  Sparkles,
  Send,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Lightbulb,
  Layers,
  Quote,
  GraduationCap,
  Bot,
  User,
  FolderKanban,
  Radio,
  CornerDownLeft,
} from "lucide-react";
import type { InterviewSessionRecord } from "@/lib/types";

// ── Type meta ────────────────────────────────────────────────────────────
const TYPE_META: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  story: { label: "Story", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/40", icon: BookOpen },
  opinion: { label: "Opinion", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/40", icon: Lightbulb },
  framework: { label: "Framework", color: "text-violet-300", bg: "bg-violet-500/15 border-violet-500/40", icon: Layers },
  example: { label: "Example", color: "text-teal-300", bg: "bg-teal-500/15 border-teal-500/40", icon: Quote },
  expertise: { label: "Expertise", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/40", icon: GraduationCap },
};

function typeMeta(t: string) {
  return TYPE_META[t] ?? TYPE_META.expertise;
}

// ── Project picker ───────────────────────────────────────────────────────
function ProjectPicker() {
  const { openProject } = useApp();
  const projectsQuery = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });
  const projects = projectsQuery.data?.projects ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-4xl space-y-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20">
          <MessagesSquare className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Creator Interview</h1>
          <p className="text-xs text-muted-foreground lg:text-sm">
            Select a project to interview for. Maestro will conduct a conversational interview to extract your
            original expertise, stories, opinions and frameworks — the raw material no search can provide.
          </p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Select a project
        </p>
        {projectsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="h-28 animate-pulse bg-card/40" />
            ))}
          </div>
        ) : projectsQuery.isError ? (
          <Card className="border-rose-500/30 bg-rose-500/5 p-6 text-center text-sm text-rose-300">
            Failed to load projects: {(projectsQuery.error as Error)?.message}
          </Card>
        ) : projects.length === 0 ? (
          <Card className="border-dashed border-border/60 bg-card/30 p-10 text-center">
            <FolderKanban className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium">No projects yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Discover an opportunity or create a project first, then return here to interview.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                onClick={() => openProject(p.id)}
                className="group flex flex-col gap-2 rounded-xl border border-border/60 bg-card/40 p-4 text-left transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-amber-500/20">
                    <FolderKanban className="h-4 w-4 text-emerald-400" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
                </div>
                <p className="line-clamp-2 text-sm font-medium leading-tight">{p.title}</p>
                <p className="truncate text-xs text-muted-foreground">{p.niche}</p>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Topic chip ───────────────────────────────────────────────────────────
function TopicChip({ topic, covered, depth }: { topic: string; covered: boolean; depth: number }) {
  const depthBars = Array.from({ length: 3 });
  let cls: string;
  if (!covered) cls = "border-border/60 bg-muted/40 text-muted-foreground";
  else if (depth >= 2) cls = "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  else cls = "border-amber-500/40 bg-amber-500/10 text-amber-300";
  return (
    <div className={cn("flex items-center gap-1.5 rounded-md border px-2 py-1", cls)}>
      <span className="text-[11px] font-medium">{topic}</span>
      <div className="flex gap-0.5">
        {depthBars.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-0.5 rounded-full",
              !covered ? "bg-muted-foreground/30" : i < depth ? (depth >= 2 ? "bg-emerald-400" : "bg-amber-400") : "bg-muted-foreground/20",
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ── Extracted insight message ────────────────────────────────────────────
function InsightMessage({
  insight,
  animate,
}: {
  insight: { type: string; content: string; themeTag: string };
  animate?: boolean;
}) {
  const meta = typeMeta(insight.type);
  const IconCmp = meta.icon;
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 12, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="flex justify-end"
    >
      <div className="flex max-w-[88%] items-start gap-2.5 sm:max-w-[80%]">
        <div className="flex-1 rounded-2xl rounded-tr-sm border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <Badge variant="outline" className={cn("h-5 gap-1 px-2 text-[10px]", meta.bg, meta.color)}>
              <IconCmp className="h-3 w-3" /> {meta.label}
            </Badge>
            {insight.themeTag && (
              <span className="font-mono text-[10px] text-muted-foreground">#{insight.themeTag}</span>
            )}
          </div>
          <p className="text-xs leading-relaxed text-foreground/90">{insight.content}</p>
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
          <User className="h-3.5 w-3.5 text-emerald-300" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Question message ─────────────────────────────────────────────────────
function QuestionMessage({
  question,
  intent,
  topic,
  isFollowUp,
}: {
  question: string;
  intent: string;
  topic: string;
  isFollowUp: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex justify-start"
    >
      <div className="flex max-w-[88%] items-start gap-2.5 sm:max-w-[80%]">
        <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10">
          <Bot className="h-3.5 w-3.5 text-violet-300" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
        </div>
        <div className="flex-1 rounded-2xl rounded-tl-sm border border-border/60 bg-card/60 p-3">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-violet-300">Maestro asks</span>
            {topic && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal text-muted-foreground">
                {topic}
              </Badge>
            )}
            {isFollowUp && (
              <Badge variant="outline" className="h-5 gap-1 border-amber-500/40 bg-amber-500/10 px-1.5 text-[10px] text-amber-300">
                <CornerDownLeft className="h-2.5 w-2.5" /> Follow-up
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium leading-relaxed text-foreground">{question}</p>
          {intent && (
            <p className="mt-1.5 border-t border-border/40 pt-1.5 text-[11px] italic text-muted-foreground">
              Intent: {intent}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────────
function TypingIndicator({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex justify-start"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10">
          <Bot className="h-3.5 w-3.5 text-violet-300" />
        </div>
        <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-border/60 bg-card/60 px-3 py-2.5">
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "120ms" }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "240ms" }} />
          </div>
          <span className="text-[11px] text-muted-foreground">{text}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main view ────────────────────────────────────────────────────────────
export function InterviewView() {
  const qc = useQueryClient();
  const { activeProjectId } = useApp();
  const [answer, setAnswer] = useState("");
  const [newlyExtractedIds, setNewlyExtractedIds] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const projectQuery = useQuery({
    queryKey: ["project", activeProjectId],
    queryFn: () => (activeProjectId ? api.getProject(activeProjectId) : Promise.reject(new Error("no project"))),
    enabled: !!activeProjectId,
  });

  const interviewQuery = useQuery({
    queryKey: ["interview", activeProjectId],
    queryFn: () => api.getInterview(activeProjectId as string),
    enabled: !!activeProjectId,
    refetchInterval: (query) => (query.state.data?.session?.status === "active" ? 5000 : false),
  });

  const session = interviewQuery.data?.session ?? null;
  const nextQuestion = interviewQuery.data?.nextQuestion ?? null;

  const startMut = useMutation({
    mutationFn: () => api.interviewAction(activeProjectId as string, { action: "start" }),
    onSuccess: (data) => {
      toast.success("Interview started · Maestro is ready");
      qc.setQueryData(["interview", activeProjectId], { session: data.session, nextQuestion: data.nextQuestion ?? null });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to start interview"),
  });

  const answerMut = useMutation({
    mutationFn: (text: string) =>
      api.interviewAction(activeProjectId as string, {
        action: "answer",
        question: nextQuestion?.question ?? "",
        answer: text,
        topic: nextQuestion?.topic,
      }),
    onMutate: () => {
      setNewlyExtractedIds(new Set());
    },
    onSuccess: (data) => {
      const extractedCount = data.extracted?.length ?? 0;
      if (extractedCount > 0 && data.extracted) {
        toast.success(`Maestro extracted ${extractedCount} insight${extractedCount === 1 ? "" : "s"}`);
        // Mark the last N extracted as "newly" for animation
        const totalExtracted = data.session.extracted?.length ?? 0;
        const newIds = new Set<number>();
        for (let i = Math.max(0, totalExtracted - extractedCount); i < totalExtracted; i++) {
          newIds.add(i);
        }
        setNewlyExtractedIds(newIds);
      } else {
        toast.success("Answer recorded");
      }
      setAnswer("");
      qc.setQueryData(["interview", activeProjectId], {
        session: data.session,
        nextQuestion: data.nextQuestion ?? null,
      });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to submit answer"),
  });

  const completeMut = useMutation({
    mutationFn: () => api.interviewAction(activeProjectId as string, { action: "complete" }),
    onSuccess: (data) => {
      toast.success("Interview complete. Voice DNA can now be extracted.");
      qc.setQueryData(["interview", activeProjectId], { session: data.session, nextQuestion: null });
      qc.invalidateQueries({ queryKey: ["project", activeProjectId] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to complete interview"),
  });

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.extracted?.length, nextQuestion?.question, answerMut.isPending]);

  const topicsCovered = session?.topicsCovered ?? [];
  const coveredCount = topicsCovered.filter((t) => t.covered).length;
  const extracted = session?.extracted ?? [];
  const questions = session?.questions ?? [];

  // Build a chronological list of "messages": interleaved Q then insight(s)
  const messages = useMemo(() => {
    type Msg =
      | { kind: "q"; idx: number; question: string; intent: string; topic: string; isFollowUp: boolean }
      | { kind: "i"; idx: number; insight: { type: string; content: string; themeTag: string } };
    const out: Msg[] = [];
    // Each question that was asked becomes a Q message
    const asked = questions.filter((q) => q.asked);
    // We don't have explicit question-answer pairing in the type, so show all asked questions in order,
    // then all extracted insights. To make it feel conversational, interleave: Q then insights tagged to that Q.
    // Since we don't have the pairing, use a simpler order: alternate Q, then its likely insights.
    // Pragmatic: show all asked questions first in order, then all extracted insights as user "answers".
    asked.forEach((q, idx) => {
      out.push({ kind: "q", idx, question: q.question, intent: q.intent, topic: q.topic, isFollowUp: idx > 0 });
    });
    extracted.forEach((insight, idx) => {
      out.push({ kind: "i", idx, insight });
    });
    return out;
  }, [questions, extracted]);

  if (!activeProjectId) {
    return <ProjectPicker />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20">
            <MessagesSquare className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Creator Interview</h1>
              {projectQuery.data?.title && (
                <span className="text-xs text-muted-foreground">· {projectQuery.data.title}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground lg:text-sm">
              Maestro conducts a conversational interview to extract your original expertise, stories, opinions
              and frameworks — the raw material no search can provide.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Session state card */}
      <Card className="border-border/60 bg-card/40 p-4 lg:p-5">
        {!session ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
              <Radio className="h-6 w-6 text-emerald-400" />
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">No interview session yet</p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                Start a session and Maestro will ask tailored questions across your expertise, stories, opinions
                and frameworks.
              </p>
            </div>
            <Button
              onClick={() => startMut.mutate()}
              disabled={startMut.isPending}
              className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
            >
              {startMut.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Start interview
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "h-6 gap-1 px-2 text-[11px]",
                    session.status === "active"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-300",
                  )}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    {session.status === "active" && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    )}
                    <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", session.status === "active" ? "bg-emerald-400" : "bg-amber-400")} />
                  </span>
                  <span className="capitalize">{session.status}</span>
                </Badge>
                <Badge variant="outline" className="h-6 gap-1 px-2 font-mono text-[11px] text-muted-foreground">
                  <MessagesSquare className="h-3 w-3" /> {session.turnCount} turns
                </Badge>
                <Badge variant="outline" className="h-6 gap-1 px-2 font-mono text-[11px] text-muted-foreground">
                  <Sparkles className="h-3 w-3" /> {extracted.length} insights extracted
                </Badge>
              </div>
              {session.status === "active" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => completeMut.mutate()}
                  disabled={completeMut.isPending}
                  className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200"
                >
                  {completeMut.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Complete interview
                </Button>
              )}
            </div>

            {/* Topics covered */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Topics coverage
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {coveredCount}/{topicsCovered.length} covered
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topicsCovered.map((t, i) => (
                  <TopicChip key={i} topic={t.topic} covered={t.covered} depth={t.depth ?? 0} />
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Conversation + answer input */}
      {session && (
        <Card className="overflow-hidden border-border/60 bg-card/40">
          {/* Chat area */}
          <div
            ref={scrollRef}
            className="max-h-[480px] min-h-[300px] space-y-4 overflow-y-auto p-4 scroll-thin lg:p-5"
          >
            {messages.length === 0 && !answerMut.isPending && (
              <div className="flex h-full min-h-[200px] items-center justify-center text-center">
                <div className="space-y-2">
                  <Bot className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Maestro will ask the first question when you&apos;re ready. Type your answer below.
                  </p>
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((m) =>
                m.kind === "q" ? (
                  <QuestionMessage
                    key={`q-${m.idx}`}
                    question={m.question}
                    intent={m.intent}
                    topic={m.topic}
                    isFollowUp={m.isFollowUp}
                  />
                ) : (
                  <InsightMessage
                    key={`i-${m.idx}`}
                    insight={m.insight}
                    animate={newlyExtractedIds.has(m.idx)}
                  />
                ),
              )}
            </AnimatePresence>

            {/* Current question (from nextQuestion, not yet answered) */}
            {nextQuestion && (
              <QuestionMessage
                question={nextQuestion.question}
                intent={nextQuestion.intent}
                topic={nextQuestion.topic}
                isFollowUp={nextQuestion.isFollowUp}
              />
            )}

            {/* Typing indicator during answer submission */}
            <AnimatePresence>
              {answerMut.isPending && <TypingIndicator text="Maestro is extracting insights from your answer…" />}
            </AnimatePresence>
          </div>

          {/* Answer input */}
          <div className="border-t border-border/60 bg-background/40 p-3 lg:p-4">
            <div className="space-y-2">
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={
                  session.status === "completed"
                    ? "This interview is complete. Start a new session to add more."
                    : "Type your answer here — share stories, opinions, frameworks, examples…"
                }
                rows={3}
                disabled={answerMut.isPending || session.status === "completed" || !nextQuestion}
                className="resize-none bg-card/60 text-sm"
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !answerMut.isPending && answer.trim()) {
                    answerMut.mutate(answer);
                  }
                }}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-muted-foreground">
                  {nextQuestion
                    ? "⌘/Ctrl + Enter to submit"
                    : session.status === "completed"
                      ? "Interview complete — voice DNA can now be extracted."
                      : "Maestro will generate the next question after your answer."}
                </p>
                <div className="flex items-center gap-2">
                  {nextQuestion && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAnswer("");
                        answerMut.mutate("[skipped]");
                      }}
                      disabled={answerMut.isPending}
                      className="text-muted-foreground hover:bg-muted/40"
                    >
                      Skip question
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => answerMut.mutate(answer)}
                    disabled={
                      answerMut.isPending ||
                      !nextQuestion ||
                      session.status === "completed" ||
                      !answer.trim()
                    }
                    className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                  >
                    {answerMut.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Submitting…
                      </>
                    ) : (
                      <>
                        <Send className="mr-1.5 h-3.5 w-3.5" /> Submit answer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
