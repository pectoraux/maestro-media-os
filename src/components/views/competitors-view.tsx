"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Crosshair,
  Search,
  Loader2,
  Sparkles,
  Eye,
  ThumbsUp,
  MessageSquare,
  ExternalLink,
  Type,
  Image as ImageIcon,
  FileText,
  MessagesSquare,
  Trophy,
  Lightbulb,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import type { CompetitorVideoRecord } from "@/lib/types";

// ── helpers ──────────────────────────────────────────────────────────────
function extractVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/v\/)([A-Za-z0-9_-]{6,})/,
    /[?&]v=([A-Za-z0-9_-]{6,})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function formatViews(n: number): string {
  if (!n || n < 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function formatDuration(sec: number): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return `${m}:${s.toString().padStart(2, "0")}`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}:${mm.toString().padStart(2, "0")}`;
}

function perfColor(v: number): { text: string; bg: string; border: string } {
  if (v >= 80) return { text: "text-emerald-300", bg: "bg-emerald-500/15", border: "border-emerald-500/40" };
  if (v >= 60) return { text: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/40" };
  return { text: "text-rose-300", bg: "bg-rose-500/15", border: "border-rose-500/40" };
}

function sentimentColor(s: string): string {
  const v = (s || "").toLowerCase();
  if (v.includes("posit") || v.includes("enthusi")) return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  if (v.includes("negat") || v.includes("anger")) return "border-rose-500/40 bg-rose-500/10 text-rose-300";
  return "border-amber-500/40 bg-amber-500/10 text-amber-300";
}

// ── Thumbnail with fallback ──────────────────────────────────────────────
function Thumbnail({ url, title }: { url: string; title: string }) {
  const videoId = extractVideoId(url);
  const [stage, setStage] = useState<"max" | "mq" | "hq" | "fail">(videoId ? "max" : "fail");

  if (!videoId || stage === "fail") {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-border/60 bg-background/40">
        <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
      </div>
    );
  }
  const src =
    stage === "max"
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : stage === "mq"
        ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      onError={() => setStage((s) => (s === "max" ? "mq" : s === "mq" ? "hq" : "fail"))}
      className="aspect-video w-full rounded-lg border border-border/60 object-cover"
    />
  );
}

// ── Tag list ─────────────────────────────────────────────────────────────
function TagList({
  items,
  variant = "default",
  emptyLabel = "None captured",
}: {
  items?: string[] | null;
  variant?: "default" | "emerald" | "amber" | "rose";
  emptyLabel?: string;
}) {
  const list = (items ?? []).filter(Boolean);
  if (list.length === 0) {
    return <p className="text-xs italic text-muted-foreground">{emptyLabel}</p>;
  }
  const variants: Record<string, string> = {
    default: "border-border/60 bg-background/40 text-foreground/80",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    rose: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((t, i) => (
        <Badge key={i} variant="outline" className={cn("h-5 px-2 text-[10px] font-normal", variants[variant])}>
          {t}
        </Badge>
      ))}
    </div>
  );
}

function BulletList({
  items,
  variant = "default",
  emptyLabel = "None captured",
}: {
  items?: string[] | null;
  variant?: "default" | "emerald";
  emptyLabel?: string;
}) {
  const list = (items ?? []).filter(Boolean);
  if (list.length === 0) {
    return <p className="text-xs italic text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-1">
      {list.map((q, i) => (
        <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-foreground/85">
          <span
            className={cn(
              "mt-1 h-1 w-1 shrink-0 rounded-full",
              variant === "emerald" ? "bg-emerald-400" : "bg-muted-foreground",
            )}
          />
          <span>{q}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Competitor card ──────────────────────────────────────────────────────
function CompetitorCard({ video, delay }: { video: CompetitorVideoRecord; delay: number }) {
  const perf = perfColor(video.performanceScore ?? 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className="border-border/60 bg-card/40 p-4 lg:p-5">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="w-full shrink-0 sm:w-64">
            <Thumbnail url={video.url} title={video.title} />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold leading-tight">{video.title}</h3>
              <Badge variant="outline" className={cn("h-6 shrink-0 px-2 font-mono text-[11px]", perf.border, perf.bg, perf.text)}>
                <Trophy className="mr-1 h-3 w-3" /> {Math.round(video.performanceScore ?? 0)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="text-foreground/80">{video.channel}</span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> {formatViews(video.views)} views
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" /> {formatViews(video.likes)}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> {formatViews(video.comments)}
              </span>
              <span>· {formatDuration(video.durationSec)}</span>
            </div>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:text-emerald-200 hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Watch on YouTube
            </a>
          </div>
        </div>

        {/* Expandable deep analysis */}
        <Accordion type="multiple" className="mt-4">
          {/* Title analysis */}
          <AccordionItem value="title" className="border-border/40">
            <AccordionTrigger className="text-xs font-medium hover:no-underline">
              <span className="flex items-center gap-2">
                <Type className="h-3.5 w-3.5 text-emerald-400" /> Title analysis
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Pattern</p>
                  <p className="text-xs text-foreground/85">{video.titleAnalysis?.pattern ?? "—"}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Length</p>
                  <p className="font-mono text-xs text-foreground/85">{video.titleAnalysis?.length ?? 0} chars</p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Hooks</p>
                <TagList items={video.titleAnalysis?.hooks} emptyLabel="No hooks detected" />
              </div>
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Curiosity triggers</p>
                <TagList items={video.titleAnalysis?.curiosityTriggers} variant="amber" emptyLabel="No triggers detected" />
              </div>
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Sentiment</p>
                <Badge variant="outline" className={cn("h-5 px-2 text-[10px] capitalize", sentimentColor(video.titleAnalysis?.sentiment ?? ""))}>
                  {video.titleAnalysis?.sentiment ?? "—"}
                </Badge>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Thumbnail analysis */}
          <AccordionItem value="thumbnail" className="border-border/40">
            <AccordionTrigger className="text-xs font-medium hover:no-underline">
              <span className="flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-amber-400" /> Thumbnail analysis
                <span className="ml-1 text-[10px] font-normal text-muted-foreground">(VLM vision)</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Composition</p>
                  <p className="text-xs text-foreground/85">{video.thumbnailAnalysis?.composition ?? "—"}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Focal subject</p>
                  <p className="text-xs text-foreground/85">{video.thumbnailAnalysis?.focal ?? "—"}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Text overlay</p>
                  <p className="text-xs text-foreground/85">{video.thumbnailAnalysis?.textOverlay ?? "—"}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Emotion</p>
                  <p className="text-xs text-foreground/85">{video.thumbnailAnalysis?.emotion ?? "—"}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Color mood</p>
                  <p className="text-xs text-foreground/85">{video.thumbnailAnalysis?.colorMood ?? "—"}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>Readability score</span>
                  <span className={cn("font-mono", perfColor(video.thumbnailAnalysis?.readability ?? 0).text)}>
                    {Math.round(video.thumbnailAnalysis?.readability ?? 0)}/100
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                  <div
                    className={cn("h-full rounded-full", perfColor(video.thumbnailAnalysis?.readability ?? 0).bg.replace("/15", ""))}
                    style={{ width: `${Math.max(3, video.thumbnailAnalysis?.readability ?? 0)}%` }}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Transcript summary */}
          <AccordionItem value="transcript" className="border-border/40">
            <AccordionTrigger className="text-xs font-medium hover:no-underline">
              <span className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-violet-400" /> Transcript summary
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Structure</p>
                  <p className="text-xs text-foreground/85">{video.transcriptSummary?.structure ?? "—"}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Retention pattern</p>
                  <p className="text-xs text-foreground/85">{video.transcriptSummary?.retentionPattern ?? "—"}</p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Key points</p>
                <BulletList items={video.transcriptSummary?.keyPoints} emptyLabel="No key points captured" />
              </div>
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Calls to action</p>
                <TagList items={video.transcriptSummary?.callsToAction} variant="emerald" emptyLabel="No CTAs captured" />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Comment insights */}
          <AccordionItem value="comments" className="border-border/40">
            <AccordionTrigger className="text-xs font-medium hover:no-underline">
              <span className="flex items-center gap-2">
                <MessagesSquare className="h-3.5 w-3.5 text-rose-400" /> Comment insights
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Top questions</p>
                  <BulletList items={video.commentInsights?.topQuestions} />
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Pain points</p>
                  <BulletList items={video.commentInsights?.painPoints} />
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Praises</p>
                  <BulletList items={video.commentInsights?.praises} variant="emerald" />
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Objections</p>
                  <BulletList items={video.commentInsights?.objections} />
                </div>
              </div>
              {/* Audience questions — highlighted as future-video opportunities */}
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                  <Lightbulb className="h-3 w-3" /> Audience questions (future-video opportunities)
                </p>
                <BulletList items={video.commentInsights?.audienceQuestions} variant="emerald" emptyLabel="No audience questions captured" />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Winning patterns */}
          <AccordionItem value="patterns" className="border-b-0">
            <AccordionTrigger className="text-xs font-medium hover:no-underline">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Winning patterns
                <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                  ({video.winningPatterns?.length ?? 0})
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
              {(video.winningPatterns ?? []).length === 0 ? (
                <p className="text-xs italic text-muted-foreground">No winning patterns captured</p>
              ) : (
                (video.winningPatterns ?? []).map((p, i) => (
                  <div key={i} className="rounded-lg border border-border/60 bg-background/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-foreground/90">{p.pattern}</p>
                      <Badge variant="outline" className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-300">
                        adaptable
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                      <span className="text-foreground/70">Why it worked: </span>
                      {p.whyItWorked}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-emerald-200/90">
                      <span className="text-emerald-400/80">How you could use it: </span>
                      {p.applicability}
                    </p>
                  </div>
                ))
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </motion.div>
  );
}

// ── Loading state ────────────────────────────────────────────────────────
function AnalyzeLoader({ elapsed, limit }: { elapsed: number; limit: number }) {
  const idx = Math.min(limit - 1, Math.floor(elapsed / 12));
  const phases = [
    "Searching YouTube for top-performing videos…",
    `Analyzing video ${idx + 1} of ${limit}…`,
    "Reading transcripts and comment threads…",
    "Running VLM vision on thumbnails…",
    "Extracting winning patterns you can adapt…",
    "Final scoring and packaging…",
  ];
  const phaseIdx = Math.min(phases.length - 1, Math.floor(elapsed / 8));
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card/60 to-card/40 p-6"
    >
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative flex flex-col items-center gap-5 py-4 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/20" />
          <span className="absolute inline-flex h-3/4 w-3/4 animate-ping rounded-full bg-amber-500/20" style={{ animationDelay: "0.4s" }} />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10">
            <Crosshair className="h-6 w-6 animate-spin text-amber-400" style={{ animationDuration: "2.4s" }} />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-200">{phases[phaseIdx]}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {elapsed}s elapsed · Scout deep-analyzes titles, thumbnails, transcripts &amp; comments · typically 30–60s
          </p>
        </div>
        {/* Video progress dots */}
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: limit }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border text-[11px] font-mono transition-all",
                i < idx && "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
                i === idx && "border-amber-500/40 bg-amber-500/10 text-amber-200",
                i > idx && "border-border/40 bg-background/40 text-muted-foreground",
              )}
            >
              {i < idx ? "✓" : i + 1}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────
function CompetitorSkeleton() {
  return (
    <Card className="border-border/60 bg-card/40 p-4">
      <div className="flex animate-pulse gap-4">
        <div className="aspect-video w-64 shrink-0 rounded-lg bg-muted/40" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted/60" />
          <div className="h-3 w-1/2 rounded bg-muted/40" />
          <div className="h-3 w-1/3 rounded bg-muted/40" />
          <div className="h-3 w-1/4 rounded bg-muted/30" />
        </div>
      </div>
    </Card>
  );
}

// ── Main view ────────────────────────────────────────────────────────────
export function CompetitorsView() {
  const qc = useQueryClient();
  const { activeProjectId } = useApp();
  const [niche, setNiche] = useState("AI infrastructure");
  const [elapsed, setElapsed] = useState(0);
  const LIMIT = 4;

  const projectQuery = useQuery({
    queryKey: ["project", activeProjectId],
    queryFn: () => (activeProjectId ? api.getProject(activeProjectId) : Promise.reject(new Error("no project"))),
    enabled: !!activeProjectId,
  });

  const listQuery = useQuery({
    queryKey: ["competitors", activeProjectId],
    queryFn: () => api.listCompetitors(undefined, activeProjectId ?? undefined),
  });

  const analyzeMut = useMutation({
    mutationFn: () =>
      api.analyzeCompetitors({
        niche: niche.trim() || "AI infrastructure",
        projectId: activeProjectId ?? undefined,
        limit: LIMIT,
      }),
    onMutate: () => setElapsed(0),
    onSuccess: (data) => {
      toast.success(`Analyzed ${data.competitors.length} competitor videos`);
      qc.invalidateQueries({ queryKey: ["competitors", activeProjectId] });
      qc.invalidateQueries({ queryKey: ["project", activeProjectId] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Competitor analysis failed");
    },
  });

  useEffect(() => {
    if (!analyzeMut.isPending) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [analyzeMut.isPending]);

  const competitors = useMemo(() => {
    return listQuery.data?.competitors ?? [];
  }, [listQuery.data]);

  const activeProjectTitle = projectQuery.data?.title;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20">
            <Crosshair className="h-5 w-5 text-rose-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">Competitor Intelligence</h1>
            <p className="text-xs text-muted-foreground lg:text-sm">
              Scout deep-analyzes competing videos: titles, thumbnails, transcripts, comments — extracting winning
              patterns you can <span className="text-foreground/80">adapt (not copy)</span>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Active project note */}
      {activeProjectId && activeProjectTitle && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-muted-foreground">Analyzing for:</span>
          <span className="font-medium text-foreground/90">{activeProjectTitle}</span>
        </div>
      )}

      {/* Analyze control */}
      <Card className="border-border/60 bg-card/40 p-4 lg:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Niche / topic
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. AI infrastructure, dev tools, robotics…"
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !analyzeMut.isPending) analyzeMut.mutate();
                }}
                disabled={analyzeMut.isPending}
              />
            </div>
          </div>
          <Button
            onClick={() => analyzeMut.mutate()}
            disabled={analyzeMut.isPending}
            className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 sm:w-auto"
          >
            {analyzeMut.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Analyze competitors
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Loader */}
      {analyzeMut.isPending && <AnalyzeLoader elapsed={elapsed} limit={LIMIT} />}

      {/* Error */}
      {listQuery.isError && (
        <Card className="border-rose-500/30 bg-rose-500/5 p-6 text-center text-sm text-rose-300">
          <AlertCircle className="mx-auto mb-2 h-5 w-5" />
          Failed to load competitor videos: {(listQuery.error as Error)?.message}
        </Card>
      )}

      {/* List */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Crosshair className="h-4 w-4 text-emerald-400" /> Analyzed videos
            <span className="ml-1 font-mono text-xs text-muted-foreground">({competitors.length})</span>
          </h2>
        </div>

        {listQuery.isLoading ? (
          <div className="space-y-3">
            <CompetitorSkeleton />
            <CompetitorSkeleton />
          </div>
        ) : competitors.length === 0 && !analyzeMut.isPending ? (
          <Card className="relative overflow-hidden border-dashed border-border/60 bg-card/30 p-10">
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-20" />
            <div className="relative flex flex-col items-center text-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-background/40">
                <Crosshair className="h-7 w-7 text-muted-foreground/60" />
              </div>
              <p className="mt-4 text-sm font-medium">No competitor videos yet</p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                Run an analysis above to see deep video intelligence — title patterns, thumbnail VLM analysis,
                transcript structure, comment insights and winning patterns.
              </p>
            </div>
          </Card>
        ) : (
          <div className="max-h-[calc(100vh-280px)] space-y-4 overflow-y-auto pr-1 scroll-thin">
            {competitors.map((v, i) => (
              <CompetitorCard key={v.id ?? i} video={v} delay={Math.min(i * 0.05, 0.3)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
