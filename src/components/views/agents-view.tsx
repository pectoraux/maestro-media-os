"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type AgentRosterItem } from "@/lib/api";
import { AGENTS, AGENT_MAP } from "@/lib/agents-registry";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowDown,
  RefreshCw,
  Activity,
  Clock,
  Hash,
  ShieldCheck,
} from "lucide-react";

/* ── helpers ─────────────────────────────────────────────────────────── */

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
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

function statusDot(status: AgentRosterItem["status"]): string {
  switch (status) {
    case "running":
      return "bg-amber-400 animate-pulse-dot";
    case "failed":
      return "bg-rose-400";
    case "succeeded":
      return "bg-emerald-400";
    default:
      return "bg-muted-foreground/50";
  }
}

/* ── collaboration flow chips ────────────────────────────────────────── */

const FLOW: { name: string; type: string; label: string }[] = [
  { name: "Atlas", type: "opportunity_hunter", label: "Opportunity" },
  { name: "Sage", type: "research_analyst", label: "Research" },
  { name: "Verity", type: "story_architect", label: "Story" },
  { name: "Quill", type: "script_writer", label: "Script" },
  { name: "Lex", type: "fact_checker", label: "Fact-check" },
  { name: "Spark", type: "hook_engineer", label: "Hook" },
  { name: "Canvas", type: "thumbnail_director", label: "Thumbnail" },
  { name: "Beacon", type: "seo_specialist", label: "SEO" },
  { name: "Caster", type: "publishing_manager", label: "Publish" },
  { name: "Prism", type: "analytics_scientist", label: "Analytics" },
  { name: "Mnemos", type: "knowledge_curator", label: "Curate" },
];

/* ── view ──────────────────────────────────────────────────────────── */

export function AgentsView() {
  const { data, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: api.agentRoster,
    refetchInterval: 15_000,
  });

  const roster: AgentRosterItem[] = data?.agents ?? [];

  // Build a quick lookup of live status by agent type.
  const liveByType: Record<string, AgentRosterItem> = {};
  for (const r of roster) liveByType[r.type] = r;

  const chief = AGENTS.find((a) => a.type === "chief_director")!;
  const others = AGENTS.filter((a) => a.type !== "chief_director");

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-2"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-300">
            12 Agents · 1 Maestro
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Agent Roster</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          A team of specialized AI agents, coordinated by Maestro. Each operates in its domain; every
          output passes your approval.
        </p>
      </motion.section>

      {/* Chief Creative Director feature card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <Card className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-card/40 to-card/40 p-6 lg:p-8">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-amber-400 shadow-lg shadow-emerald-500/30">
              <Icon name={chief.icon} className="h-8 w-8 text-black" />
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
                  {chief.name}
                </h2>
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                >
                  {chief.role}
                </Badge>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Live orchestrator
                </span>
              </div>

              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Maestro orchestrates the full production pipeline — routing work between specialized
                agents, maintaining narrative coherence across stages, and enforcing the human-in-the-loop
                approval gates that keep you in command. It does not write scripts or pick thumbnails;
                it ensures the right specialist does, at the right time, with your sign-off.
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {chief.capabilities.map((cap) => (
                  <div
                    key={cap}
                    className="flex items-start gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-2.5"
                  >
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span className="text-xs text-foreground/90">{cap}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* Roster grid */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-base font-semibold">Specialized agents</h2>
            <p className="text-xs text-muted-foreground">
              Each owns a domain. Hover for detail · status refreshes every 15s.
            </p>
          </div>
          {isLoading && (
            <span className="text-[11px] text-muted-foreground">
              <Activity className="mr-1 inline h-3 w-3 animate-pulse" />
              syncing status…
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {others.map((agent, i) => {
            const live = liveByType[agent.type];
            const status = live?.status ?? "idle";
            const lastRun = live?.lastRunAt ?? null;
            const runCount = live?.runCount ?? 0;
            return (
              <motion.div
                key={agent.type}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 + i * 0.04 }}
              >
                <Card
                  className={cn(
                    "group relative h-full overflow-hidden border-border/60 bg-card/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5",
                  )}
                >
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-500/20 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <div className="relative flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/60",
                      )}
                    >
                      <Icon name={agent.icon} className={cn("h-5 w-5", agent.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">{agent.name}</h3>
                        <span
                          className={cn("h-1.5 w-1.5 rounded-full", statusDot(status))}
                          title={status}
                        />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{agent.role}</p>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-1.5">
                    {agent.capabilities.slice(0, 4).map((cap) => (
                      <li key={cap} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                        <span className={cn("mt-1 h-1 w-1 shrink-0 rounded-full", agent.color)} />
                        <span className="leading-relaxed">{cap}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        status === "running" && "border-amber-500/30 bg-amber-500/10 text-amber-300",
                        status === "failed" && "border-rose-500/30 bg-rose-500/10 text-rose-300",
                        status === "succeeded" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                        status === "idle" && "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      {status}
                    </Badge>
                    <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(lastRun)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {runCount}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Collaboration flow */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Card className="border-border/60 bg-card/40 p-6">
          <div className="mb-4 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-semibold">How they collaborate</h2>
          </div>
          <p className="mb-5 text-xs text-muted-foreground">
            A continuous loop — every published video makes the next opportunity smarter. The Holy Trifecta
            (Hook Engineer + Thumbnail Director) ship together as one unit.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {FLOW.map((step, i) => {
              const agent = AGENT_MAP[step.type];
              const isTrifectaStart = step.type === "hook_engineer";
              const isTrifectaEnd = step.type === "thumbnail_director";
              return (
                <div key={step.type} className="flex items-center gap-2">
                  {isTrifectaStart && (
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-300">
                      Holy Trifecta
                    </span>
                  )}
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5",
                      isTrifectaStart && "rounded-r-none border-r-0",
                      isTrifectaEnd && "rounded-l-none border-l-0",
                    )}
                  >
                    {agent && <Icon name={agent.icon} className={cn("h-3.5 w-3.5", agent.color)} />}
                    <div className="flex flex-col leading-tight">
                      <span className="text-[11px] font-medium">{step.name}</span>
                      <span className="text-[9px] text-muted-foreground">{step.label}</span>
                    </div>
                  </div>
                  {i < FLOW.length - 1 && (
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 sm:block" />
                  )}
                  {i === FLOW.length - 1 && (
                    <>
                      <ArrowDown className="h-3.5 w-3.5 shrink-0 rotate-90 text-emerald-400 sm:hidden" />
                      <div className="hidden items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 sm:flex">
                        <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[10px] font-medium text-emerald-300">feeds back</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile feedback chip */}
          <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 sm:hidden">
            <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] font-medium text-emerald-300">
              Mnemos feeds insights back to Atlas → next opportunity
            </span>
          </div>
        </Card>
      </motion.section>
    </div>
  );
}
