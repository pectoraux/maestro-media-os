"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  TrifectaCandidate,
  TrifectaRecord,
  ThumbnailBriefRecord,
} from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Zap,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Wand2,
  Sparkles,
  Fingerprint,
  Crown,
  ChevronDown,
  Quote,
  Type,
  Palette,
  Eye,
  Smartphone,
  Layout,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

/* ── main panel ─────────────────────────────────────────────────────── */

export function TrifectaPanel({ projectId }: { projectId: string }) {
  const qc = useQueryClient();

  const trifectaQuery = useQuery({
    queryKey: ["trifecta", projectId],
    queryFn: () => api.getTrifecta(projectId),
    refetchInterval: 30000,
  });

  const thumbnailsQuery = useQuery({
    queryKey: ["thumbnails", projectId],
    queryFn: () => api.listThumbnails(projectId),
    refetchInterval: 30000,
  });

  const optimizeMut = useMutation({
    mutationFn: () => api.optimizeTrifecta(projectId),
    onSuccess: (res) => {
      toast.success(
        `Spark + Canvas optimized the Holy Trifecta · composite ${Math.round(res.winner.compositeScore)}/100`,
      );
      qc.invalidateQueries({ queryKey: ["trifecta", projectId] });
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (e: Error) => toast.error(e.message || "Optimization failed"),
  });

  const briefMut = useMutation({
    mutationFn: () => api.generateThumbnailBrief(projectId),
    onSuccess: (res) => {
      toast.success("Canvas produced a thumbnail brief");
      qc.invalidateQueries({ queryKey: ["thumbnails", projectId] });
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      void res;
    },
    onError: (e: Error) => toast.error(e.message || "Brief generation failed"),
  });

  const trifecta: TrifectaRecord | null = trifectaQuery.data?.trifecta ?? null;
  const briefs: ThumbnailBriefRecord[] = thumbnailsQuery.data?.briefs ?? [];

  // The optimize POST returns rich candidate data; merge into display when available.
  const lastOptResult = optimizeMut.data;
  const voiceDNAUsed = lastOptResult?.voiceDNAUsed ?? false;
  const candidates = lastOptResult?.candidates ?? null;

  // Build a "winner view model" from either the POST response or the stored record.
  const winnerVM = useMemo<WinnerVM | null>(() => {
    if (lastOptResult) {
      const w = lastOptResult.winner;
      return {
        title: w.title,
        thumbnailConcept: w.thumbnailConcept,
        openingHook: w.openingHook,
        rationale: w.rationale,
        expectationMatch: w.expectationMatch,
        curiosityGap: w.curiosityGap,
        retentionPrediction: w.retentionPrediction,
        ctrPrediction: w.ctrPrediction,
        compositeScore: w.compositeScore,
      };
    }
    if (trifecta) {
      // Reconstruct from stored record; sub-scores may be embedded in expectationMatch string.
      const parsed = parseExpectationMatch(trifecta.expectationMatch);
      return {
        title: trifecta.title,
        thumbnailConcept: trifecta.thumbnailStrategy.concept,
        openingHook: trifecta.openingHook,
        rationale: trifecta.rationale,
        expectationMatch: parsed.expectationMatch,
        curiosityGap: parsed.curiosityGap,
        retentionPrediction: parsed.retentionPrediction,
        ctrPrediction: parsed.ctrPrediction,
        compositeScore: parsed.composite,
      };
    }
    return null;
  }, [lastOptResult, trifecta]);

  return (
    <div className="space-y-6">
      {/* ── Holy Trifecta optimizer ─────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-amber-200">
                Spark + Canvas · holy trifecta optimizer
              </span>
            </div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">Holy Trifecta</h2>
            <p className="mt-0.5 max-w-2xl text-xs text-muted-foreground">
              The title, thumbnail strategy and opening hook optimized as a single unit. Spark
              generates 4 candidates and scores them on expectation match, curiosity gap,
              retention and CTR — Canvas writes the thumbnail concept.
            </p>
          </div>
          <Button
            onClick={() => optimizeMut.mutate()}
            disabled={optimizeMut.isPending}
            className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
          >
            {optimizeMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : trifecta ? (
              <RefreshCw className="mr-2 h-4 w-4" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            {optimizeMut.isPending
              ? "Spark + Canvas are generating & scoring 4 trifecta candidates…"
              : trifecta
                ? "Re-optimize Holy Trifecta"
                : "Optimize Holy Trifecta"}
          </Button>
        </div>

        {optimizeMut.isPending && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
            <div className="text-xs text-amber-200">
              <p className="font-medium">Generating 4 candidate trifectas…</p>
              <p className="text-amber-200/70">
                Each candidate is scored on expectation match, curiosity gap, retention & CTR
                prediction · ~15–25s.
              </p>
            </div>
          </div>
        )}

        {trifectaQuery.isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : !winnerVM ? (
          <Card className="border-dashed border-border/60 bg-card/30 p-8 text-center text-sm text-muted-foreground">
            <Zap className="mx-auto h-6 w-6 text-amber-400" />
            <p className="mt-2">No Holy Trifecta yet — run the optimizer to begin.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Winner card */}
            <WinnerCard winner={winnerVM} voiceDNAUsed={voiceDNAUsed} />

            {/* All candidates (collapsible) */}
            {candidates && candidates.length > 0 && (
              <Accordion type="single" collapsible className="rounded-xl border border-border/60 bg-card/30">
                <AccordionItem value="candidates" className="border-0">
                  <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
                    <div className="flex items-center gap-2">
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      <span>All {candidates.length} candidates</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-t border-border/50 px-4 pb-3 pt-3">
                    <div className="space-y-2">
                      {candidates.map((c, i) => (
                        <CandidateRow
                          key={i}
                          candidate={c}
                          isWinner={
                            winnerVM.title === c.title && winnerVM.openingHook === c.openingHook
                          }
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        )}
      </section>

      {/* ── Thumbnail Director ──────────────────────────────────────── */}
      <section className="space-y-4 border-t border-border/50 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1">
              <ImageIcon className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-rose-200">
                Canvas · thumbnail director
              </span>
            </div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">Thumbnail briefs</h2>
            <p className="mt-0.5 max-w-2xl text-xs text-muted-foreground">
              Detailed briefs with visual layout, text overlay, emotional triggers, mobile
              readability and 3 AI generation prompts.
            </p>
          </div>
          <Button
            onClick={() => briefMut.mutate()}
            disabled={briefMut.isPending || !trifecta}
            variant="outline"
            className={cn(
              "border-rose-500/30 bg-rose-500/5 text-rose-200 hover:bg-rose-500/10",
              !trifecta && "cursor-not-allowed opacity-60",
            )}
            title={!trifecta ? "Run the Holy Trifecta optimizer first" : undefined}
          >
            {briefMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            {briefMut.isPending ? "Canvas is designing the brief…" : "Generate thumbnail brief"}
          </Button>
        </div>

        {!trifecta && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Run the Holy Trifecta optimizer first — Canvas builds the brief from the winning
            title & hook.
          </div>
        )}

        {thumbnailsQuery.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : briefs.length === 0 ? (
          <Card className="border-dashed border-border/60 bg-card/30 p-8 text-center text-sm text-muted-foreground">
            <ImageIcon className="mx-auto h-6 w-6 text-rose-400" />
            <p className="mt-2">No thumbnail briefs yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {briefs.map((brief, i) => (
              <ThumbnailBriefCard
                key={brief.id}
                brief={brief}
                index={i}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ── winner view-model + parsing ────────────────────────────────────── */

interface WinnerVM {
  title: string;
  thumbnailConcept: string;
  openingHook: string;
  rationale: string;
  expectationMatch: number | null;
  curiosityGap: number | null;
  retentionPrediction: number | null;
  ctrPrediction: number | null;
  compositeScore: number | null;
}

function parseExpectationMatch(
  raw: string,
): {
  expectationMatch: number | null;
  curiosityGap: number | null;
  retentionPrediction: number | null;
  ctrPrediction: number | null;
  composite: number | null;
} {
  // The backend stores the four sub-scores inside the expectationMatch string as
  // "expectationMatch: X, curiosityGap: Y, retentionPrediction: Z, ctrPrediction: W"
  // or similar. Try to extract numbers; fall back to null.
  const find = (key: string): number | null => {
    const re = new RegExp(`${key}\\s*[:\\-]?\\s*([0-9]+(?:\\.[0-9]+)?)`, "i");
    const m = raw?.match?.(re);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  };
  const e = find("expectationMatch") ?? find("expectation");
  const c = find("curiosityGap") ?? find("curiosity");
  const r = find("retentionPrediction") ?? find("retention");
  const k = find("ctrPrediction") ?? find("ctr");
  const valid = [e, c, r, k].filter((n): n is number => n != null);
  const composite =
    valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
  return {
    expectationMatch: e,
    curiosityGap: c,
    retentionPrediction: r,
    ctrPrediction: k,
    composite,
  };
}

/* ── winner card ────────────────────────────────────────────────────── */

function WinnerCard({ winner, voiceDNAUsed }: { winner: WinnerVM; voiceDNAUsed: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card/40 to-card/40 p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
          >
            <Crown className="mr-1 h-3 w-3" />
            Winning trifecta
          </Badge>
          {voiceDNAUsed && (
            <Badge
              variant="outline"
              className="border-violet-500/30 bg-violet-500/10 text-violet-300"
            >
              <Fingerprint className="mr-1 h-3 w-3" />
              Voice DNA applied
            </Badge>
          )}
          {winner.compositeScore != null && (
            <Badge
              variant="outline"
              className="ml-auto border-amber-500/30 bg-amber-500/10 font-mono text-amber-300"
            >
              composite {Math.round(winner.compositeScore)}/100
            </Badge>
          )}
        </div>

        <div className="relative mt-4 space-y-4">
          {/* Title */}
          <div>
            <p className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Type className="h-3 w-3" /> Title
            </p>
            <h3 className="text-xl font-semibold leading-tight tracking-tight lg:text-2xl">
              {winner.title}
            </h3>
          </div>

          {/* Thumbnail concept + opening hook */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/50 bg-background/40 p-3">
              <p className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <ImageIcon className="h-3 w-3" /> Thumbnail concept
              </p>
              <p className="text-xs leading-relaxed text-foreground/90">
                {winner.thumbnailConcept}
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/40 p-3">
              <p className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Quote className="h-3 w-3" /> Opening hook
              </p>
              <blockquote className="border-l-2 border-emerald-500/50 pl-3 text-xs italic leading-relaxed text-foreground/90">
                “{winner.openingHook}”
              </blockquote>
            </div>
          </div>

          {/* Prediction scores */}
          <ScoreGrid
            scores={{
              expectationMatch: winner.expectationMatch,
              curiosityGap: winner.curiosityGap,
              retentionPrediction: winner.retentionPrediction,
              ctrPrediction: winner.ctrPrediction,
            }}
          />

          {/* Rationale */}
          {winner.rationale && (
            <div className="rounded-lg border border-border/50 bg-background/40 p-3">
              <p className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Lightbulb className="h-3 w-3" /> Rationale
              </p>
              <p className="text-xs leading-relaxed text-foreground/90">{winner.rationale}</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

/* ── candidate row ──────────────────────────────────────────────────── */

function CandidateRow({
  candidate,
  isWinner,
}: {
  candidate: TrifectaCandidate;
  isWinner: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        isWinner
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-border/50 bg-background/40",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {isWinner && (
          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/15 text-emerald-300">
            <Crown className="mr-1 h-2.5 w-2.5" /> winner
          </Badge>
        )}
        <p className="flex-1 text-sm font-medium leading-tight">{candidate.title}</p>
        {candidate.compositeScore != null && (
          <Badge
            variant="outline"
            className={cn(
              "font-mono",
              candidate.compositeScore >= 80
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : candidate.compositeScore >= 65
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-300",
            )}
          >
            {Math.round(candidate.compositeScore)}
          </Badge>
        )}
      </div>
      <p className="mt-1.5 line-clamp-1 text-[11px] italic text-muted-foreground">
        “{candidate.openingHook}”
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <MiniScore label="expect" value={candidate.expectationMatch} />
        <MiniScore label="curiosity" value={candidate.curiosityGap} />
        <MiniScore label="retention" value={candidate.retentionPrediction} />
        <MiniScore label="ctr" value={candidate.ctrPrediction} />
      </div>
    </div>
  );
}

function MiniScore({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const color =
    v >= 80 ? "text-emerald-400" : v >= 65 ? "text-amber-400" : "text-rose-400";
  return (
    <div className="rounded border border-border/50 bg-background/60 px-1.5 py-1 text-center">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("font-mono text-xs font-semibold", color)}>{Math.round(v)}</p>
    </div>
  );
}

/* ── score grid (winner) ────────────────────────────────────────────── */

function ScoreGrid({
  scores,
}: {
  scores: {
    expectationMatch: number | null;
    curiosityGap: number | null;
    retentionPrediction: number | null;
    ctrPrediction: number | null;
  };
}) {
  const items = [
    { label: "Expectation match", value: scores.expectationMatch, hint: "Title ↔ thumbnail ↔ hook alignment" },
    { label: "Curiosity gap", value: scores.curiosityGap, hint: "Open loop strength" },
    { label: "Retention prediction", value: scores.retentionPrediction, hint: "First-30s hold" },
    { label: "CTR prediction", value: scores.ctrPrediction, hint: "Click-through likelihood" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((s) => (
        <ScoreBar key={s.label} label={s.label} value={s.value} hint={s.hint} />
      ))}
    </div>
  );
}

function ScoreBar({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | null;
  hint?: string;
}) {
  const v = value == null ? null : Math.max(0, Math.min(100, value));
  const color =
    v == null
      ? "bg-muted"
      : v >= 80
        ? "bg-emerald-500"
        : v >= 65
          ? "bg-amber-500"
          : "bg-rose-500";
  const text =
    v == null
      ? "text-muted-foreground"
      : v >= 80
        ? "text-emerald-400"
        : v >= 65
          ? "text-amber-400"
          : "text-rose-400";
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 p-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className={cn("font-mono text-xs font-semibold", text)}>
          {v == null ? "—" : Math.round(v)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border/40">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: v == null ? "0%" : `${v}%` }}
        />
      </div>
      {hint && <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ── thumbnail brief card ───────────────────────────────────────────── */

function ThumbnailBriefCard({
  brief,
  index,
}: {
  brief: ThumbnailBriefRecord;
  index: number;
}) {
  const qc = useQueryClient();
  const genMut = useMutation({
    mutationFn: () => api.generateThumbnailImage(brief.id),
    onSuccess: (res) => {
      toast.success("Thumbnail image generated");
      void res;
      qc.invalidateQueries({ queryKey: ["thumbnails", brief.projectId] });
      qc.invalidateQueries({ queryKey: ["project", brief.projectId] });
    },
    onError: (e: Error) => toast.error(e.message || "Image generation failed"),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Card className="overflow-hidden border-border/60 bg-card/40">
        <div className="border-b border-border/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3 text-rose-400" /> Concept
              </p>
              <p className="text-sm font-medium leading-relaxed text-foreground/90">
                {brief.concept}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={brief.status} />
              {brief.status === "generated" && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-300"
                >
                  <CheckCircle2 className="mr-1 h-2.5 w-2.5" /> image ready
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* If image generated, show it prominently */}
        {brief.generatedImageUrl && (
          <div className="border-b border-border/50 bg-background/40 p-4">
            <div className="relative overflow-hidden rounded-lg border border-border/60 bg-black">
              <img
                src={brief.generatedImageUrl}
                alt={brief.concept}
                className="aspect-video w-full object-cover"
              />
              <div className="absolute right-2 top-2">
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-black/70 text-emerald-300 backdrop-blur"
                >
                  <ImageIcon className="mr-1 h-2.5 w-2.5" /> AI generated
                </Badge>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                Generated by Canvas · {brief.aiPrompts?.[0]?.size ?? "1792×1024"}
              </p>
              <Button
                onClick={() => genMut.mutate()}
                disabled={genMut.isPending}
                size="sm"
                variant="outline"
                className="border-rose-500/30 bg-rose-500/5 text-rose-200 hover:bg-rose-500/10"
              >
                {genMut.isPending ? (
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-3 w-3" />
                )}
                Re-generate image
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-4 p-4 lg:grid-cols-2">
          {/* Visual layout */}
          <SubSection icon={Layout} accent="emerald" title="Visual layout">
            <div className="space-y-1.5">
              <KVRow k="Composition" v={brief.visualLayout.composition} />
              <KVRow k="Focal subject" v={brief.visualLayout.focalSubject} />
              <KVRow k="Background" v={brief.visualLayout.background} />
              <KVRow k="Depth" v={brief.visualLayout.depth} />
              <KVRow k="Rule of thirds" v={brief.visualLayout.ruleOfThirds} />
            </div>
          </SubSection>

          {/* Text overlay */}
          <SubSection icon={Type} accent="amber" title="Text overlay">
            <div className="space-y-1.5">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
                <p className="text-base font-bold leading-tight text-foreground">
                  {brief.textOverlay.text || "—"}
                </p>
              </div>
              <KVRow k="Font" v={brief.textOverlay.font} />
              <KVRow k="Size" v={brief.textOverlay.size} />
              <KVRow k="Position" v={brief.textOverlay.position} />
              <KVRow k="Contrast" v={brief.textOverlay.contrast} />
            </div>
          </SubSection>

          {/* Emotional triggers */}
          <SubSection icon={Eye} accent="rose" title="Emotional triggers">
            {brief.emotionalTriggers.length === 0 ? (
              <p className="text-xs text-muted-foreground">None specified.</p>
            ) : (
              <ul className="space-y-1.5">
                {brief.emotionalTriggers.map((t, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-border/50 bg-background/40 p-2"
                  >
                    <Badge
                      variant="outline"
                      className="mb-1 border-rose-500/30 bg-rose-500/10 text-[10px] text-rose-300"
                    >
                      {t.trigger}
                    </Badge>
                    <p className="text-xs leading-relaxed text-foreground/80">{t.how}</p>
                  </li>
                ))}
              </ul>
            )}
          </SubSection>

          {/* Color mood */}
          <SubSection icon={Palette} accent="emerald" title="Color mood">
            <div className="space-y-2">
              {brief.colorMood.palette && brief.colorMood.palette.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {brief.colorMood.palette.map((c, i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-md border border-border/60"
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                </div>
              )}
              <KVRow k="Mood" v={brief.colorMood.mood} />
              <KVRow k="Contrast" v={brief.colorMood.contrast} />
            </div>
          </SubSection>

          {/* Mobile readability */}
          <SubSection icon={Smartphone} accent="amber" title="Mobile readability">
            <div className="flex items-center gap-3">
              <ReadabilityGauge value={brief.mobileReadability} />
              <div className="flex-1">
                <p className="text-xs leading-relaxed text-foreground/90">
                  {brief.readabilityNotes}
                </p>
              </div>
            </div>
          </SubSection>

          {/* AI prompts */}
          <SubSection icon={Wand2} accent="violet" title="AI generation prompts" full>
            <div className="space-y-2">
              {brief.aiPrompts.map((p, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/50 bg-background/40 p-2.5"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="border-violet-500/30 bg-violet-500/10 text-[10px] text-violet-300"
                    >
                      {p.variant}
                    </Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">{p.size}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground/90">{p.prompt}</p>
                  {p.styleNotes && (
                    <p className="mt-1 text-[10px] italic text-muted-foreground">{p.styleNotes}</p>
                  )}
                </div>
              ))}
            </div>
          </SubSection>
        </div>

        {/* Generate image action */}
        {!brief.generatedImageUrl && (
          <div className="border-t border-border/50 p-4">
            <Button
              onClick={() => genMut.mutate()}
              disabled={genMut.isPending}
              className="w-full bg-rose-500 text-rose-950 hover:bg-rose-400"
            >
              {genMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-2 h-4 w-4" />
              )}
              {genMut.isPending ? "Canvas is rendering the thumbnail…" : "Generate thumbnail image"}
            </Button>
            {genMut.isPending && (
              <p className="mt-2 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-rose-400" />
                Calling image generation model · ~10–20s
              </p>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function ReadabilityGauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (v / 100) * circ;
  const color =
    v >= 80 ? "oklch(0.72 0.17 162)" : v >= 65 ? "oklch(0.78 0.16 80)" : "oklch(0.65 0.2 25)";
  return (
    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-sm font-semibold" style={{ color }}>
          {Math.round(v)}
        </span>
      </div>
    </div>
  );
}

/* ── shared sub-section + kv ─────────────────────────────────────────── */

function SubSection({
  icon: IconCmp,
  accent,
  title,
  full,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent: "emerald" | "amber" | "rose" | "violet";
  title: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  const accentCls =
    accent === "emerald"
      ? "bg-emerald-500/10 text-emerald-400"
      : accent === "amber"
        ? "bg-amber-500/10 text-amber-400"
        : accent === "rose"
          ? "bg-rose-500/10 text-rose-400"
          : "bg-violet-500/10 text-violet-300";
  return (
    <div className={cn(full && "lg:col-span-2")}>
      <div className="mb-2 flex items-center gap-2">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded", accentCls)}>
          <IconCmp className="h-3.5 w-3.5" />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      </div>
      <div className="max-h-60 overflow-y-auto scroll-thin pr-1">{children}</div>
    </div>
  );
}

function KVRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 py-1 last:border-0">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {k}
      </span>
      <span className="text-right text-xs text-foreground/90">{v || "—"}</span>
    </div>
  );
}
