"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { VoiceDNARecord } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Fingerprint,
  Gauge,
  PenLine,
  BookOpen,
  Layers,
  Smile,
  Timer,
  Settings2,
  HeartPulse,
  Sparkles,
  RefreshCw,
  Loader2,
  Quote,
  Database,
  Info,
} from "lucide-react";

/* ── main view ──────────────────────────────────────────────────────── */

export function VoiceDnaView() {
  const qc = useQueryClient();
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["voice-dna"],
    queryFn: api.getVoiceDNA,
  });

  const extractMut = useMutation({
    mutationFn: api.extractVoiceDNA,
    onSuccess: (res) => {
      toast.success(`Voice DNA extracted · uniqueness ${res.voiceDNA.uniquenessScore}/100`);
      qc.invalidateQueries({ queryKey: ["voice-dna"] });
    },
    onError: (e: Error) => toast.error(e.message || "Voice DNA extraction failed"),
  });

  const voiceDNA = data?.voiceDNA ?? null;
  const extracting = extractMut.isPending;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Header />

      {isLoading ? (
        <Skeletons />
      ) : !voiceDNA ? (
        <EmptyState
          onExtract={() => extractMut.mutate()}
          extracting={extracting}
          error={extractMut.error ? (extractMut.error as Error).message : null}
        />
      ) : (
        <div className="space-y-8">
          {/* Uniqueness hero + actions */}
          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="lg:col-span-1"
            >
              <Card className="relative h-full overflow-hidden border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-card/40 to-card/40 p-6">
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="relative flex flex-col items-center text-center">
                  <div className="mb-3 flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-emerald-400" />
                      <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-300">
                        Voice distinctiveness
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 font-mono text-[10px] text-emerald-300"
                    >
                      {voiceDNA.sampleCount} sample{voiceDNA.sampleCount === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  <UniquenessGauge value={voiceDNA.uniquenessScore} />

                  <p className="mt-4 max-w-[230px] text-xs leading-relaxed text-muted-foreground">
                    How distinguishable your voice is from generic AI output. Higher means more
                    recognizable as <span className="text-foreground">you</span>.
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* Re-extract + summary card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="flex h-full flex-col justify-between border-border/60 bg-card/40 p-6">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <h2 className="text-base font-semibold">Echo voice profile</h2>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Echo continuously models your writing style, vocabulary, storytelling patterns,
                    humor, pacing, content preferences and emotional tone — every dimension of how
                    you communicate. The profile is rebuilt from all your creator interviews and
                    script drafts, so it sharpens as you produce more.
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <DimensionStat label="Dimensions" value="7" />
                    <DimensionStat label="Samples" value={String(voiceDNA.sampleCount)} />
                    <DimensionStat
                      label="Uniqueness"
                      value={`${voiceDNA.uniquenessScore}/100`}
                      accent="emerald"
                    />
                    <DimensionStat
                      label="Updated"
                      value={timeAgo(voiceDNA.createdAt)}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => extractMut.mutate()}
                    disabled={extracting}
                    className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                  >
                    {extracting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {extracting ? "Echo is re-extracting…" : "Re-extract Voice DNA"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Re-run after new interviews or scripts to refresh the profile.
                  </span>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* 7-dimension grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <WritingStyleCard data={voiceDNA.writingStyle} delay={0.15} />
            <VocabularyCard data={voiceDNA.vocabulary} delay={0.18} />
            <StorytellingCard data={voiceDNA.storytellingPatterns} delay={0.21} />
            <HumorCard data={voiceDNA.humor} delay={0.24} />
            <PacingCard data={voiceDNA.pacing} delay={0.27} />
            <ContentPrefsCard data={voiceDNA.contentPreferences} delay={0.3} />
            <EmotionalToneCard data={voiceDNA.emotionalTone} delay={0.33} />
            <SourceSamplesCard samples={voiceDNA.sourceSamples} delay={0.36} />
          </div>
        </div>
      )}

      {isFetching && !isLoading && voiceDNA && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
          refreshing…
        </div>
      )}
    </div>
  );
}

/* ── header ─────────────────────────────────────────────────────────── */

function Header() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-2"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1">
        <Fingerprint className="h-3.5 w-3.5 text-violet-300" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-violet-200">
          The human stays the storyteller
        </span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Voice DNA</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Echo analyzes your interviews & scripts to model your writing style, vocabulary, storytelling
        patterns, humor, pacing and emotional tone — so every draft sounds like you.
      </p>
    </motion.section>
  );
}

