"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreatorIdentityRecord } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Fingerprint,
  Compass,
  Heart,
  BookOpen,
  Quote,
  Layers,
  Lightbulb,
  Smile,
  ShieldCheck,
  BookMarked,
  Ban,
  Eye,
} from "lucide-react";

/* ── main view ──────────────────────────────────────────────────────── */

export function IdentityView() {
  const { data, isLoading } = useQuery({
    queryKey: ["identity"],
    queryFn: api.getIdentity,
  });

  const identity = data?.identity ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Header />

      {isLoading ? (
        <Skeletons />
      ) : !identity ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {/* Authenticity hero + mission */}
          <div className="grid gap-6 lg:grid-cols-3">
            <AuthenticityHero identity={identity} />
            <MissionCard identity={identity} />
          </div>

          {/* Principle banner */}
          <PrincipleBanner />

          {/* Identity dimensions grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <BeliefsCard identity={identity} delay={0.05} />
            <ExperiencesCard identity={identity} delay={0.1} />
            <StoriesCard identity={identity} delay={0.15} />
            <FrameworksCard identity={identity} delay={0.2} />
            <AnalogiesCard identity={identity} delay={0.25} />
            <HumorCard identity={identity} delay={0.3} />
            <ValuesCard identity={identity} delay={0.35} />
            <VocabularyCard identity={identity} delay={0.4} />
            <AudienceExpectationsCard identity={identity} delay={0.45} />
          </div>
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
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/40 to-transparent p-6 lg:p-8"
    >
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative max-w-3xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
          <Fingerprint className="h-3.5 w-3.5 text-emerald-300" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-200">
            Creator Identity Engine
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">Creator Identity</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground lg:text-base">
          The unified identity layer. Every generated script is grounded in this identity — beliefs,
          experiences, stories, frameworks, values, vocabulary. AI imitates THIS creator, not a
          generic model.
        </p>
      </div>
    </motion.section>
  );
}

/* ── empty state ─────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-border/60 bg-card/40 p-8 lg:p-12">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
            <Fingerprint className="h-8 w-8 text-emerald-300" />
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-tight">No identity captured yet</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            The Creator Identity Engine reads every interview, script draft and creator note to
            extract a unified profile — beliefs, experiences, stories, frameworks, vocabulary — that
            every generation is grounded in.
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
            Run a creator interview or seed a profile to populate the identity.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

/* ── authenticity hero (radial gauge) ───────────────────────────────── */

function AuthenticityHero({ identity }: { identity: CreatorIdentityRecord }) {
  const pct = Math.max(0, Math.min(1, identity.authenticityScore));
  const display = Math.round(pct * 100);
  const color =
    pct >= 0.8
      ? "oklch(0.72 0.17 162)"
      : pct >= 0.5
        ? "oklch(0.78 0.16 80)"
        : "oklch(0.65 0.2 25)";
  const toneClass =
    pct >= 0.8
      ? "border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-card/40 to-card/40"
      : pct >= 0.5
        ? "border-amber-500/25 bg-gradient-to-br from-amber-500/15 via-card/40 to-card/40"
        : "border-rose-500/25 bg-gradient-to-br from-rose-500/15 via-card/40 to-card/40";

  const r = 70;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="lg:col-span-1"
    >
      <Card className={cn("relative h-full overflow-hidden border-border/60 p-6", toneClass)}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-3 flex w-full items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-300">
              Identity authenticity
            </span>
          </div>

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
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-3xl font-semibold" style={{ color }}>
                {display}
                <span className="text-base">%</span>
              </span>
              <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                captured
              </span>
            </div>
          </div>

          <p className="mt-4 max-w-[230px] text-xs leading-relaxed text-muted-foreground">
            How completely the creator&apos;s identity is captured. The Director AI grounds every
            plan in this profile.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

/* ── mission card ───────────────────────────────────────────────────── */

function MissionCard({ identity }: { identity: CreatorIdentityRecord }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="lg:col-span-2"
    >
      <Card className="h-full border-border/60 bg-card/40 p-6">
        <div className="mb-3 flex items-center gap-2">
          <Compass className="h-4 w-4 text-emerald-400" />
          <h2 className="text-base font-semibold">Mission</h2>
        </div>
        {identity.mission ? (
          <blockquote className="border-l-2 border-emerald-500/50 bg-emerald-500/5 py-3 pl-4 pr-3 text-base italic leading-relaxed text-foreground/90 lg:text-lg">
            “{identity.mission}”
          </blockquote>
        ) : (
          <p className="text-sm text-muted-foreground">No mission statement captured.</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Beliefs" value={identity.beliefs.length} />
          <MiniStat label="Experiences" value={identity.experiences.length} />
          <MiniStat label="Stories" value={identity.stories.length} />
          <MiniStat label="Frameworks" value={identity.frameworks.length} />
        </div>
      </Card>
    </motion.div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold text-emerald-300">{value}</p>
    </div>
  );
}

/* ── principle banner ───────────────────────────────────────────────── */

function PrincipleBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card/40 to-amber-500/10 p-6 text-center lg:p-8">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative">
          <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-300">
            The authenticity principle
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight lg:text-3xl">
            AI should imitate <span className="text-gradient-emerald">YOU</span>.
            <br className="hidden sm:block" /> Not imitate <span className="text-rose-300">ANYONE</span>.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            The model conforms to the creator, not the other way around. Every output — script,
            scene, caption — is grounded in this identity layer.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

/* ── shared dimension card ──────────────────────────────────────────── */

function DimensionCard({
  icon: IconCmp,
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
            <IconCmp className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

/* ── beliefs ────────────────────────────────────────────────────────── */

function BeliefsCard({ identity, delay }: { identity: CreatorIdentityRecord; delay: number }) {
  return (
    <DimensionCard icon={Heart} accent="bg-rose-500/10 text-rose-400" title="Beliefs" delay={delay}>
      {identity.beliefs.length === 0 ? (
        <Empty label="No beliefs captured." />
      ) : (
        <ul className="space-y-3">
          {identity.beliefs.map((b, i) => {
            const v = Math.max(0, Math.min(1, b.strength));
            const color =
              v >= 0.8 ? "bg-emerald-500" : v >= 0.5 ? "bg-amber-500" : "bg-rose-500";
            return (
              <li key={i}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="text-foreground/90">{b.belief}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {Math.round(v * 100)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border/40">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${v * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.1 + 0.05 * i, ease: "easeOut" }}
                    className={cn("h-full rounded-full", color)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DimensionCard>
  );
}

/* ── experiences ────────────────────────────────────────────────────── */

function ExperiencesCard({ identity, delay }: { identity: CreatorIdentityRecord; delay: number }) {
  return (
    <DimensionCard icon={Layers} accent="bg-amber-500/10 text-amber-400" title="Experiences" delay={delay}>
      {identity.experiences.length === 0 ? (
        <Empty label="No experiences captured." />
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto scroll-thin pr-1">
          {identity.experiences.map((e, i) => (
            <div
              key={i}
              className="rounded-lg border border-border/50 bg-background/40 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground/90">{e.area}</span>
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 font-mono text-[10px] text-amber-300">
                  {e.years}y
                </Badge>
              </div>
              {e.notable && (
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {e.notable}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </DimensionCard>
  );
}

/* ── stories ────────────────────────────────────────────────────────── */

function StoriesCard({ identity, delay }: { identity: CreatorIdentityRecord; delay: number }) {
  return (
    <DimensionCard icon={BookOpen} accent="bg-emerald-500/10 text-emerald-400" title="Stories" delay={delay}>
      {identity.stories.length === 0 ? (
        <Empty label="No stories captured." />
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto scroll-thin pr-1">
          {identity.stories.map((s, i) => (
            <div key={i} className="rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h4 className="text-xs font-semibold text-foreground/90">{s.title}</h4>
                {s.themeTag && (
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-300">
                    {s.themeTag}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{s.summary}</p>
            </div>
          ))}
        </div>
      )}
    </DimensionCard>
  );
}

/* ── frameworks ─────────────────────────────────────────────────────── */

function FrameworksCard({ identity, delay }: { identity: CreatorIdentityRecord; delay: number }) {
  return (
    <DimensionCard icon={Compass} accent="bg-violet-500/10 text-violet-300" title="Frameworks" delay={delay}>
      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
        The mental models the creator uses to reason about the world.
      </p>
      {identity.frameworks.length === 0 ? (
        <Empty label="No frameworks captured." />
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto scroll-thin pr-1">
          {identity.frameworks.map((f, i) => (
            <div key={i} className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
              <h4 className="text-xs font-semibold text-foreground/90">{f.name}</h4>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      )}
    </DimensionCard>
  );
}

/* ── analogies ──────────────────────────────────────────────────────── */

function AnalogiesCard({ identity, delay }: { identity: CreatorIdentityRecord; delay: number }) {
  return (
    <DimensionCard icon={Lightbulb} accent="bg-amber-500/10 text-amber-400" title="Analogies" delay={delay}>
      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
        The recurring analogies the creator uses to explain complex ideas.
      </p>
      {identity.analogies.length === 0 ? (
        <Empty label="No analogies captured." />
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {identity.analogies.map((a, i) => (
            <Badge
              key={i}
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-300"
            >
              {a}
            </Badge>
          ))}
        </div>
      )}
    </DimensionCard>
  );
}

/* ── humor ──────────────────────────────────────────────────────────── */

function HumorCard({ identity, delay }: { identity: CreatorIdentityRecord; delay: number }) {
  const h = identity.humor;
  return (
    <DimensionCard icon={Smile} accent="bg-amber-500/10 text-amber-400" title="Humor" delay={delay}>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <StatRow label="Style" value={h.style} />
        <StatRow label="Frequency" value={h.frequency} />
      </div>
      {h.examples && h.examples.length > 0 ? (
        <div className="max-h-44 space-y-2 overflow-y-auto scroll-thin pr-1">
          {h.examples.map((e, i) => (
            <blockquote
              key={i}
              className="rounded-r-lg border-l-2 border-amber-500/50 bg-amber-500/5 py-1.5 pl-3 pr-2 text-[11px] italic leading-relaxed text-foreground/90"
            >
              “{e}”
            </blockquote>
          ))}
        </div>
      ) : (
        <Empty label="No humor examples captured." />
      )}
    </DimensionCard>
  );
}

/* ── values ─────────────────────────────────────────────────────────── */

function ValuesCard({ identity, delay }: { identity: CreatorIdentityRecord; delay: number }) {
  return (
    <DimensionCard icon={ShieldCheck} accent="bg-emerald-500/10 text-emerald-400" title="Values" delay={delay}>
      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
        Non-negotiable principles. Every output must honor these.
      </p>
      {identity.values.length === 0 ? (
        <Empty label="No values captured." />
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {identity.values.map((v, i) => (
            <Badge
              key={i}
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-300"
            >
              <ShieldCheck className="mr-1 h-2.5 w-2.5" /> {v}
            </Badge>
          ))}
        </div>
      )}
    </DimensionCard>
  );
}

/* ── vocabulary ─────────────────────────────────────────────────────── */

function VocabularyCard({ identity, delay }: { identity: CreatorIdentityRecord; delay: number }) {
  const v = identity.vocabulary;
  return (
    <DimensionCard icon={BookMarked} accent="bg-amber-500/10 text-amber-400" title="Vocabulary" delay={delay}>
      <div className="space-y-3">
        <ChipGroup
          label="Signature phrases"
          items={v.signaturePhrases}
          variant="emerald"
          icon={Quote}
        />
        <ChipGroup label="Favorite words" items={v.favoriteWords} variant="amber" />
        <ChipGroup label="Avoided terms" items={v.avoidedTerms} variant="rose" icon={Ban} />
      </div>
    </DimensionCard>
  );
}

/* ── audience expectations ──────────────────────────────────────────── */

function AudienceExpectationsCard({
  identity,
  delay,
}: {
  identity: CreatorIdentityRecord;
  delay: number;
}) {
  const a = identity.audienceExpectations;
  return (
    <DimensionCard icon={Eye} accent="bg-emerald-500/10 text-emerald-400" title="Audience expectations" delay={delay}>
      <div className="space-y-3">
        <ExpectationRow label="What they come for" value={a.whatTheyComeFor} tone="emerald" />
        <ExpectationRow label="What they trust" value={a.whatTheyTrust} tone="emerald" />
        <ExpectationRow label="What they reject" value={a.whatTheyReject} tone="rose" />
      </div>
    </DimensionCard>
  );
}

/* ── shared small components ────────────────────────────────────────── */

function Empty({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground">
      {label}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-medium text-foreground/90">{value}</p>
    </div>
  );
}

function ChipGroup({
  label,
  items,
  variant,
  icon: IconCmp,
}: {
  label: string;
  items: string[];
  variant: "emerald" | "amber" | "rose";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const cls =
    variant === "rose"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
      : variant === "amber"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {items.length === 0 ? (
        <span className="text-xs text-muted-foreground">None captured.</span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((s, i) => (
            <Badge key={`${s}-${i}`} variant="outline" className={cn("text-[11px]", cls)}>
              {IconCmp && <IconCmp className="mr-1 h-2.5 w-2.5" />}
              {s}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpectationRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose";
}) {
  const cls =
    tone === "rose"
      ? "border-rose-500/30 bg-rose-500/5"
      : "border-emerald-500/30 bg-emerald-500/5";
  const dot = tone === "rose" ? "bg-rose-400" : "bg-emerald-400";
  return (
    <div className={cn("rounded-lg border p-3", cls)}>
      <div className="mb-1 flex items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="text-xs leading-relaxed text-foreground/90">{value}</p>
    </div>
  );
}

/* ── skeletons ──────────────────────────────────────────────────────── */

function Skeletons() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full lg:col-span-2" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    </div>
  );
}
