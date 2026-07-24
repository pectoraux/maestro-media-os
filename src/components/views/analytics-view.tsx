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
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  BarChart3,
  BarChart2,
  TrendingUp,
  Eye,
  DollarSign,
  Trophy,
  Lightbulb,
  RefreshCw,
  ArrowRight,
  Target,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

/* ── chart colors ───────────────────────────────────────────────────── */

const C = {
  emerald: "oklch(0.72 0.17 162)",
  amber: "oklch(0.78 0.16 80)",
  rose: "oklch(0.65 0.2 25)",
  teal: "oklch(0.7 0.15 200)",
  violet: "oklch(0.72 0.16 305)",
};
const PIE_COLORS = [C.emerald, C.amber, C.rose, C.teal, C.violet];

const tooltipStyle = {
  background: "oklch(0.2 0.008 264)",
  border: "1px solid oklch(1 0 0 / 0.1)",
  borderRadius: 8,
  fontSize: 12,
};

/* ── formatters ─────────────────────────────────────────────────────── */

function fmtViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}
function fmtMoney(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}
function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/* ── stat card ──────────────────────────────────────────────────────── */

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

/* ── learning loop chips ────────────────────────────────────────────── */

const LOOP = [
  { label: "Publish", icon: "Send" },
  { label: "Prism · Analytics", icon: "LineChart" },
  { label: "Lessons", icon: "Lightbulb" },
  { label: "Mnemos · Curate", icon: "BrainCircuit" },
  { label: "Knowledge graph", icon: "Network" },
  { label: "Next opportunity", icon: "Radar" },
];

/* ── view ──────────────────────────────────────────────────────────── */

