"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ProjectDetail } from "@/lib/api";
import { useApp } from "@/lib/store";
import { AGENT_MAP, PIPELINE, STAGE_INDEX } from "@/lib/agents-registry";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StatusBadge } from "@/components/status-badge";
import { Icon } from "@/components/icon";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  Check,
  X,
  PenLine,
  Sparkles,
  Lock,
  Clock,
  Play,
  ChevronRight,
  Plus,
  Quote,
  FileText,
  Zap,
  Image as ImageIcon,
  Send,
  BarChart3,
  FolderKanban,
  ListVideo,
  Hash,
  MessageSquare,
  Calendar,
  LayoutDashboard,
  Activity as ActivityIcon,
  Bot,
} from "lucide-react";
import type {
  ApprovalGateRecord,
  DossierRecord,
  TrifectaRecord,
  BlueprintRecord,
  ScriptRecord,
  OpportunityRecord,
  PublishMetadataRecord,
  PerformanceRecord,
  AssetRecord,
} from "@/lib/types";

// ── helpers ──────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function formatViews(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return Math.round(v / 1_000) + "K";
  return String(v);
}

function formatMoney(v: number): string {
  if (v >= 1000) return "$" + (v / 1000).toFixed(1) + "K";
  return "$" + Math.round(v).toLocaleString();
}

function formatDuration(ms: number): string {
  return (Math.round(ms / 100) / 10).toFixed(1) + "s";
}

function metricColor(v: number): string {
  if (v >= 80) return "text-emerald-400";
  if (v >= 65) return "text-amber-400";
  return "text-rose-400";
}

