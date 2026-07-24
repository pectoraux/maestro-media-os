"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Radar,
  Search,
  Sparkles,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  Youtube,
  Newspaper,
  MessageCircle,
  Activity,
  Rocket,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Gauge,
  Satellite,
} from "lucide-react";
import type {
  AdvancedScoreBreakdown,
  TrendSignalRecord,
} from "@/lib/types";

// ── helpers ──────────────────────────────────────────────────────────────
type ScanResult = {
  niche: string;
  signals: TrendSignalRecord[];
  advancedScore: AdvancedScoreBreakdown;
  overallScore: number;
  momentum: string;
  summary: string;
  dataSources: { source: string; count: number; freshness: string }[];
};

const SOURCE_META: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  youtube: { label: "YouTube", color: "text-rose-300", bg: "bg-rose-500/15 border-rose-500/30", icon: Youtube },
  google_trends: { label: "Google Trends", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/30", icon: TrendingUp },
  reddit: { label: "Reddit", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/30", icon: MessageCircle },
  news: { label: "News", color: "text-violet-300", bg: "bg-violet-500/15 border-violet-500/30", icon: Newspaper },
  // Fallbacks for the older source strings some scans return
  search: { label: "Search", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/30", icon: Search },
  competitor: { label: "Competitor", color: "text-rose-300", bg: "bg-rose-500/15 border-rose-500/30", icon: Youtube },
};

function sourceMeta(source: string) {
  return SOURCE_META[source] ?? SOURCE_META.youtube;
}

const FACTORS: {
  key: keyof AdvancedScoreBreakdown;
  label: string;
  weight: number;
  description: string;
}[] = [
  { key: "viralVelocity", label: "Viral Velocity", weight: 0.15, description: "Rate of view growth on related videos" },
  { key: "searchDemand", label: "Search Demand", weight: 0.2, description: "YouTube + Google search volume signals" },
  { key: "competitionGap", label: "Competition Gap", weight: 0.2, description: "How underserved the topic is" },
  { key: "monetizationPotential", label: "Monetization Potential", weight: 0.15, description: "Sponsor fit, audience value" },
  { key: "expertiseAlignment", label: "Expertise Alignment", weight: 0.15, description: "Match to creator's stored expertise" },
  { key: "trendMomentum", label: "Trend Momentum", weight: 0.15, description: "Acceleration of interest" },
];

function factorColor(v: number): { bar: string; text: string } {
  if (v >= 80) return { bar: "bg-emerald-500", text: "text-emerald-300" };
  if (v >= 60) return { bar: "bg-amber-500", text: "text-amber-300" };
  return { bar: "bg-rose-500", text: "text-rose-300" };
}

function momentumMeta(m: string) {
  switch (m) {
    case "rising":
      return { label: "Rising", cls: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" };
    case "peaking":
      return { label: "Peaking", cls: "border-amber-500/40 bg-amber-500/15 text-amber-300" };
    case "stable":
      return { label: "Stable", cls: "border-border/60 bg-muted text-muted-foreground" };
    case "declining":
      return { label: "Declining", cls: "border-rose-500/40 bg-rose-500/15 text-rose-300" };
    default:
      return { label: m || "—", cls: "border-border/60 bg-muted text-muted-foreground" };
  }
}

function formatMetric(value?: number | null, metric?: string | null): string | null {
  if (value == null) return null;
  if (metric) return `${metric}`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

// ── ScoreRing (large, hero-grade) ─────────────────────────────────────────
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const v = Math.max(0, Math.min(100, score));
  const color = v >= 80 ? "text-emerald-400" : v >= 65 ? "text-amber-400" : "text-rose-400";
  const stroke = 5;
  const r = 18 - stroke / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-border/40" />
        <motion.circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={color}
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${(v / 100) * c} ${c}` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("font-mono text-2xl font-semibold", color)}>{Math.round(v)}</span>
        <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Score</span>
      </div>
    </div>
  );
}

// ── Radar pulse loader ───────────────────────────────────────────────────
function RadarPulse() {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/20" />
      <span className="absolute inline-flex h-3/4 w-3/4 animate-ping rounded-full bg-emerald-500/20" style={{ animationDelay: "0.4s" }} />
      <span className="absolute inline-flex h-1/2 w-1/2 animate-ping rounded-full bg-emerald-500/30" style={{ animationDelay: "0.8s" }} />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10">
        <Radar className="h-6 w-6 animate-spin text-emerald-400" style={{ animationDuration: "2.4s" }} />
      </div>
    </div>
  );
}

function ScanLoader({ elapsed }: { elapsed: number }) {
  const sources = ["YouTube", "Google Trends", "Reddit", "News"];
  // Active source cycles every ~2s
  const activeIdx = Math.min(sources.length - 1, Math.floor(elapsed / 2.5));
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card/60 to-card/40 p-6"
    >
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative flex flex-col items-center gap-5 py-4 text-center">
        <RadarPulse />
        <div>
          <p className="text-sm font-semibold text-emerald-200">Maestro is scanning YouTube, Google Trends, Reddit &amp; news…</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {elapsed}s elapsed · typical scan takes 20–40s
          </p>
        </div>
        <div className="grid w-full max-w-md grid-cols-2 gap-2 sm:grid-cols-4">
          {sources.map((s, i) => {
            const done = i < activeIdx;
            const active = i === activeIdx;
            return (
              <div
                key={s}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] transition-all",
                  done && "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                  active && "border-amber-500/40 bg-amber-500/10 text-amber-200",
                  !done && !active && "border-border/40 bg-background/40 text-muted-foreground",
                )}
              >
                {done ? (
                  <CircleDot className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                )}
                <span className="truncate">{s}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ── Factor bar ───────────────────────────────────────────────────────────
function FactorBar({
  label,
  value,
  weight,
  description,
  delay,
}: {
  label: string;
  value: number;
  weight: number;
  description: string;
  delay: number;
}) {
  const v = Math.max(0, Math.min(100, value));
  const { bar, text } = factorColor(v);
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="font-mono text-[10px] text-muted-foreground">w {weight.toFixed(2)}</span>
        </div>
        <span className={cn("font-mono text-sm font-semibold", text)}>{Math.round(v)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
        <motion.div
          className={cn("h-full rounded-full", bar)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(3, v)}%` }}
          transition={{ duration: 0.7, delay: delay + 0.1, ease: "easeOut" }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{description}</p>
    </motion.div>
  );
}

// ── Data source card ─────────────────────────────────────────────────────
function DataSourceCard({
  source,
  count,
  freshness,
  delay,
}: {
  source: string;
  count: number;
  freshness: string;
  delay: number;
}) {
  const meta = sourceMeta(source);
  const IconCmp = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className={cn("relative overflow-hidden border p-4", meta.bg)}>
        <div className="flex items-start justify-between">
          <div className={cn("rounded-lg p-2", meta.bg)}>
            <IconCmp className={cn("h-4 w-4", meta.color)} />
          </div>
          <span className="font-mono text-2xl font-semibold">{count}</span>
        </div>
        <div className="mt-2">
          <p className="text-xs font-medium">{meta.label}</p>
          <p className="text-[10px] text-muted-foreground">{freshness}</p>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Signal card ──────────────────────────────────────────────────────────
function SignalCard({ signal, delay }: { signal: TrendSignalRecord; delay: number }) {
  const meta = sourceMeta(signal.source);
  const IconCmp = meta.icon;
  const [expanded, setExpanded] = useState(false);
  const mm = momentumMeta(signal.momentum ?? "stable");
  const metricStr = formatMetric(signal.metricValue, signal.metric);
  const snippet = signal.snippet ?? "";
  const long = snippet.length > 180;
  const shown = expanded || !long ? snippet : `${snippet.slice(0, 180)}…`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
    >
      <Card className="group border-border/60 bg-card/40 p-4 transition-colors hover:border-emerald-500/30">
        <div className="flex gap-3">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", meta.bg)}>
            <IconCmp className={cn("h-4 w-4", meta.color)} />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <a
                href={signal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium leading-tight hover:text-emerald-300 hover:underline"
              >
                {signal.title}
              </a>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{shown}</p>
            {long && (
              <button
                onClick={() => setExpanded((s) => !s)}
                className="inline-flex items-center gap-1 text-[10px] text-emerald-300 hover:text-emerald-200"
              >
                {expanded ? (
                  <>
                    Show less <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="outline" className={cn("h-5 px-2 text-[10px] capitalize", mm.cls)}>
                {mm.label}
              </Badge>
              {metricStr && (
                <Badge variant="outline" className="h-5 gap-1 border-border/60 bg-background/40 px-2 font-mono text-[10px]">
                  <Gauge className="h-3 w-3 text-muted-foreground" />
                  {metricStr}
                </Badge>
              )}
              <span className="ml-auto text-[10px] text-muted-foreground">{meta.label}</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Main view ────────────────────────────────────────────────────────────
export function IntelligenceView() {
  const qc = useQueryClient();
  const { openProject } = useApp();
  const [niche, setNiche] = useState("AI infrastructure");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const scanMut = useMutation({
    mutationFn: () => api.scanIntelligence(niche.trim() || "AI infrastructure"),
    onMutate: () => {
      setResult(null);
      setElapsed(0);
    },
    onSuccess: (data) => {
      setResult(data);
      setActiveTab("all");
      toast.success(`Scan complete · overall score ${Math.round(data.overallScore)}`);
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Intelligence scan failed");
    },
  });

  // Elapsed timer while scanning
  useEffect(() => {
    if (!scanMut.isPending) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [scanMut.isPending]);

  const createMut = useMutation({
    mutationFn: () => api.discoverOpportunity(result?.niche || niche.trim() || undefined),
    onSuccess: (data) => {
      toast.success("Project created from opportunity");
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (data.projectId) openProject(data.projectId);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to create project");
    },
  });

  const filteredSignals = useMemo(() => {
    if (!result?.signals) return [];
    if (activeTab === "all") return result.signals;
    return result.signals.filter((s) => s.source === activeTab);
  }, [result, activeTab]);

  const sourceCounts = useMemo(() => {
    const map: Record<string, number> = { youtube: 0, google_trends: 0, reddit: 0, news: 0 };
    (result?.signals ?? []).forEach((s) => {
      if (s.source in map) map[s.source]++;
      else map[s.source] = (map[s.source] ?? 0) + 1;
    });
    return map;
  }, [result]);

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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20">
            <Satellite className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">Intelligence Engine</h1>
            <p className="text-xs text-muted-foreground lg:text-sm">
              Live signals from YouTube, Google Trends, Reddit &amp; news — scored with an advanced 6-factor
              algorithm. <span className="text-foreground/80">No seeded data.</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Scan control */}
      <Card className="relative overflow-hidden border-border/60 bg-card/40 p-4 lg:p-5">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end">
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
                  if (e.key === "Enter" && !scanMut.isPending) scanMut.mutate();
                }}
                disabled={scanMut.isPending}
              />
            </div>
          </div>
          <Button
            onClick={() => scanMut.mutate()}
            disabled={scanMut.isPending}
            className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 sm:w-auto"
          >
            {scanMut.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Run live intelligence scan
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Scan loader */}
      {scanMut.isPending && <ScanLoader elapsed={elapsed} />}

      {/* Results */}
      {result && !scanMut.isPending && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Hero score */}
          <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card/80 via-card/40 to-transparent p-5 lg:p-7">
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
            <div className="relative flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <ScoreRing score={result.overallScore} />
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                      <Activity className="h-3 w-3" />
                      Opportunity score
                    </span>
                    <Badge variant="outline" className={cn("h-5 capitalize", momentumMeta(result.momentum).cls)}>
                      {momentumMeta(result.momentum).label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Niche: <span className="text-foreground/80">{result.niche}</span>
                  </p>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-foreground/90">{result.summary}</p>
                </div>
              </div>
              <Button
                onClick={() => createMut.mutate()}
                disabled={createMut.isPending}
                className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              >
                {createMut.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" /> Create project from this opportunity
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* 6-factor breakdown */}
          <Card className="border-border/60 bg-card/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Gauge className="h-4 w-4 text-emerald-400" /> Advanced 6-factor breakdown
                </h2>
                <p className="text-xs text-muted-foreground">
                  Each factor weighted 0.15–0.20 · emerald ≥80 · amber 60–79 · rose &lt;60
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {FACTORS.map((f, i) => (
                <FactorBar
                  key={f.key}
                  label={f.label}
                  value={Number(result.advancedScore?.[f.key] ?? 0)}
                  weight={f.weight}
                  description={f.description}
                  delay={i * 0.05}
                />
              ))}
            </div>
          </Card>

          {/* Data sources */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Newspaper className="h-4 w-4 text-emerald-400" /> Data sources
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {["youtube", "google_trends", "reddit", "news"].map((src, i) => {
                const ds = result.dataSources?.find((d) => d.source === src);
                return (
                  <DataSourceCard
                    key={src}
                    source={src}
                    count={ds?.count ?? sourceCounts[src] ?? 0}
                    freshness={ds?.freshness ?? "live"}
                    delay={i * 0.06}
                  />
                );
              })}
            </div>
          </div>

          {/* Live signals feed */}
          <Card className="border-border/60 bg-card/40 p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Radar className="h-4 w-4 text-emerald-400" /> Live signals feed
                  <span className="ml-1 font-mono text-xs text-muted-foreground">({result.signals.length})</span>
                </h2>
                <p className="text-xs text-muted-foreground">Real signals captured during this scan.</p>
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 flex h-auto flex-wrap">
                <TabsTrigger value="all" className="text-xs">
                  All <span className="ml-1 font-mono text-[10px] text-muted-foreground">{result.signals.length}</span>
                </TabsTrigger>
                <TabsTrigger value="youtube" className="text-xs">
                  YouTube <span className="ml-1 font-mono text-[10px] text-muted-foreground">{sourceCounts.youtube}</span>
                </TabsTrigger>
                <TabsTrigger value="google_trends" className="text-xs">
                  Trends <span className="ml-1 font-mono text-[10px] text-muted-foreground">{sourceCounts.google_trends}</span>
                </TabsTrigger>
                <TabsTrigger value="reddit" className="text-xs">
                  Reddit <span className="ml-1 font-mono text-[10px] text-muted-foreground">{sourceCounts.reddit}</span>
                </TabsTrigger>
                <TabsTrigger value="news" className="text-xs">
                  News <span className="ml-1 font-mono text-[10px] text-muted-foreground">{sourceCounts.news}</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab}>
                {filteredSignals.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/50 p-8 text-center text-xs text-muted-foreground">
                    No {activeTab === "all" ? "" : activeTab + " "}signals captured in this scan.
                  </div>
                ) : (
                  <div className="grid max-h-[600px] gap-3 overflow-y-auto pr-1 scroll-thin lg:grid-cols-2">
                    {filteredSignals.map((sig, i) => (
                      <SignalCard key={sig.id ?? i} signal={sig} delay={Math.min(i * 0.03, 0.3)} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>
      )}

      {/* Empty state */}
      {!result && !scanMut.isPending && (
        <Card className="relative overflow-hidden border-dashed border-border/60 bg-card/30 p-10">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative flex flex-col items-center text-center">
            <RadarPulse />
            <p className="mt-5 text-base font-medium">Intelligence engine ready</p>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              Run a live scan above. Maestro will query YouTube, Google Trends, Reddit and news in real time,
              then score the opportunity across 6 weighted factors.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