export function AnalyticsView() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: api.analytics,
  });
  const { openProject } = useApp();

  const metrics = data?.metrics ?? [];
  const agg = data?.aggregates;
  const lessons = data?.lessons ?? [];

  // Bar chart data
  const ctrData = metrics.map((m) => ({
    name: truncate(m.projectTitle ?? m.projectId, 16),
    full: m.projectTitle ?? m.projectId,
    ctr: Number(m.ctr.toFixed(2)),
    id: m.projectId,
  }));
  const retData = metrics.map((m) => ({
    name: truncate(m.projectTitle ?? m.projectId, 16),
    full: m.projectTitle ?? m.projectId,
    retention: Number(m.retention.toFixed(1)),
    id: m.projectId,
  }));

  // Traffic sources pie — use best video's traffic if available, else aggregate.
  const bestMetric = agg?.bestProject
    ? metrics.find((m) => m.projectId === agg.bestProject!.id)
    : metrics[0];
  const trafficData = (bestMetric?.trafficSources ?? []).map((t) => ({
    name: t.source,
    value: Number((t.share * 100).toFixed(1)),
  }));

  // Line chart: cumulative views by record date.
  const sortedByDate = [...metrics].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );
  const viewsData = sortedByDate.reduce<
    { date: string; views: number }[]
  >((acc, m) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].views : 0;
    acc.push({ date: fmtDate(m.recordedAt), views: prev + m.views });
    return acc;
  }, []);

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
          <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-300">
            Learning loop · live
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Performance & Learning</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Maestro analyzes every published video and feeds lessons back into the knowledge graph.
        </p>
      </motion.section>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <>
          {/* Stat row */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Target}
              label="Avg CTR"
              value={agg ? fmtPct(agg.avgCTR) : "—"}
              sub={`across ${metrics.length} published`}
              accent="bg-emerald-500/20 text-emerald-400"
              delay={0.05}
            />
            <StatCard
              icon={Clock}
              label="Avg retention"
              value={agg ? `${Math.round(agg.avgRetention)}%` : "—"}
              sub="first-30-day window"
              accent="bg-amber-500/20 text-amber-400"
              delay={0.1}
            />
            <StatCard
              icon={Eye}
              label="Total views"
              value={agg ? fmtViews(agg.totalViews) : "—"}
              sub="all published videos"
              accent="bg-emerald-500/20 text-emerald-400"
              delay={0.15}
            />
            <StatCard
              icon={DollarSign}
              label="Total revenue"
              value={agg ? fmtMoney(agg.totalRevenue) : "—"}
              sub="estimated earnings"
              accent="bg-rose-500/20 text-rose-400"
              delay={0.2}
            />
          </section>

          {/* Best video callout */}
          {agg?.bestProject && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card/40 to-card/40 p-5">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/20 blur-3xl" />
                <div className="relative flex flex-wrap items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
                    <Trophy className="h-6 w-6 text-black" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-amber-300">
                      Best performing
                    </p>
                    <p className="truncate text-base font-semibold">{agg.bestProject.title}</p>
                  </div>
                  <div className="flex items-center gap-4 font-mono">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CTR</p>
                      <p className="text-lg font-semibold text-emerald-400">{fmtPct(agg.bestProject.ctr)}</p>
                    </div>
                    <button
                      onClick={() => openProject(agg.bestProject!.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-xs font-medium transition-colors hover:border-amber-500/40 hover:text-amber-300"
                    >
                      Open <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.section>
          )}

          {/* Charts grid */}
          <section className="grid gap-6 lg:grid-cols-2">
            {/* CTR bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              <Card className="border-border/60 bg-card/40 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">CTR per video</h2>
                    <p className="text-xs text-muted-foreground">click-through rate by published video</p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                {ctrData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={ctrData} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "oklch(0.68 0.012 264)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-12}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis
                        tick={{ fill: "oklch(0.68 0.012 264)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
                      <Bar dataKey="ctr" fill={C.emerald} radius={[4, 4, 0, 0]} name="CTR %" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </motion.div>

            {/* Retention bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
            >
              <Card className="border-border/60 bg-card/40 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Retention per video</h2>
                    <p className="text-xs text-muted-foreground">average view retention</p>
                  </div>
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                {retData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={retData} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "oklch(0.68 0.012 264)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-12}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis
                        tick={{ fill: "oklch(0.68 0.012 264)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
                      <Bar dataKey="retention" fill={C.amber} radius={[4, 4, 0, 0]} name="Retention %" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </motion.div>

            {/* Traffic pie */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
            >
              <Card className="border-border/60 bg-card/40 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Traffic sources</h2>
                    <p className="text-xs text-muted-foreground">
                      {bestMetric ? `for “${truncate(bestMetric.projectTitle ?? bestMetric.projectId, 24)}”` : "no data"}
                    </p>
                  </div>
                  <BarChart2 className="h-4 w-4 text-rose-400" />
                </div>
                {trafficData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={trafficData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={2}
                        stroke="oklch(0.16 0.006 264)"
                        strokeWidth={2}
                      >
                        {trafficData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: number) => `${v}%`}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 10, color: "oklch(0.68 0.012 264)" }}
                        iconType="circle"
                        iconSize={8}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </motion.div>

            {/* Cumulative views line */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
            >
              <Card className="border-border/60 bg-card/40 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Cumulative views</h2>
                    <p className="text-xs text-muted-foreground">running total across published videos</p>
                  </div>
                  <Eye className="h-4 w-4 text-emerald-400" />
                </div>
                {viewsData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={viewsData} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "oklch(0.68 0.012 264)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: "oklch(0.68 0.012 264)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => fmtViews(v)}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke={C.teal}
                        strokeWidth={2}
                        dot={{ r: 3, fill: C.teal }}
                        activeDot={{ r: 5 }}
                        name="Views"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </motion.div>
          </section>

          {/* Learned lessons */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <Card className="border-border/60 bg-card/40 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-emerald-400" />
                <h2 className="text-base font-semibold">What Maestro learned</h2>
                <Badge variant="outline" className="ml-auto border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                  {lessons.length} lessons
                </Badge>
              </div>
              {lessons.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
                  No lessons extracted yet. They appear after Maestro analyzes a published video.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {lessons.map((lesson, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                        <Lightbulb className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <p className="text-xs leading-relaxed text-foreground/90">{lesson}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.section>

          {/* Learning loop explainer */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
          >
            <Card className="border-border/60 bg-card/40 p-5">
              <div className="mb-4 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-emerald-400" />
                <h2 className="text-base font-semibold">The learning loop</h2>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Each publish closes one cycle and seeds the next — every video leaves the system smarter
                than it found it.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {LOOP.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5">
                      <Icon name={step.icon} className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-[11px] font-medium">{step.label}</span>
                    </div>
                    {i < LOOP.length - 1 && (
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    )}
                    {i === LOOP.length - 1 && (
                      <RefreshCw className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </motion.section>

          {/* Published videos table */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <Card className="border-border/60 bg-card/40 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Published videos</h2>
                  <p className="text-xs text-muted-foreground">Click a row to open the project workspace</p>
                </div>
                <Badge variant="outline" className="font-mono">
                  {metrics.length} records
                </Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Title</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">CTR</TableHead>
                    <TableHead className="hidden text-xs uppercase tracking-wider text-muted-foreground sm:table-cell">Retention</TableHead>
                    <TableHead className="hidden text-xs uppercase tracking-wider text-muted-foreground sm:table-cell">Views</TableHead>
                    <TableHead className="hidden text-xs uppercase tracking-wider text-muted-foreground md:table-cell">Revenue</TableHead>
                    <TableHead className="hidden text-xs uppercase tracking-wider text-muted-foreground md:table-cell">Recorded</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                        No published videos with metrics yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    metrics.map((m) => (
                      <TableRow
                        key={m.id}
                        onClick={() => openProject(m.projectId)}
                        className="cursor-pointer border-border/50"
                      >
                        <TableCell className="max-w-[200px] truncate text-sm font-medium">
                          {m.projectTitle ?? m.projectId}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-emerald-400">
                          {fmtPct(m.ctr)}
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-amber-400 sm:table-cell">
                          {Math.round(m.retention)}%
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs sm:table-cell">
                          {fmtViews(m.views)}
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-rose-400 md:table-cell">
                          {fmtMoney(m.revenue)}
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                          {fmtDate(m.recordedAt)}
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </motion.section>
        </>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground">
      No data yet
    </div>
  );
}
