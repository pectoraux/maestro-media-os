"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { MediaOSOverview } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Boxes,
  Brain,
  Layers,
  Plug,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Fingerprint,
  Cpu,
  Store,
  Compass,
  Activity,
} from "lucide-react";

/* ── main view ──────────────────────────────────────────────────────── */

export function MediaOSView() {
  const { setView } = useApp();
  const { data, isLoading } = useQuery<MediaOSOverview>({
    queryKey: ["os-overview"],
    queryFn: api.getOSOverview,
    refetchInterval: 30_000,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Header />

      {isLoading || !data ? (
        <Skeletons />
      ) : (
        <>
          {/* Stat grid */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Boxes}
              label="Total capabilities"
              value={data.capabilityCount}
              sub="across every category"
              accent="bg-emerald-500/20 text-emerald-400"
              delay={0.05}
            />
            <StatCard
              icon={Store}
              label="Extensions installed"
              value={`${data.installedExtensionCount}/${data.extensionCount}`}
              sub="capability bundles active"
              accent="bg-amber-500/20 text-amber-400"
              delay={0.1}
            />
            <StatCard
              icon={Plug}
              label="Connected channels"
              value={`${data.connectedChannelCount}/${data.channelCount}`}
              sub="distribution surface"
              accent="bg-teal-500/20 text-teal-300"
              delay={0.15}
            />
            <StatCard
              icon={ShieldCheck}
              label="Identity authenticity"
              value={`${Math.round(data.identityAuthenticity * 100)}%`}
              sub="creator captured"
              accent={
                data.identityAuthenticity >= 0.8
                  ? "bg-emerald-500/20 text-emerald-400"
                  : data.identityAuthenticity >= 0.5
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-rose-500/20 text-rose-400"
              }
              delay={0.2}
            />
          </section>

          {/* 5-layer architecture + category chart */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="lg:col-span-3"
            >
              <ArchitectureStack overview={data} onOpenMarketplace={() => setView("marketplace")} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
              className="lg:col-span-2"
            >
              <CategoryChart overview={data} />
            </motion.div>
          </div>

          {/* Active plans + authenticity principle */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.3 }}
              className="lg:col-span-1"
            >
              <Card className="h-full border-border/60 bg-card/40 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Compass className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Director AI activity</h3>
                    <p className="text-[11px] text-muted-foreground">live compiled plans</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl font-semibold tracking-tight text-emerald-300">
                    {data.activePlans}
                  </span>
                  <span className="text-xs text-muted-foreground">in flight</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  The Director takes a creative intent and dynamically composes capabilities into a
                  production plan — no hardcoded pipelines.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => setView("director")}
                >
                  <Compass className="mr-1 h-3.5 w-3.5" /> Open Director AI
                </Button>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.35 }}
              className="lg:col-span-2"
            >
              <AuthenticityCallout
                authenticity={data.identityAuthenticity}
                onOpenIdentity={() => setView("identity")}
              />
            </motion.div>
          </div>
        </>
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
          <Cpu className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-300">
            AI Media Operating System
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">Media OS</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground lg:text-base">
          An operating system where humans direct creative work and AI performs production work
          across every media format. YouTube is the first channel — not the product.
        </p>
      </div>
    </motion.section>
  );
}

/* ── stat card (matches dashboard StatCard pattern) ──────────────────── */