// ── Stage stepper ────────────────────────────────────────────────────────
function StageStepper({ currentStage }: { currentStage: string }) {
  const currentIdx = STAGE_INDEX[currentStage] ?? 0;
  return (
    <div className="flex flex-wrap items-start gap-x-1 gap-y-3 rounded-xl border border-border/60 bg-card/30 p-3">
      {PIPELINE.map((stage, idx) => {
        const isPast = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFuture = idx > currentIdx;
        return (
          <div key={stage.key} className="flex items-start">
            <div className="flex w-14 flex-col items-center text-center sm:w-16">
              <div
                className={cn(
                  "relative flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-mono font-semibold transition-all",
                  isPast && "border-emerald-500/40 bg-emerald-500/20 text-emerald-300",
                  isCurrent && "border-emerald-400 bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/30",
                  isFuture && "border-border/60 bg-background/40 text-muted-foreground",
                  isCurrent && "animate-pulse-dot",
                )}
              >
                {idx + 1}
                {stage.requiresApproval && (
                  <Lock className="absolute -right-1 -top-1 h-2.5 w-2.5 text-amber-400" />
                )}
              </div>
              <span
                className={cn(
                  "mt-1.5 block text-[9px] leading-tight sm:text-[10px]",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {stage.label}
              </span>
            </div>
            {idx < PIPELINE.length - 1 && (
              <div
                className={cn(
                  "mt-3.5 h-px w-3 sm:w-5",
                  isPast ? "bg-emerald-500/40" : "bg-border/50",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Approval card ────────────────────────────────────────────────────────
function ApprovalCard({ gate, projectId }: { gate: ApprovalGateRecord; projectId: string }) {
  const qc = useQueryClient();
  const [showRevision, setShowRevision] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [pending, setPending] = useState<"approve" | "revise" | "reject" | null>(null);
  const agent = AGENT_MAP[gate.agentType];

  const decide = useMutation({
    mutationFn: (vars: { decision: "approved" | "rejected" | "revised"; feedback?: string }) =>
      api.decideApproval(gate.id, vars.decision, vars.feedback),
    onMutate: (vars) => {
      setPending(vars.decision === "approved" ? "approve" : vars.decision === "rejected" ? "reject" : "revise");
    },
    onSuccess: (_data, vars) => {
      const msg =
        vars.decision === "approved"
          ? "Approved · advancing pipeline"
          : vars.decision === "rejected"
            ? "Gate rejected"
            : "Revision requested";
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["approvals"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setShowRevision(false);
      setFeedback("");
      setPending(null);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Decision failed");
      setPending(null);
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-amber-500/40 bg-amber-500/[0.06]">
        <div className="border-b border-amber-500/20 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {agent && <Icon name={agent.icon} className={cn("h-4 w-4", agent.color)} />}
            <span className="text-xs font-medium text-foreground">{agent?.name ?? gate.agentType}</span>
            <span className="text-xs text-muted-foreground">· {agent?.role}</span>
            <Badge variant="outline" className="ml-auto border-amber-500/40 bg-amber-500/10 text-[10px] capitalize text-amber-300">
              <Lock className="mr-1 h-2.5 w-2.5" /> Approval · {gate.stage}
            </Badge>
            <StatusBadge status={gate.status} />
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <h3 className="text-base font-semibold leading-tight">{gate.payload.title}</h3>
            {gate.payload.summary && (
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{gate.payload.summary}</p>
            )}
          </div>

          {gate.payload.highlights?.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Highlights
              </p>
              <ul className="space-y-1">
                {gate.payload.highlights.map((h, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed text-foreground/90">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {gate.payload.artifacts && gate.payload.artifacts.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Artifacts
              </p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {gate.payload.artifacts.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/50 bg-background/40 px-2.5 py-1.5 text-xs"
                  >
                    <span className="text-muted-foreground">{a.label}</span>
                    <span className="truncate font-mono text-foreground/90">{a.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showRevision && (
            <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Revision feedback
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell the agent what to revise…"
                rows={3}
                className="bg-background/60"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowRevision(false)} disabled={!!pending}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => decide.mutate({ decision: "revised", feedback })}
                  disabled={!!pending}
                  className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                >
                  {pending === "revise" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  Send feedback
                </Button>
              </div>
            </div>
          )}

          {!showRevision && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => decide.mutate({ decision: "approved" })}
                disabled={!!pending}
                className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              >
                {pending === "approve" ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                )}
                Approve &amp; advance
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRevision(true)}
                disabled={!!pending}
                className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
              >
                <PenLine className="mr-1.5 h-3.5 w-3.5" /> Request revision
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => decide.mutate({ decision: "rejected" })}
                disabled={!!pending}
                className="text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
              >
                {pending === "reject" ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="mr-1.5 h-3.5 w-3.5" />
                )}
                Reject
              </Button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ── Artifact: Opportunity panel ──────────────────────────────────────────
function OpportunityPanel({ op }: { op: OpportunityRecord }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/15">
          <span className={cn("font-mono text-lg font-semibold", metricColor(op.opportunityScore))}>
            {Math.round(op.opportunityScore)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{op.title}</p>
          <p className="text-xs text-muted-foreground">{op.niche} · {op.angle}</p>
        </div>
        <StatusBadge status={op.confidence} />
      </div>
      {op.sources?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {op.sources.slice(0, 6).map((s, i) => (
            <Badge key={i} variant="outline" className="gap-1 border-border/60 bg-background/40 text-[10px] font-normal">
              <span className="text-foreground/80">{s.name}</span>
              <span className="text-muted-foreground">· {s.type}</span>
            </Badge>
          ))}
        </div>
      )}
      {op.trends?.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-border/50">
          <table className="w-full min-w-[280px] text-[11px]">
            <thead className="bg-muted/30 text-[9px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-2 py-1 text-left">Source</th>
                <th className="px-2 py-1 text-left">Signal</th>
                <th className="px-2 py-1 text-left">Momentum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {op.trends.map((t, i) => (
                <tr key={i}>
                  <td className="px-2 py-1">{t.source}</td>
                  <td className="px-2 py-1 text-muted-foreground">{t.signal}</td>
                  <td className="px-2 py-1 capitalize text-amber-300/80">{t.momentum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Artifact: Dossier panel ──────────────────────────────────────────────
function DossierPanel({ d }: { d: DossierRecord }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">{d.summary}</p>

      {d.marketData?.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Market data</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {d.marketData.map((m, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-border/50 bg-background/40 px-2.5 py-1.5 text-xs">
                <span className="text-muted-foreground">{m.label}</span>
                <span className="font-mono text-foreground/90">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.competitors?.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Competitors</p>
          <div className="space-y-2">
            {d.competitors.slice(0, 4).map((c, i) => (
              <div key={i} className="rounded-md border border-border/50 bg-background/40 p-2.5 text-xs">
                <p className="font-medium">{c.channel}</p>
                <p className="text-muted-foreground">{c.positioning}</p>
                <p className="mt-0.5 text-amber-300/80">Weakness: {c.weakness}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.audienceInsights?.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Audience insights</p>
          <ul className="space-y-1">
            {d.audienceInsights.slice(0, 4).map((a, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-foreground/80">
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {d.news?.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">News</p>
          <ul className="space-y-1.5">
            {d.news.slice(0, 4).map((n, i) => (
              <li key={i} className="rounded-md border border-border/50 bg-background/40 p-2 text-xs">
                <p className="font-medium">{n.title}</p>
                <p className="text-muted-foreground">{n.source} · {n.date} · {n.relevance}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {d.knowledgeGaps?.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Knowledge gaps</p>
          <ul className="space-y-1">
            {d.knowledgeGaps.slice(0, 4).map((g, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-amber-300/90">
                <span className="text-muted-foreground">·</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {d.references?.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">References</p>
          <ul className="space-y-1">
            {d.references.slice(0, 4).map((r, i) => (
              <li key={i} className="text-xs">
                <span className="font-medium text-foreground/90">{r.title}</span>
                <span className="text-muted-foreground"> — {r.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Artifact: Interview panel ────────────────────────────────────────────
function InterviewPanel({ project }: { project: ProjectDetail }) {
  const qc = useQueryClient();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [selectedQid, setSelectedQid] = useState<string>("");
  const [themeTag, setThemeTag] = useState("");

  const pending = project.interviews.filter((i) => !i.answer);
  const answered = project.interviews.filter((i) => i.answer);

  const submitMut = useMutation({
    mutationFn: () => {
      // If a pending question is selected, use its text but submit as a new entry (api takes question + answer)
      const q = selectedQid
        ? project.interviews.find((i) => i.id === selectedQid)?.question ?? ""
        : question.trim();
      return api.submitInterview({
        projectId: project.id,
        question: q,
        answer: answer.trim(),
        themeTag: themeTag.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Interview answer recorded");
      qc.invalidateQueries({ queryKey: ["project", project.id] });
      setQuestion("");
      setAnswer("");
      setSelectedQid("");
      setThemeTag("");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to submit"),
  });

  const genQMut = useMutation({
    mutationFn: () =>
      api.runAgent({ agentType: "chief_director", projectId: project.id, input: { action: "interview_questions" } }),
    onSuccess: () => {
      toast.success("Maestro generated new interview questions");
      qc.invalidateQueries({ queryKey: ["project", project.id] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to generate questions"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {answered.length} answered · {pending.length} pending
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => genQMut.mutate()}
          disabled={genQMut.isPending}
          className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
        >
          {genQMut.isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          )}
          Generate interview questions
        </Button>
      </div>

      {/* Pending questions */}
      {pending.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Pending questions
          </p>
          <ul className="space-y-1.5">
            {pending.map((q) => (
              <li key={q.id} className="rounded-md border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs">
                <p className="font-medium text-amber-100/90">{q.question}</p>
                {q.themeTag && (
                  <Badge variant="outline" className="mt-1 border-amber-500/30 text-[9px] text-amber-300">
                    {q.themeTag}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Q&A list */}
      {answered.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Answers</p>
          {answered.map((qa) => (
            <div key={qa.id} className="rounded-md border border-border/50 bg-background/40 p-3 text-xs">
              <p className="font-medium text-emerald-300">{qa.question}</p>
              <p className="mt-1.5 whitespace-pre-wrap text-foreground/85">{qa.answer}</p>
              {qa.themeTag && (
                <Badge variant="outline" className="mt-2 border-border/60 text-[9px] text-muted-foreground">
                  {qa.themeTag}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add answer form */}
      <div className="space-y-2 rounded-lg border border-border/60 bg-card/30 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Add an interview answer
        </p>
        {pending.length > 0 && (
          <Select value={selectedQid} onValueChange={setSelectedQid}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Answer a pending question (or write your own below)" />
            </SelectTrigger>
            <SelectContent>
              {pending.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.question.slice(0, 80)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {!selectedQid && (
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Or write a new question…"
            className="h-9"
          />
        )}
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer — opinions, expertise, stories, hot takes…"
          rows={3}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={themeTag}
            onChange={(e) => setThemeTag(e.target.value)}
            placeholder="theme tag (optional)"
            className="h-9 flex-1"
          />
          <Button
            size="sm"
            onClick={() => submitMut.mutate()}
            disabled={submitMut.isPending || (!answer.trim()) || (!selectedQid && !question.trim())}
            className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
          >
            {submitMut.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="mr-1.5 h-3.5 w-3.5" />
            )}
            Submit answer
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Artifact: Scripts panel ──────────────────────────────────────────────
function ScriptsPanel({ scripts }: { scripts: ScriptRecord[] }) {
  const order = ["outline", "expanded_outline", "draft", "final"];
  const sorted = [...scripts].sort((a, b) => order.indexOf(a.stage) - order.indexOf(b.stage) || b.version - a.version);
  if (sorted.length === 0) return <p className="text-xs text-muted-foreground">No scripts produced yet.</p>;
  return (
    <Accordion type="single" collapsible defaultValue={sorted[sorted.length - 1].id}>
      {sorted.map((s, idx) => {
        const isLatest = idx === sorted.length - 1;
        return (
          <AccordionItem key={s.id} value={s.id}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 pr-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize",
                    isLatest
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-border/60 text-muted-foreground",
                  )}
                >
                  {s.stage.replace("_", " ")}
                </Badge>
                <span className="text-[10px] text-muted-foreground">v{s.version}</span>
                {isLatest && (
                  <Badge variant="outline" className="border-emerald-500/30 text-[9px] text-emerald-300">
                    latest
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {s.notes && <p className="mb-2 text-xs italic text-muted-foreground">{s.notes}</p>}
              <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md border border-border/50 bg-background/60 p-3 font-mono text-[11px] leading-relaxed scroll-thin">
                {s.content}
              </pre>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

// ── Artifact: Holy Trifecta panel ────────────────────────────────────────
function TrifectaPanel({ t }: { t: TrifectaRecord }) {
  const thumb = t.thumbnailStrategy;
  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card/40 to-amber-500/10 p-5">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5">
            <Zap className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-300">Holy Trifecta</span>
          </div>
          <h3 className="text-xl font-semibold leading-tight">{t.title}</h3>
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <Quote className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-sm italic text-amber-100/90">"{t.openingHook}"</p>
          </div>
        </div>
      </div>

      {/* Thumbnail strategy */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <ImageIcon className="h-3 w-3" /> Thumbnail strategy
        </p>
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Concept", value: thumb?.concept },
            { label: "Text overlay", value: thumb?.textOverlay },
            { label: "Focal subject", value: thumb?.focalSubject },
            { label: "Color mood", value: thumb?.colorMood },
            { label: "Emotion", value: thumb?.emotion },
          ].map((row) => (
            <div key={row.label} className="rounded-md border border-border/50 bg-background/40 p-2 text-xs">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{row.label}</p>
              <p className="mt-0.5 text-foreground/90">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      {t.rationale && (
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Rationale</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{t.rationale}</p>
        </div>
      )}

      {t.expectationMatch && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Expectation match</p>
          <p className="mt-0.5 text-emerald-100/90">{t.expectationMatch}</p>
        </div>
      )}

      {t.variants?.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Variants</p>
          <div className="flex flex-wrap gap-1.5">
            {t.variants.map((v, i) => (
              <Badge key={i} variant="outline" className="border-border/60 bg-background/40 text-[10px] font-normal">
                {v.title}
                {v.hook && <span className="ml-1 text-muted-foreground">· {v.hook.slice(0, 40)}</span>}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Artifact: Blueprint panel ────────────────────────────────────────────
function BlueprintPanel({ b }: { b: BlueprintRecord }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{b.segments.length} segments</p>
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
          <Clock className="mr-1 h-2.5 w-2.5" /> {b.totalDuration}
        </Badge>
      </div>
      <div className="overflow-x-auto rounded-md border border-border/50">
        <table className="w-full min-w-[760px] text-[11px]">
          <thead className="bg-muted/30 text-[9px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5 text-left">Timecode</th>
              <th className="px-2 py-1.5 text-left">Section</th>
              <th className="px-2 py-1.5 text-left">B-roll</th>
              <th className="px-2 py-1.5 text-left">Graphics</th>
              <th className="px-2 py-1.5 text-left">Captions</th>
              <th className="px-2 py-1.5 text-left">Transitions</th>
              <th className="px-2 py-1.5 text-left">Retention</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {b.segments.map((s, i) => (
              <tr key={i} className="align-top">
                <td className="whitespace-nowrap px-2 py-1.5 font-mono text-emerald-300">{s.timecode}</td>
                <td className="px-2 py-1.5 font-medium">{s.section}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{s.broll}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{s.graphics}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{s.captions}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{s.transitions}</td>
                <td className="px-2 py-1.5">
                  <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-200/90">{s.retentionNotes}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Artifact: Assets panel ───────────────────────────────────────────────
function AssetsPanel({ assets }: { assets: AssetRecord[] }) {
  if (assets.length === 0) return <p className="text-xs text-muted-foreground">No assets generated yet.</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {assets.map((a) => (
        <div key={a.id} className="rounded-md border border-border/50 bg-background/40 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-muted/40">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="flex-1 truncate text-xs font-medium">{a.title}</p>
            <StatusBadge status={a.status} />
          </div>
          <Badge variant="outline" className="mt-2 border-border/60 text-[9px] capitalize text-muted-foreground">
            {a.type.replace("_", " ")}
          </Badge>
          {a.prompt && <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{a.prompt}</p>}
        </div>
      ))}
    </div>
  );
}

// ── Artifact: Publish metadata panel ─────────────────────────────────────
function PublishMetadataPanel({ m }: { m: PublishMetadataRecord }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <FileText className="h-3 w-3" /> Description
        </p>
        <pre className="whitespace-pre-wrap rounded-md border border-border/50 bg-background/40 p-2.5 font-mono text-[11px] leading-relaxed">
          {m.description}
        </pre>
      </div>

      {m.chapters?.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <ListVideo className="h-3 w-3" /> Chapters
          </p>
          <ul className="space-y-0.5 text-xs">
            {m.chapters.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="font-mono text-emerald-300">{c.timecode}</span>
                <span className="text-foreground/85">{c.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {m.tags?.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Hash className="h-3 w-3" /> Tags
          </p>
          <div className="flex flex-wrap gap-1">
            {m.tags.map((t, i) => (
              <Badge key={i} variant="outline" className="border-border/60 bg-background/40 text-[10px] font-normal">
                #{t}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {m.pinnedComment && (
        <div>
          <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <MessageSquare className="h-3 w-3" /> Pinned comment
          </p>
          <p className="rounded-md border border-border/50 bg-background/40 p-2.5 text-xs italic text-foreground/85">
            "{m.pinnedComment}"
          </p>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {m.playlist && (
          <div className="rounded-md border border-border/50 bg-background/40 p-2 text-xs">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Playlist</p>
            <p className="mt-0.5 text-foreground/90">{m.playlist}</p>
          </div>
        )}
        {m.publishAt && (
          <div className="rounded-md border border-border/50 bg-background/40 p-2 text-xs">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
              <Calendar className="mr-1 inline h-2.5 w-2.5" /> Publish at
            </p>
            <p className="mt-0.5 font-mono text-violet-300">{new Date(m.publishAt).toLocaleString()}</p>
          </div>
        )}
      </div>

      {m.endScreen && m.endScreen.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">End screen</p>
          <ul className="space-y-0.5 text-xs">
            {m.endScreen.map((e, i) => (
              <li key={i} className="flex items-center gap-2">
                <Badge variant="outline" className="border-violet-500/30 text-[9px] capitalize text-violet-300">
                  {e.type}
                </Badge>
                <span className="text-foreground/85">{e.target}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Artifact: Performance panel ──────────────────────────────────────────
function PerformancePanel({ p }: { p: PerformanceRecord }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-md border border-border/50 bg-background/40 p-3">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">CTR</p>
          <p className={cn("mt-1 font-mono text-xl font-semibold", metricColor(p.ctr * 10))}>{p.ctr.toFixed(1)}%</p>
        </div>
        <div className="rounded-md border border-border/50 bg-background/40 p-3">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Retention</p>
          <p className={cn("mt-1 font-mono text-xl font-semibold", metricColor(p.retention))}>{p.retention.toFixed(1)}%</p>
        </div>
        <div className="rounded-md border border-border/50 bg-background/40 p-3">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Views</p>
          <p className="mt-1 font-mono text-xl font-semibold text-emerald-300">{formatViews(p.views)}</p>
        </div>
        <div className="rounded-md border border-border/50 bg-background/40 p-3">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Revenue</p>
          <p className="mt-1 font-mono text-xl font-semibold text-amber-300">{formatMoney(p.revenue)}</p>
        </div>
      </div>

      {p.trafficSources?.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Traffic sources</p>
          <div className="space-y-1.5">
            {p.trafficSources.map((s, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground/80">{s.source}</span>
                  <span className="font-mono text-muted-foreground">{s.share.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.max(2, Math.min(100, s.share))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {p.lessons?.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Lessons</p>
          <ul className="space-y-1">
            {p.lessons.map((l, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-foreground/85">
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Artifacts accordion ──────────────────────────────────────────────────
function ArtifactsAccordion({ project }: { project: ProjectDetail }) {
  const items: { value: string; label: string; icon: React.ComponentType<{ className?: string }>; present: boolean; node: React.ReactNode }[] = [
    {
      value: "opportunity",
      label: "Opportunity",
      icon: Sparkles,
      present: !!project.opportunity,
      node: project.opportunity ? <OpportunityPanel op={project.opportunity} /> : null,
    },
    {
      value: "dossier",
      label: "Research dossier",
      icon: FileText,
      present: !!project.dossier,
      node: project.dossier ? <DossierPanel d={project.dossier} /> : null,
    },
    {
      value: "interview",
      label: "Creator interview",
      icon: MessageSquare,
      present: project.interviews.length > 0,
      node: <InterviewPanel project={project} />,
    },
    {
      value: "scripts",
      label: "Scripts",
      icon: PenLine,
      present: project.scripts.length > 0,
      node: <ScriptsPanel scripts={project.scripts} />,
    },
    {
      value: "trifecta",
      label: "Holy Trifecta",
      icon: Zap,
      present: !!project.trifecta,
      node: project.trifecta ? <TrifectaPanel t={project.trifecta} /> : null,
    },
    {
      value: "blueprint",
      label: "Editor blueprint",
      icon: LayoutDashboard,
      present: !!project.blueprint,
      node: project.blueprint ? <BlueprintPanel b={project.blueprint} /> : null,
    },
    {
      value: "assets",
      label: "Assets",
      icon: ImageIcon,
      present: project.assets.length > 0,
      node: <AssetsPanel assets={project.assets} />,
    },
    {
      value: "metadata",
      label: "Upload metadata",
      icon: Send,
      present: !!project.publishMetadata,
      node: project.publishMetadata ? <PublishMetadataPanel m={project.publishMetadata} /> : null,
    },
    {
      value: "performance",
      label: "Performance",
      icon: BarChart3,
      present: !!project.metrics && project.metrics.length > 0,
      node: project.metrics && project.metrics.length > 0 ? <PerformancePanel p={project.metrics[0]} /> : null,
    },
  ];

  const presentItems = items.filter((i) => i.present);
  if (presentItems.length === 0) {
    return (
      <Card className="border-dashed border-border/60 bg-card/30 p-6 text-center text-xs text-muted-foreground">
        No artifacts produced yet — advance the pipeline to generate them.
      </Card>
    );
  }

  return (
    <Accordion type="multiple" defaultValue={[presentItems[presentItems.length - 1].value]}>
      {presentItems.map((it) => (
        <AccordionItem key={it.value} value={it.value}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 pr-2">
              <it.icon className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-sm font-medium">{it.label}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>{it.node}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

// ── Activity feed ────────────────────────────────────────────────────────
function ActivityFeed({ activities }: { activities: ProjectDetail["activities"] }) {
  if (activities.length === 0) return <p className="text-xs text-muted-foreground">No activity yet.</p>;
  const sorted = [...activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="max-h-96 space-y-1.5 overflow-y-auto pr-1 scroll-thin">
      {sorted.map((a) => {
        const icon =
          a.type === "agent" ? Bot : a.type === "approval" ? Check : a.type === "creator" ? MessageSquare : ActivityIcon;
        const IconCmp = icon;
        return (
          <div key={a.id} className="flex gap-2 rounded-md border border-border/40 bg-background/30 p-2 text-xs">
            <IconCmp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <div className="min-w-0 flex-1">
              <p className="leading-snug text-foreground/85">{a.message}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Recent agent runs ────────────────────────────────────────────────────
function RecentRuns({ runs }: { runs: ProjectDetail["agentRuns"] }) {
  if (runs.length === 0) return <p className="text-xs text-muted-foreground">No agent runs yet.</p>;
  const sorted = [...runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  return (
    <div className="space-y-1.5">
      {sorted.map((r) => {
        const agent = AGENT_MAP[r.agentType];
        return (
          <div key={r.id} className="flex items-center gap-2 rounded-md border border-border/40 bg-background/30 p-2 text-xs">
            {agent && <Icon name={agent.icon} className={cn("h-3.5 w-3.5 shrink-0", agent.color)} />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{agent?.name ?? r.agentType}</p>
              <p className="text-[10px] text-muted-foreground">
                {timeAgo(r.createdAt)} · {formatDuration(r.durationMs)}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </div>
        );
      })}
    </div>
  );
}

// ── Empty project picker ─────────────────────────────────────────────────
function ProjectPicker() {
  const { openProject } = useApp();
  const { data, isLoading } = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });
  const projects = data?.projects ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
          <FolderKanban className="h-6 w-6 text-emerald-400" />
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Select a project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick an in-flight production to open its workspace, or discover a new opportunity.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-32 animate-pulse border-border/60 bg-card/40" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-card/30 p-10 text-center text-sm text-muted-foreground">
          No projects yet — discover an opportunity to begin.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => openProject(p.id)}
              className="group flex flex-col gap-2 rounded-xl border border-border/60 bg-card/40 p-4 text-left transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5"
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] capitalize text-emerald-300">
                  {p.stage.replace("_", " ")}
                </Badge>
                {p.opportunityScore != null && (
                  <span className={cn("font-mono text-xs font-semibold", metricColor(Number(p.opportunityScore)))}>
                    {Math.round(Number(p.opportunityScore))}
                  </span>
                )}
              </div>
              <p className="line-clamp-2 text-sm font-medium leading-tight">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.niche}</p>
              <div className="mt-auto flex items-center justify-between pt-1">
                <StatusBadge status={p.status} />
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main workspace ───────────────────────────────────────────────────────
function ProjectWorkspace({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { data: project, isLoading, isError, error } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.getProject(projectId),
    refetchInterval: 8000,
  });

  const currentStage = project?.stage ?? "opportunity";
  const currentStageInfo = PIPELINE.find((s) => s.key === currentStage) ?? PIPELINE[0];
  const currentAgent = AGENT_MAP[currentStageInfo.agent];

  // Find a pending approval gate at the current stage (or any earlier stage if blocked)
  const pendingGate = useMemo(() => {
    if (!project) return null;
    const currentIdx = STAGE_INDEX[currentStage] ?? 0;
    const gates = project.approvals
      .filter((g) => g.status === "pending")
      .sort((a, b) => {
        const ai = STAGE_INDEX[a.stage] ?? 0;
        const bi = STAGE_INDEX[b.stage] ?? 0;
        // Prefer gate at current stage; otherwise the closest earlier pending gate
        if (ai === currentIdx) return -1;
        if (bi === currentIdx) return 1;
        return bi - ai;
      });
    return gates[0] ?? null;
  }, [project, currentStage]);

  const advanceMut = useMutation({
    mutationFn: () =>
      api.runAgent({ agentType: "chief_director", projectId, input: { action: "advance" } }),
    onSuccess: () => {
      toast.success("Maestro dispatched the next agent");
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to advance pipeline");
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="h-24 animate-pulse rounded-xl bg-card/40" />
        <div className="h-12 animate-pulse rounded-xl bg-card/40" />
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-xl bg-card/40 lg:col-span-8" />
          <div className="h-96 animate-pulse rounded-xl bg-card/40 lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="border-rose-500/30 bg-rose-500/5 p-6 text-center text-sm text-rose-300">
          Failed to load project: {(error as Error)?.message}
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Project header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-border/60 bg-card/40 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <button
                  onClick={() => useApp.setState({ activeProjectId: null })}
                  className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
                </button>
              </div>
              <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{project.title}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-border/60 text-[10px] capitalize text-muted-foreground">
                  {project.niche}
                </Badge>
                <StatusBadge status={project.status} />
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] capitalize text-emerald-300">
                  {currentStageInfo.label}
                </Badge>
              </div>
              {project.brief && (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{project.brief}</p>
              )}
            </div>
            {project.opportunity && (
              <div className="flex shrink-0 items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Opp. score</p>
                  <p className={cn("font-mono text-lg font-semibold", metricColor(project.opportunity.opportunityScore))}>
                    {Math.round(project.opportunity.opportunityScore)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Stage stepper */}
      <StageStepper currentStage={currentStage} />

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left main */}
        <div className="space-y-4 lg:col-span-8">
          {/* Current stage / approval */}
          <Card className="border-border/60 bg-card/40 p-5">
            <div className="mb-3 flex items-center gap-2">
              {currentAgent && <Icon name={currentAgent.icon} className={cn("h-5 w-5", currentAgent.color)} />}
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current stage</p>
                <h3 className="text-sm font-semibold">{currentStageInfo.label}</h3>
              </div>
              {currentStageInfo.requiresApproval && (
                <Badge variant="outline" className="border-amber-500/30 text-[10px] text-amber-300">
                  <Lock className="mr-1 h-2.5 w-2.5" /> Approval gate
                </Badge>
              )}
            </div>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{currentStageInfo.description}</p>
            {currentAgent && (
              <div className="mb-4 flex items-center gap-2 rounded-md border border-border/50 bg-background/40 p-2.5 text-xs">
                <Icon name={currentAgent.icon} className={cn("h-3.5 w-3.5", currentAgent.color)} />
                <span className="font-medium text-foreground">{currentAgent.name}</span>
                <span className="text-muted-foreground">· {currentAgent.role}</span>
              </div>
            )}

            {pendingGate ? (
              <ApprovalCard gate={pendingGate} projectId={project.id} />
            ) : (
              <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/40 p-4">
                <div className="flex items-start gap-2">
                  <Play className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium">Run the next agent</p>
                    <p className="text-xs text-muted-foreground">
                      No pending approval gate at this stage — dispatch the next agent to continue.
                    </p>
                  </div>
                </div>
                <div>
                  <Button
                    onClick={() => advanceMut.mutate()}
                    disabled={advanceMut.isPending}
                    className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                  >
                    {advanceMut.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Maestro is dispatching…
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" /> Run next agent
                      </>
                    )}
                  </Button>
                </div>
                {advanceMut.isPending && (
                  <p className="flex items-center gap-1.5 text-[11px] text-amber-200/80">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                    </span>
                    Maestro is dispatching the next agent…
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Artifacts */}
          <Card className="border-border/60 bg-card/40 p-5">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold">Artifacts</h3>
              <span className="text-xs text-muted-foreground">Produced across the pipeline</span>
            </div>
            <Separator className="mb-3 bg-border/40" />
            <ArtifactsAccordion project={project} />
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4 lg:col-span-4">
          <Card className="border-border/60 bg-card/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold">Activity</h3>
            </div>
            <ActivityFeed activities={project.activities} />
          </Card>

          <Card className="border-border/60 bg-card/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bot className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold">Recent agent runs</h3>
            </div>
            <RecentRuns runs={project.agentRuns} />
          </Card>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceView() {
  const { activeProjectId } = useApp();
  if (!activeProjectId) return <ProjectPicker />;
  return <ProjectWorkspace projectId={activeProjectId} />;
}
