"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Loader2,
  Users,
  Hourglass,
  CheckCircle2,
  Gauge,
  Search,
  Check,
  X,
  Info,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  country: string | null;
  occupation: string | null;
  skills: string[];
  goals: string[];
  targetPlatforms: string[];
  preferredFormats: string[];
  readinessScore: number;
  readinessBreakdown: Record<string, number>;
  position: number;
  status: string;
  createdAt: string;
  approvedAt: string | null;
}

type Filter = "all" | "waitlisted" | "approved" | "rejected";

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-rose-400";
}
function scoreBg(score: number) {
  if (score >= 80) return "bg-emerald-500/10 border-emerald-500/40";
  if (score >= 50) return "bg-amber-500/10 border-amber-500/40";
  return "bg-rose-500/10 border-rose-500/40";
}
function statusBadge(status: string) {
  switch (status) {
    case "approved":
      return (
        <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-[10px] uppercase tracking-wide text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-[10px] uppercase tracking-wide text-rose-300">
          <X className="h-3 w-3" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-[10px] uppercase tracking-wide text-amber-300">
          <Hourglass className="h-3 w-3" />
          Waitlisted
        </Badge>
      );
  }
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export default function AdminPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/waitlist", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login?redirect=/admin");
          return;
        }
        if (res.status === 403) {
          router.replace("/app");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setEntries((data?.entries ?? []) as WaitlistEntry[]);
      } catch {
        if (!cancelled) setError("Couldn't load waitlist entries.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function approve(id: string) {
    setActingId(id);
    try {
      const res = await fetch(`/api/waitlist/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Approve failed");
      setEntries((cur) =>
        cur.map((e) => (e.id === id ? { ...e, status: "approved", approvedAt: new Date().toISOString() } : e)),
      );
      toast.success("Creator approved", {
        description: "They can now access their Maestro dashboard.",
      });
    } catch (err) {
      toast.error("Approve failed", { description: (err as Error).message });
    } finally {
      setActingId(null);
    }
  }

  async function reject(id: string) {
    setActingId(id);
    try {
      const res = await fetch(`/api/waitlist/${id}/reject`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Reject failed");
      setEntries((cur) => cur.map((e) => (e.id === id ? { ...e, status: "rejected" } : e)));
      toast.success("Creator rejected", {
        description: "Their access has been suspended.",
      });
    } catch (err) {
      toast.error("Reject failed", { description: (err as Error).message });
    } finally {
      setActingId(null);
    }
  }

  function requestInfo(e: WaitlistEntry) {
    toast("Info request queued", {
      description: `${e.name || e.email} will be prompted to complete more of their profile.`,
    });
  }

  const stats = useMemo(() => {
    const total = entries.length;
    const waitlisted = entries.filter((e) => e.status === "waitlisted").length;
    const approved = entries.filter((e) => e.status === "approved").length;
    const rejected = entries.filter((e) => e.status === "rejected").length;
    const avg = total === 0 ? 0 : Math.round(entries.reduce((s, e) => s + e.readinessScore, 0) / total);
    return { total, waitlisted, approved, rejected, avg };
  }, [entries]);

  const filtered = useMemo(() => {
    let list = entries;
    if (filter !== "all") list = list.filter((e) => e.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (e) =>
          (e.name ?? "").toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          (e.occupation ?? "").toLowerCase().includes(q) ||
          (e.country ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [entries, filter, query]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          Loading approval queue…
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-40 right-0 h-[32rem] w-[32rem] rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-[11px] uppercase tracking-[0.16em] text-emerald-300"
            >
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Approval queue
            </Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Waitlist Approval Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Review creator profiles, prioritize by readiness score, and decide who gets access to Maestro.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <StatCard icon={Users} label="Total applicants" value={stats.total} accent="text-emerald-400" />
          <StatCard icon={Hourglass} label="Waitlisted" value={stats.waitlisted} accent="text-amber-400" />
          <StatCard icon={CheckCircle2} label="Approved" value={stats.approved} accent="text-emerald-400" />
          <StatCard icon={Gauge} label="Avg readiness" value={stats.avg} suffix="/100" accent="text-violet-400" />
        </motion.div>

        {error && (
          <div className="mb-5 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="waitlisted">Waitlisted</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, role…"
              className="bg-input/40 pl-9"
            />
          </div>
        </motion.div>

        {/* List */}
        {filtered.length === 0 ? (
          <Card className="border-border/60 bg-card/40 p-12 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {entries.length === 0
                ? "No applicants yet. The waitlist is empty."
                : "No entries match this filter."}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((e, i) => {
              const expanded = expandedId === e.id;
              const isActing = actingId === e.id;
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.2) }}
                >
                  <Card className="border-border/60 bg-card/40 p-0">
                    {/* Row */}
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      {/* Position */}
                      <div className="hidden w-12 shrink-0 text-center sm:block">
                        <div className="font-mono text-lg font-bold text-muted-foreground">
                          #{e.position}
                        </div>
                      </div>

                      {/* Identity */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium">
                            {e.name || "Unnamed applicant"}
                          </span>
                          {statusBadge(e.status)}
                          <button
                            onClick={() => setExpandedId(expanded ? null : e.id)}
                            className="ml-1 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                          >
                            {expanded ? (
                              <>
                                <ChevronUp className="h-3 w-3" />
                                Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                Details
                              </>
                            )}
                          </button>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="truncate">{e.email}</span>
                          {e.occupation && <span>· {e.occupation}</span>}
                          {e.country && <span>· {e.country}</span>}
                          <span>· applied {timeAgo(e.createdAt)}</span>
                        </div>
                      </div>

                      {/* Readiness */}
                      <div
                        className={cn(
                          "flex shrink-0 items-center gap-2 rounded-md border px-3 py-1.5",
                          scoreBg(e.readinessScore),
                        )}
                      >
                        <Gauge className={cn("h-3.5 w-3.5", scoreColor(e.readinessScore))} />
                        <div className="text-xs">
                          <span className={cn("font-mono font-bold", scoreColor(e.readinessScore))}>
                            {e.readinessScore}
                          </span>
                          <span className="text-muted-foreground">/100</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-1.5">
                        {e.status !== "approved" && (
                          <Button
                            size="sm"
                            onClick={() => approve(e.id)}
                            disabled={isActing}
                            className="h-8 bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                          >
                            {isActing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Approve
                          </Button>
                        )}
                        {e.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reject(e.id)}
                            disabled={isActing}
                            className="h-8 border-rose-500/40 bg-rose-500/5 text-rose-300 hover:bg-rose-500/15 hover:text-rose-200"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => requestInfo(e)}
                          className="h-8 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200"
                        >
                          <Info className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Request Info</span>
                        </Button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {expanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-border/50 bg-background/40 px-4 py-4"
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {/* Breakdown */}
                          <div>
                            <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                              Readiness breakdown
                            </p>
                            <div className="space-y-1.5">
                              {Object.entries(e.readinessBreakdown ?? {}).map(([k, v]) => {
                                const max =
                                  k === "skills" || k === "audience" ? 20 : 15;
                                const pct = Math.round(((v as number) / max) * 100);
                                return (
                                  <div key={k} className="flex items-center gap-2 text-xs">
                                    <span className="w-24 shrink-0 capitalize text-muted-foreground">{k}</span>
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                                      <div
                                        className="h-full rounded-full bg-emerald-500"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="w-10 shrink-0 text-right font-mono text-foreground/80">
                                      {v as number}/{max}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Profile */}
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                Skills
                              </span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {e.skills.length > 0 ? (
                                  e.skills.map((s, idx) => (
                                    <Badge key={idx} variant="outline" className="border-emerald-500/30 bg-emerald-500/5 font-mono text-[10px] text-emerald-300">
                                      {s}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground/60">—</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                Goals
                              </span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {e.goals.length > 0 ? (
                                  e.goals.map((g, idx) => (
                                    <Badge key={idx} variant="outline" className="border-amber-500/30 bg-amber-500/5 font-mono text-[10px] text-amber-300">
                                      {g}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground/60">—</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-4">
                              <div>
                                <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                  Platforms
                                </span>
                                <p className="mt-0.5 text-foreground/80">
                                  {e.targetPlatforms.length > 0 ? e.targetPlatforms.join(", ") : "—"}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                  Formats
                                </span>
                                <p className="mt-0.5 text-foreground/80">
                                  {e.preferredFormats.length > 0 ? e.preferredFormats.join(", ") : "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>Maestro — admin console</span>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
            }}
            className="transition-colors hover:text-foreground"
          >
            Sign out
          </button>
        </footer>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  suffix?: string;
  accent: string;
}) {
  return (
    <Card className="border-border/60 bg-card/40 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        <Icon className={cn("h-3.5 w-3.5", accent)} />
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className={cn("font-mono text-2xl font-bold", accent)}>{value}</span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </Card>
  );
}
