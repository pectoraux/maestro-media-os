"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { Icon } from "@/components/icon";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Radar,
  Search,
  TrendingUp,
  Users,
  Check,
  X,
  Sparkles,
  ChevronRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import type { OpportunityRecord, OpportunityScoreBreakdown } from "@/lib/types";

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

function metricColor(v: number): string {
  if (v >= 80) return "bg-emerald-500";
  if (v >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

function metricTextColor(v: number): string {
  if (v >= 80) return "text-emerald-300";
  if (v >= 60) return "text-amber-300";
  return "text-rose-300";
}

const BREAKDOWN_LABELS: { key: string; label: string }[] = [
  // Phase 2 advanced 6-factor (new)
  { key: "viralVelocity", label: "Viral velocity" },
  { key: "searchDemand", label: "Search demand" },
  { key: "competitionGap", label: "Competition gap" },
  { key: "monetizationPotential", label: "Monetization" },
  { key: "expertiseAlignment", label: "Expertise fit" },
  { key: "trendMomentum", label: "Trend momentum" },
  // Legacy 6-factor (Phase 1 seeded)
  { key: "competition", label: "Competition" },
  { key: "freshness", label: "Freshness" },
  { key: "audienceFit", label: "Audience fit" },
  { key: "knowledgeGap", label: "Knowledge gap" },
];

// ── ScoreRing (local re-impl to keep file self-contained) ────────────────
function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const v = Math.max(0, Math.min(100, score));
  const color = v >= 80 ? "text-emerald-400" : v >= 65 ? "text-amber-400" : "text-rose-400";
  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="-rotate-90" width={size} height={size} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-border/50" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className={color}
          strokeDasharray={`${(v / 100) * 94.2} 94.2`}
        />
      </svg>
      <span className={cn("absolute font-mono text-xs font-semibold", color)}>{Math.round(v)}</span>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────
function OpportunitySkeleton() {
  return (
    <Card className="border-border/60 bg-card/40 p-5">
      <div className="flex animate-pulse gap-4">
        <div className="h-12 w-12 rounded-full bg-muted/60" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted/60" />
          <div className="h-3 w-1/2 rounded bg-muted/40" />
          <div className="grid grid-cols-3 gap-2 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-muted/30" />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Score breakdown bars ──────────────────────────────────────────────────
function ScoreBreakdown({ breakdown }: { breakdown: Record<string, number> }) {
  const present = BREAKDOWN_LABELS.filter(({ key }) => breakdown && key in breakdown && Number(breakdown[key]) > 0);
  const labels = present.length > 0 ? present : BREAKDOWN_LABELS.slice(0, 6);
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
      {labels.map(({ key, label }) => {
        const v = Number(breakdown?.[key] ?? 0);
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="truncate">{label}</span>
              <span className={cn("font-mono font-semibold", metricTextColor(v))}>{Math.round(v)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
              <div
                className={cn("h-full rounded-full transition-all", metricColor(v))}
                style={{ width: `${Math.max(4, Math.min(100, v))}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Opportunity card ─────────────────────────────────────────────────────
function OpportunityCard({
  op,
  projectId,
}: {
  op: OpportunityRecord & { projectTitle?: string; projectStatus?: string };
  projectId: string;
}) {
  const qc = useQueryClient();
  const { openProject } = useApp();
  const [pendingAction, setPendingAction] = useState<"accept" | "reject" | null>(null);

  const acceptMut = useMutation({
    mutationFn: () => api.acceptOpportunity(op.id),
    onMutate: () => setPendingAction("accept"),
    onSuccess: () => {
      toast.success("Opportunity accepted · project ready");
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      openProject(projectId);
      setPendingAction(null);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to accept opportunity");
      setPendingAction(null);
    },
  });

  const rejectMut = useMutation({
    mutationFn: () => api.rejectOpportunity(op.id),
    onMutate: () => setPendingAction("reject"),
    onSuccess: () => {
      toast.success("Opportunity rejected");
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setPendingAction(null);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to reject opportunity");
      setPendingAction(null);
    },
  });

  const decided = op.status === "accepted" || op.status === "rejected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/60 bg-card/40 p-5 transition-colors hover:border-emerald-500/30">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Left rail */}
          <div className="flex flex-row items-start gap-4 lg:w-56 lg:flex-col lg:items-center">
            <ScoreRing score={op.opportunityScore} size={56} />
            <div className="flex-1 lg:flex-none lg:text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Opportunity Score
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5 lg:justify-center">
                <StatusBadge status={op.confidence} />
                <StatusBadge status={op.status} />
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h3 className="text-base font-semibold leading-tight">{op.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="text-foreground/80">{op.niche}</span> · {op.angle}
              </p>
            </div>

            <ScoreBreakdown breakdown={op.scoreBreakdown} />

            {/* Sources */}
            {op.sources?.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Sources
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {op.sources.slice(0, 6).map((s, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="gap-1 border-border/60 bg-background/40 text-[10px] font-normal"
                    >
                      <span className="text-foreground/80">{s.name}</span>
                      <span className="text-muted-foreground">· {s.type}</span>
                      <span className="text-emerald-300/80">· {s.signal}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Trends */}
            {op.trends?.length > 0 && (
              <div>
                <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <TrendingUp className="h-3 w-3" /> Trends
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {op.trends.slice(0, 4).map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 rounded-md border border-border/50 bg-background/40 px-2 py-1 text-[11px]"
                    >
                      <span className="text-foreground/80">{t.source}</span>
                      <span className="text-muted-foreground">· {t.signal}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-border/50 px-1.5 py-0 text-[9px] capitalize",
                          t.momentum === "rising" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                          t.momentum === "peak" && "border-amber-500/30 bg-amber-500/10 text-amber-300",
                          t.momentum === "cooling" && "border-rose-500/30 bg-rose-500/10 text-rose-300",
                        )}
                      >
                        {t.momentum}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Audience signals */}
              {op.audienceSignals?.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <Users className="h-3 w-3" /> Audience signals
                  </p>
                  <ul className="space-y-1">
                    {op.audienceSignals.slice(0, 3).map((a, i) => (
                      <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-foreground/80">
                        <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Competitors */}
              {op.competitors?.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <Users className="h-3 w-3" /> Competitors
                  </p>
                  <div className="overflow-x-auto rounded-md border border-border/50">
                    <table className="w-full min-w-[220px] text-[11px]">
                      <thead className="bg-muted/30 text-[9px] uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-2 py-1 text-left">Channel</th>
                          <th className="px-2 py-1 text-right">Subs</th>
                          <th className="px-2 py-1 text-left">Gap</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {op.competitors.slice(0, 3).map((c, i) => (
                          <tr key={i} className="text-foreground/80">
                            <td className="truncate px-2 py-1">{c.channel}</td>
                            <td className="px-2 py-1 text-right font-mono">{c.subs}</td>
                            <td className="truncate px-2 py-1 text-amber-300/80">{c.gap}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground">Discovered {timeAgo(op.createdAt)}</p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => acceptMut.mutate()}
                disabled={decided || pendingAction !== null}
                className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              >
                {pendingAction === "accept" ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                )}
                {op.status === "accepted" ? "Accepted" : "Accept → project"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => rejectMut.mutate()}
                disabled={decided || pendingAction !== null}
                className="text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
              >
                {pendingAction === "reject" ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="mr-1.5 h-3.5 w-3.5" />
                )}
                Reject
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Main view ────────────────────────────────────────────────────────────
export function OpportunitiesView() {
  const qc = useQueryClient();
  const [niche, setNiche] = useState("AI infrastructure");

  const list = useQuery({ queryKey: ["opportunities"], queryFn: api.listOpportunities });

  const huntMut = useMutation({
    mutationFn: () => api.discoverOpportunity(niche.trim() || undefined),
    onSuccess: (data) => {
      const score = Math.round(data.opportunityScore ?? 0);
      toast.success(`Opportunity discovered · score ${score}`);
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Opportunity Hunter failed");
    },
  });

  const hunting = huntMut.isPending;
  const opportunities = list.data?.opportunities ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
            <Radar className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Opportunity Discovery</h1>
            <p className="text-xs text-muted-foreground">
              Atlas scans YouTube, Google Trends, Reddit, news &amp; search demand to surface a weighted{" "}
              <span className="text-foreground/80">Opportunity Score</span> — composed of search demand,
              competition, freshness, audience fit, monetization, and knowledge gap.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Hunt control */}
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
                  if (e.key === "Enter" && !hunting) huntMut.mutate();
                }}
                disabled={hunting}
              />
            </div>
          </div>
          <Button
            onClick={() => huntMut.mutate()}
            disabled={hunting}
            className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 sm:w-auto"
          >
            {hunting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Hunting…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Run Opportunity Hunter
              </>
            )}
          </Button>
        </div>

        {hunting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            <p className="text-xs text-amber-200/90">
              Atlas is scanning YouTube, Trends, Reddit, news &amp; search demand…
              <span className="ml-1 text-muted-foreground">This usually takes 15–25s.</span>
            </p>
          </motion.div>
        )}
      </Card>

      {/* List */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold">
              Discovered opportunities
              <span className="ml-2 font-mono text-xs text-muted-foreground">({opportunities.length})</span>
            </h2>
          </div>
        </div>

        {list.isLoading ? (
          <div className="space-y-3">
            <OpportunitySkeleton />
            <OpportunitySkeleton />
          </div>
        ) : list.isError ? (
          <Card className="border-rose-500/30 bg-rose-500/5 p-6 text-center text-sm text-rose-300">
            Failed to load opportunities: {(list.error as Error)?.message}
          </Card>
        ) : opportunities.length === 0 ? (
          <Card className="border-dashed border-border/60 bg-card/30 p-10 text-center">
            <Radar className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium">No opportunities yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Run the Opportunity Hunter above to discover your first content opportunity.
            </p>
          </Card>
        ) : (
          <div className="max-h-[calc(100vh-220px)] space-y-4 overflow-y-auto pr-1 scroll-thin">
            {opportunities.map((op) => (
              <OpportunityCard key={op.id} op={op} projectId={op.projectId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