/* ── empty state ─────────────────────────────────────────────────────── */

function EmptyState({
  onExtract,
  extracting,
  error,
}: {
  onExtract: () => void;
  extracting: boolean;
  error: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-border/60 bg-card/40 p-8 lg:p-12">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10">
            <Fingerprint className="h-8 w-8 text-violet-300" />
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-tight">No voice profile yet</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Echo scans every creator interview and script draft in the system — extracting
            statistical patterns, signature phrasings, humor signatures and emotional cadence — to
            build a 7-dimension voice model. Extraction takes 8–15 seconds and runs once. Re-run it
            any time after new interviews or scripts land.
          </p>

          <Button
            onClick={onExtract}
            disabled={extracting}
            className="mt-6 bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
          >
            {extracting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {extracting ? "Echo is reading your work…" : "Extract Voice DNA"}
          </Button>

          {extracting && (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-violet-400" />
              Reading interviews + scripts · building 7-dimension model · ~10s
            </p>
          )}

          {error && (
            <div className="mt-4 max-w-md rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-start gap-2 rounded-lg border border-border/60 bg-background/40 p-3 text-left">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              You don't need a project selected — Echo reads across all your work to find the
              through-line of your voice.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ── uniqueness gauge (matches creator-view distinctiveness gauge) ──── */

function UniquenessGauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const r = 70;
  const circ = 2 * Math.PI * r;
  const dash = (v / 100) * circ;
  const color =
    v >= 75 ? "oklch(0.72 0.17 162)" : v >= 50 ? "oklch(0.78 0.16 80)" : "oklch(0.65 0.2 25)";
  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <svg className="h-44 w-44 -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-3xl font-semibold" style={{ color }}>
          {v}
        </span>
        <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          /100
        </span>
      </div>
    </div>
  );
}

/* ── small shared card primitive ─────────────────────────────────────── */

function DimensionCard({
  icon,
  accent,
  title,
  delay,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className="h-full border-border/60 bg-card/40 p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", accent)}>
            {(() => {
              const I = icon;
              return <I className="h-4 w-4" />;
            })()}
          </div>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 py-2 last:border-0">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-xs font-medium text-foreground/90">{value}</span>
    </div>
  );
}

function Chips({
  items,
  variant = "default",
}: {
  items: string[];
  variant?: "default" | "rose" | "amber" | "emerald";
}) {
  if (!items || items.length === 0) {
    return <span className="text-xs text-muted-foreground">None captured.</span>;
  }
  const cls =
    variant === "rose"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
      : variant === "amber"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : variant === "emerald"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-border/60 bg-background/50 text-foreground/90";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s, i) => (
        <Badge key={`${s}-${i}`} variant="outline" className={cn("text-[11px]", cls)}>
          {s}
        </Badge>
      ))}
    </div>
  );
}

function ListGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {!items || items.length === 0 ? (
        <p className="text-xs text-muted-foreground">None captured.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/90">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DimensionStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "amber";
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-sm font-semibold",
          accent === "emerald" ? "text-emerald-300" : accent === "amber" ? "text-amber-300" : "",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/* ── dimension cards ─────────────────────────────────────────────────── */

function WritingStyleCard({
  data,
  delay,
}: {
  data: VoiceDNARecord["writingStyle"];
  delay: number;
}) {
  return (
    <DimensionCard icon={PenLine} accent="bg-emerald-500/10 text-emerald-400" title="Writing Style" delay={delay}>
      <div className="space-y-0.5">
        <StatRow label="Avg sentence length" value={data.avgSentenceLength} />
        <StatRow label="Structure" value={data.structure} />
        <StatRow label="Complexity" value={data.complexity} />
        <StatRow label="Register" value={data.register} />
      </div>
    </DimensionCard>
  );
}

function VocabularyCard({
  data,
  delay,
}: {
  data: VoiceDNARecord["vocabulary"];
  delay: number;
}) {
  return (
    <DimensionCard icon={BookOpen} accent="bg-amber-500/10 text-amber-400" title="Vocabulary" delay={delay}>
      <div className="space-y-3">
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Signature phrases
          </p>
          <Chips items={data.signaturePhrases} variant="emerald" />
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Favorite words
          </p>
          <Chips items={data.favoriteWords} variant="amber" />
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Jargon
          </p>
          <Chips items={data.jargon} />
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Avoided terms
          </p>
          <Chips items={data.avoidedTerms} variant="rose" />
        </div>
      </div>
    </DimensionCard>
  );
}

function StorytellingCard({
  data,
  delay,
}: {
  data: VoiceDNARecord["storytellingPatterns"];
  delay: number;
}) {
  return (
    <DimensionCard icon={Layers} accent="bg-violet-500/10 text-violet-300" title="Storytelling Patterns" delay={delay}>
      <div className="grid gap-3 sm:grid-cols-2">
        <ListGroup title="Openings" items={data.openings} />
        <ListGroup title="Callbacks" items={data.callbacks} />
        <ListGroup title="Frameworks" items={data.frameworks} />
        <ListGroup title="Transitions" items={data.transitions} />
      </div>
    </DimensionCard>
  );
}

function HumorCard({ data, delay }: { data: VoiceDNARecord["humor"]; delay: number }) {
  return (
    <DimensionCard icon={Smile} accent="bg-amber-500/10 text-amber-400" title="Humor" delay={delay}>
      <div className="space-y-0.5">
        <StatRow label="Style" value={data.style} />
        <StatRow label="Frequency" value={data.frequency} />
        <StatRow label="Type" value={data.type} />
      </div>
      {data.examples && data.examples.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Examples
          </p>
          <div className="max-h-32 space-y-2 overflow-y-auto scroll-thin pr-1">
            {data.examples.map((e, i) => (
              <blockquote
                key={i}
                className="rounded-r-lg border-l-2 border-amber-500/50 bg-amber-500/5 py-1.5 pl-3 pr-2 text-xs italic leading-relaxed text-foreground/90"
              >
                “{e}”
              </blockquote>
            ))}
          </div>
        </div>
      )}
    </DimensionCard>
  );
}

function PacingCard({ data, delay }: { data: VoiceDNARecord["pacing"]; delay: number }) {
  return (
    <DimensionCard icon={Timer} accent="bg-emerald-500/10 text-emerald-400" title="Pacing" delay={delay}>
      <div className="space-y-0.5">
        <StatRow label="Words / minute" value={data.wordsPerMinute} />
        <StatRow label="Pause pattern" value={data.pausePattern} />
        <StatRow label="Section length" value={data.sectionLength} />
        <StatRow label="Rhythm" value={data.rhythm} />
      </div>
    </DimensionCard>
  );
}

function ContentPrefsCard({
  data,
  delay,
}: {
  data: VoiceDNARecord["contentPreferences"];
  delay: number;
}) {
  return (
    <DimensionCard icon={Settings2} accent="bg-amber-500/10 text-amber-400" title="Content Preferences" delay={delay}>
      <div className="space-y-3">
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Preferred formats
          </p>
          <Chips items={data.preferredFormats} variant="amber" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatRow label="Ideal length" value={data.idealLength} />
          <StatRow label="Structure" value={data.structurePreference} />
          <StatRow label="Depth level" value={data.depthLevel} />
        </div>
      </div>
    </DimensionCard>
  );
}

function EmotionalToneCard({
  data,
  delay,
}: {
  data: VoiceDNARecord["emotionalTone"];
  delay: number;
}) {
  return (
    <DimensionCard icon={HeartPulse} accent="bg-rose-500/10 text-rose-400" title="Emotional Tone" delay={delay}>
      <div className="space-y-0.5">
        <StatRow label="Default tone" value={data.defaultTone} />
        <StatRow label="Range" value={data.range} />
        <StatRow label="Shifts" value={data.shifts} />
        <StatRow label="Intensity" value={data.intensity} />
      </div>
    </DimensionCard>
  );
}

function SourceSamplesCard({
  samples,
  delay,
}: {
  samples: VoiceDNARecord["sourceSamples"];
  delay: number;
}) {
  return (
    <DimensionCard icon={Database} accent="bg-emerald-500/10 text-emerald-400" title="Source samples" delay={delay}>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        Provenance — where Echo drew each sample from.
      </p>
      {!samples || samples.length === 0 ? (
        <span className="text-xs text-muted-foreground">No source provenance recorded.</span>
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto scroll-thin pr-1">
          {samples.map((s, i) => (
            <div
              key={i}
              className="rounded-lg border border-border/50 bg-background/40 p-3"
            >
              <div className="mb-1 flex items-center gap-2">
                <Quote className="h-3 w-3 text-emerald-400" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.from}
                </span>
              </div>
              <p className="line-clamp-3 text-xs italic leading-relaxed text-foreground/80">
                “{s.excerpt}”
              </p>
            </div>
          ))}
        </div>
      )}
    </DimensionCard>
  );
}

/* ── helpers + skeletons ──────────────────────────────────────────────── */

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

function Skeletons() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  );
}