function StatCard({
  icon: IconCmp,
  label,
  value,
  sub,
  accent,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className="relative overflow-hidden border-border/60 bg-card/50 p-5">
        <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl", accent)} />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 font-mono text-3xl font-semibold tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={cn("rounded-lg p-2", accent.replace(/blur-2xl|rounded-full/g, ""))}>
            <IconCmp className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ── 5-layer architecture stack ─────────────────────────────────────── */

interface LayerDef {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  accent: string;
  ring: string;
  countLabel: (o: MediaOSOverview) => { count: number; label: string };
}

const LAYERS: LayerDef[] = [
  {
    name: "Intelligence Kernel",
    icon: Brain,
    description:
      "Continuous signal gathering — trends, competitor analysis, audience shifts, knowledge graph memory.",
    accent: "bg-emerald-500/15 text-emerald-300",
    ring: "border-emerald-500/30",
    countLabel: () => ({ count: 4, label: "signal sources" }),
  },
  {
    name: "Capability Registry",
    icon: Boxes,
    description:
      "Everything the OS can do is a capability. Discovery, generation, editing, distribution — all addressable.",
    accent: "bg-amber-500/15 text-amber-300",
    ring: "border-amber-500/30",
    countLabel: (o) => ({ count: o.capabilityCount, label: "capabilities" }),
  },
  {
    name: "Extension Marketplace",
    icon: Store,
    description:
      "Installable capability bundles. Voice cloning, video generation, editing suites — add new powers on demand.",
    accent: "bg-violet-500/15 text-violet-300",
    ring: "border-violet-500/30",
    countLabel: (o) => ({
      count: o.installedExtensionCount,
      label: `of ${o.extensionCount} installed`,
    }),
  },
  {
    name: "Experience Layer",
    icon: Compass,
    description:
      "The Director AI + workflow compiler. Translates creative intent into a plan by composing capabilities.",
    accent: "bg-emerald-500/15 text-emerald-300",
    ring: "border-emerald-500/30",
    countLabel: (o) => ({ count: o.activePlans, label: "active plans" }),
  },
  {
    name: "Output Connectors",
    icon: Plug,
    description:
      "One production pipeline, many outputs. YouTube is the first channel — connect TikTok, podcasts, blogs, more.",
    accent: "bg-teal-500/15 text-teal-300",
    ring: "border-teal-500/30",
    countLabel: (o) => ({
      count: o.connectedChannelCount,
      label: `of ${o.channelCount} connected`,
    }),
  },
];

function ArchitectureStack({
  overview,
  onOpenMarketplace,
}: {
  overview: MediaOSOverview;
  onOpenMarketplace: () => void;
}) {
  return (
    <Card className="relative h-full overflow-hidden border-border/60 bg-card/40 p-5">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-semibold">5-Layer architecture</h2>
          </div>
          <Button size="sm" variant="ghost" onClick={onOpenMarketplace} className="text-muted-foreground">
            Marketplace <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="space-y-2">
          {LAYERS.map((layer, i) => {
            const { count, label } = layer.countLabel(overview);
            const LayerIcon = layer.icon;
            return (
              <motion.div
                key={layer.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * i }}
                className="relative"
              >
                {/* Connecting line */}
                {i < LAYERS.length - 1 && (
                  <div className="absolute left-[22px] top-[52px] z-0 h-[calc(100%-12px)] w-px bg-gradient-to-b from-border/60 to-transparent" />
                )}
                <div
                  className={cn(
                    "relative z-10 flex items-start gap-3 rounded-xl border bg-background/40 p-3 transition-colors hover:bg-background/60",
                    layer.ring,
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      layer.accent,
                    )}
                  >
                    <LayerIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          L{i + 1}
                        </span>
                        <h3 className="text-sm font-semibold">{layer.name}</h3>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("font-mono text-[10px]", layer.accent, layer.ring)}
                      >
                        <Activity className="mr-1 h-2.5 w-2.5" /> {count} {label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {layer.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

/* ── capabilities by category chart ─────────────────────────────────── */

const CATEGORY_COLORS: Record<string, string> = {
  intelligence: "bg-emerald-500",
  creative: "bg-amber-500",
  production: "bg-rose-500",
  distribution: "bg-teal-500",
  learning: "bg-violet-500",
  identity: "bg-emerald-400",
  safety: "bg-rose-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  intelligence: "Intelligence",
  creative: "Creative",
  production: "Production",
  distribution: "Distribution",
  learning: "Learning",
  identity: "Identity",
  safety: "Safety",
};

function CategoryChart({ overview }: { overview: MediaOSOverview }) {
  const cats = overview.capabilitiesByCategory ?? [];
  const max = Math.max(1, ...cats.map((c) => c.count));
  return (
    <Card className="h-full border-border/60 bg-card/40 p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
          <Boxes className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Capabilities by category</h3>
          <p className="text-[11px] text-muted-foreground">distribution across the registry</p>
        </div>
      </div>

      {cats.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground">
          No capabilities registered.
        </div>
      ) : (
        <div className="space-y-3">
          {cats.map((c, i) => {
            const color = CATEGORY_COLORS[c.category] ?? "bg-muted";
            const label = CATEGORY_LABELS[c.category] ?? c.category;
            const pct = (c.count / max) * 100;
            return (
              <motion.div
                key={c.category}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * i }}
              >
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{label}</span>
                  <span className="font-mono text-muted-foreground">{c.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-border/40">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 + 0.05 * i, ease: "easeOut" }}
                    className={cn("h-full rounded-full", color)}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border/40 pt-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Intelligence
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Creative
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" /> Production
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-teal-500" /> Distribution
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-violet-500" /> Learning
        </div>
      </div>
    </Card>
  );
}

/* ── authenticity principle callout ─────────────────────────────────── */

function AuthenticityCallout({
  authenticity,
  onOpenIdentity,
}: {
  authenticity: number;
  onOpenIdentity: () => void;
}) {
  const pct = Math.round(authenticity * 100);
  const tone =
    authenticity >= 0.8
      ? "border-emerald-500/40 bg-emerald-500/5"
      : authenticity >= 0.5
        ? "border-amber-500/40 bg-amber-500/5"
        : "border-rose-500/40 bg-rose-500/5";
  const toneText =
    authenticity >= 0.8
      ? "text-emerald-300"
      : authenticity >= 0.5
        ? "text-amber-300"
        : "text-rose-300";
  return (
    <Card className={cn("h-full border-border/60 p-5", tone)}>
      <div className="flex h-full flex-col">
        <div className="mb-3 flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              tone,
              toneText,
            )}
          >
            <Fingerprint className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">The authenticity principle</h3>
            <p className="text-[11px] text-muted-foreground">why this is not "another AI tool"</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-foreground/90">
          <span className="font-semibold text-foreground">AI should imitate YOU</span>, not imitate
          ANYONE. Every output is grounded in the Creator Identity — beliefs, experiences, stories,
          frameworks, vocabulary. The model conforms to the creator, not the other way around.
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-border/50" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className={toneText}
                strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
              />
            </svg>
            <span className={cn("absolute font-mono text-[11px] font-semibold", toneText)}>
              {pct}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium">Identity authenticity</p>
            <p className="text-[11px] text-muted-foreground">
              how completely the creator is captured
            </p>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <Button
            size="sm"
            onClick={onOpenIdentity}
            className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
          >
            <Sparkles className="mr-1 h-3.5 w-3.5" /> Open Creator Identity
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ── skeletons ──────────────────────────────────────────────────────── */

function Skeletons() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Skeleton className="h-[480px] w-full lg:col-span-3" />
        <Skeleton className="h-[480px] w-full lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full lg:col-span-2" />
      </div>
    </div>
  );
}
