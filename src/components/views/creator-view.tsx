"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  UserRound,
  Gauge,
  MessageSquare,
  Timer,
  BookOpen,
  Sparkles,
  Quote,
  Info,
  CheckCircle2,
} from "lucide-react";

/* ── view ──────────────────────────────────────────────────────────── */

export function CreatorView() {
  const { data, isLoading } = useQuery({
    queryKey: ["creator"],
    queryFn: api.creator,
  });

  const profile = data?.profile ?? null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-16 w-72" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 w-full lg:col-span-1" />
          <Skeleton className="h-64 w-full lg:col-span-2" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-7xl">
        <Header />
        <Card className="mt-8 flex flex-col items-center justify-center gap-4 border-border/60 bg-card/40 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-background/50">
            <UserRound className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold">No creator profile yet</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Maestro builds your voice profile from creator interviews and published work. Run an
              interview on a project, or publish your first video — the profile will appear here.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const distinctPct = Math.round(profile.distinctivenessScore * 100);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Header />

      {/* Note banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <p className="text-xs leading-relaxed text-foreground/90">
          This profile is learned from your interviews and published work. Every project refines it.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Distinctiveness hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="lg:col-span-1"
        >
          <Card className="relative h-full overflow-hidden border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-card/40 to-card/40 p-6">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-3 flex items-center gap-2 self-start">
                <Gauge className="h-4 w-4 text-emerald-400" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-300">
                  Voice distinctiveness
                </span>
              </div>

              <DistinctivenessGauge value={distinctPct} />

              <p className="mt-4 max-w-[220px] text-xs leading-relaxed text-muted-foreground">
                How distinguishable your voice is from generic AI output. Higher means more
                recognizable as <span className="text-foreground">you</span>.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Voice profile */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="h-full border-border/60 bg-card/40 p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-semibold">Voice profile</h2>
            </div>

            <div className="space-y-3">
              <VoiceRow icon="MessageSquare" label="Tone" value={profile.voiceProfile.tone} />
              <VoiceRow icon="Timer" label="Pacing" value={profile.voiceProfile.pacing} />
              <VoiceRow icon="BookOpen" label="Vocabulary" value={profile.voiceProfile.vocabulary} />
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Signatures
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.voiceProfile.signatures.length === 0 ? (
                  <span className="text-xs text-muted-foreground">None captured yet.</span>
                ) : (
                  profile.voiceProfile.signatures.map((s) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    >
                      {s}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Style guidelines + Recurring themes */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <Card className="h-full border-border/60 bg-card/40 p-6">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <h2 className="text-base font-semibold">Style guidelines</h2>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Editorial rules the agents follow when drafting on your behalf.
            </p>
            <ol className="space-y-2.5">
              {profile.styleGuidelines.map((rule, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500/15 font-mono text-[10px] font-semibold text-amber-300">
                    {i + 1}
                  </span>
                  <span className="text-xs leading-relaxed text-foreground/90">{rule}</span>
                </li>
              ))}
            </ol>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <Card className="h-full border-border/60 bg-card/40 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-semibold">Recurring themes</h2>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Subjects Maestro sees you return to across projects.
            </p>
            {profile.recurringThemes.length === 0 ? (
              <span className="text-xs text-muted-foreground">No themes captured yet.</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.recurringThemes.map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="border-border/60 bg-background/50 text-foreground/90"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        </motion.section>
      </div>

      {/* Expertise */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        <Card className="border-border/60 bg-card/40 p-6">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-semibold">Expertise</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Area</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground">Depth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profile.expertise.map((e, i) => {
                const isExpert = e.depth.toLowerCase() === "expert";
                return (
                  <TableRow key={i} className="border-border/50">
                    <TableCell className="text-sm font-medium">{e.area}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize",
                          isExpert
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-300",
                        )}
                      >
                        {e.depth}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </motion.section>

      {/* Tone samples */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
      >
        <Card className="border-border/60 bg-card/40 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Quote className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-semibold">Tone samples</h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Quoted excerpts used as voice anchors during drafting.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.toneSamples.map((s, i) => (
              <blockquote
                key={i}
                className="rounded-r-lg border-l-2 border-emerald-500/50 bg-emerald-500/5 py-2.5 pl-4 pr-3 text-sm italic leading-relaxed text-foreground/90"
              >
                “{s}”
              </blockquote>
            ))}
          </div>
        </Card>
      </motion.section>
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
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
        <UserRound className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-300">
          The human stays the storyteller
        </span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Creator Profile</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Maestro continuously learns your voice, expertise and recurring themes — so drafts sound like
        you, not a model.
      </p>
    </motion.section>
  );
}

/* ── distinctiveness gauge ──────────────────────────────────────────── */

function DistinctivenessGauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const r = 70;
  const circ = 2 * Math.PI * r;
  const dash = (v / 100) * circ;
  const color =
    v >= 75 ? "oklch(0.72 0.17 162)" : v >= 50 ? "oklch(0.78 0.16 80)" : "oklch(0.65 0.2 25)";
  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <svg className="h-44 w-44 -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="oklch(1 0 0 / 0.08)"
          strokeWidth="10"
        />
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
          {v}%
        </span>
        <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          distinct
        </span>
      </div>
    </div>
  );
}

/* ── voice row ──────────────────────────────────────────────────────── */

function VoiceRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
        <Icon name={icon} className="h-4 w-4 text-emerald-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-foreground/90">{value}</p>
      </div>
    </div>
  );
}
