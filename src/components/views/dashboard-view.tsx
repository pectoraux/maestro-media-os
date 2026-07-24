"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Icon } from "@/components/icon";
import { useApp } from "@/lib/store";
import { AGENT_MAP } from "@/lib/agents-registry";
import {
  FolderKanban,
  ClipboardCheck,
  Network,
  Eye,
  TrendingUp,
  Radar,
  ArrowRight,
  Sparkles,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-2 font-mono text-3xl font-semibold tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={cn("rounded-lg p-2", accent.replace(/blur-2xl|rounded-full/, ""))}>
            <IconCmp className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function DashboardView() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard, refetchInterval: 20_000 });
  const { setView, openProject } = useApp();
  const projectsQuery = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });
  const approvalsQuery = useQuery({ queryKey: ["approvals", "pending"], queryFn: () => api.listApprovals("pending") });

  const pendingGates = approvalsQuery.data?.approvals ?? [];
  const projects = projectsQuery.data?.projects ?? [];
  const activeProjects = projects.filter((p) => !["archived", "live"].includes(p.status)).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/40 to-transparent p-6 lg:p-8"
      >
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-300">
                15 Agents · 1 Maestro
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
              Your creator operating system is{" "}
              <span className="text-gradient-emerald">live</span>.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground lg:text-base">
              Maestro orchestrates research, drafting, packaging and analysis across a team of
              specialized AI agents. Every stage pauses for your approval — the AI handles the work,
              you remain the strategist, expert and storyteller.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => setView("opportunities")} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
                <Radar className="mr-2 h-4 w-4" /> Discover an opportunity
              </Button>
              <Button variant="outline" onClick={() => setView("workspace")}>
                <FolderKanban className="mr-2 h-4 w-4" /> Open a project
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Stat grid */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          label="Active projects"
          value={data?.projectCount ?? "—"}
          sub="across the production pipeline"
          accent="bg-emerald-500/20 text-emerald-400"
          delay={0.05}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Pending approvals"
          value={data?.pendingApprovals ?? "—"}
          sub="awaiting your decision"
          accent="bg-amber-500/20 text-amber-400"
          delay={0.1}
        />
        <StatCard
          icon={Network}
          label="Knowledge nodes"
          value={data?.knowledgeNodeCount ?? "—"}
          sub="persistent intelligence graph"
          accent="bg-rose-500/20 text-rose-400"
          delay={0.15}
        />
        <StatCard
          icon={Eye}
          label="Total views"
          value={data ? (data.totalViews / 1000).toFixed(0) + "K" : "—"}
          sub={`avg CTR ${data?.avgCTR?.toFixed(1) ?? "—"}%`}
          accent="bg-emerald-500/20 text-emerald-400"
          delay={0.2}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active projects */}
        <Card className="min-w-0 lg:col-span-2 border-border/60 bg-card/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">In-flight productions</h2>
              <p className="text-xs text-muted-foreground">Projects moving through the pipeline</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setView("workspace")} className="text-muted-foreground">
              All projects <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-2">
            {isLoading || activeProjects.length === 0 ? (
              <EmptyRow label="No active projects yet — discover an opportunity to begin." />
            ) : (
              activeProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openProject(p.id)}
                  className="group flex w-full items-center gap-4 rounded-xl border border-border/50 bg-background/40 p-3 text-left transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-amber-500/20">
                    <Icon name="Workflow" className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.niche}</p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    {p.opportunityScore && (
                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 font-mono text-emerald-300">
                        {Math.round(p.opportunityScore)}
                      </Badge>
                    )}
                    <StatusBadge status={p.stage} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Pending approvals */}
        <Card className="border-border/60 bg-card/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Approval queue</h2>
              <p className="text-xs text-muted-foreground">Human-in-the-loop gates</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setView("approvals")} className="text-muted-foreground">
              Review <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-2">
            {pendingGates.length === 0 ? (
              <EmptyRow label="No pending approvals. The pipeline is clear." />
            ) : (
              pendingGates.slice(0, 5).map((g) => {
                const agent = AGENT_MAP[g.agentType];
                return (
                  <button
                    key={g.id}
                    onClick={() => openProject(g.projectId)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-left transition-all hover:border-amber-500/40"
                  >
                    {agent && <Icon name={agent.icon} className={cn("h-4 w-4 shrink-0", agent.color)} />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{g.payload.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{g.projectTitle}</p>
                    </div>
                    <StatusBadge status={g.status} className="shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Recent opportunities + agent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Latest opportunities</h2>
            <Button variant="ghost" size="sm" onClick={() => setView("opportunities")} className="text-muted-foreground">
              <Radar className="mr-1 h-3.5 w-3.5" /> Hunt more
            </Button>
          </div>
          <div className="space-y-2">
            {(data?.recentOpportunities ?? []).length === 0 ? (
              <EmptyRow label="No opportunities discovered yet." />
            ) : (
              data!.recentOpportunities.slice(0, 4).map((o) => (
                <button
                  key={o.id}
                  onClick={() => openProject(o.projectId)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-border/50 bg-background/40 p-3 text-left transition-all hover:border-emerald-500/40"
                >
                  <ScoreRing score={o.opportunityScore} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{o.niche} · {(o.angle ?? "").slice(0, 60)}</p>
                  </div>
                  <StatusBadge status={o.confidence} className="shrink-0" />
                </button>
              ))
            )}
          </div>
        </Card>

        <Card className="border-border/60 bg-card/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Agent activity</h2>
            <Button variant="ghost" size="sm" onClick={() => setView("agents")} className="text-muted-foreground">
              <TrendingUp className="mr-1 h-3.5 w-3.5" /> Roster
            </Button>
          </div>
          <div className="space-y-2">
            {(data?.agentActivity ?? []).length === 0 ? (
              <EmptyRow label="No agent runs yet." />
            ) : (
              data!.agentActivity.slice(0, 6).map((r) => {
                const agent = AGENT_MAP[r.agentType];
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 p-3"
                  >
                    {agent && <Icon name={agent.icon} className={cn("h-4 w-4 shrink-0", agent.color)} />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {agent?.name ?? r.agentType} <span className="text-muted-foreground">· {agent?.role}</span>
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {timeAgo(r.createdAt)} · {Math.round((r as any).durationMs / 100) / 10}s
                      </p>
                    </div>
                    <StatusBadge status={r.status} className="shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const v = Math.max(0, Math.min(100, score));
  const color = v >= 80 ? "text-emerald-400" : v >= 65 ? "text-amber-400" : "text-rose-400";
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
      <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
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
      <span className={cn("absolute font-mono text-[11px] font-semibold", color)}>{Math.round(v)}</span>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
      {label}
    </div>
  );
}
