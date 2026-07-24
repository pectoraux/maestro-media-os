"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import { AGENT_MAP } from "@/lib/agents-registry";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { Icon } from "@/components/icon";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ClipboardCheck,
  Check,
  X,
  PenLine,
  Loader2,
  Lock,
  Clock,
  ShieldCheck,
  Quote,
  ChevronRight,
} from "lucide-react";
import type { ApprovalGateRecord } from "@/lib/types";

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

// ── Skeleton ─────────────────────────────────────────────────────────────
function ApprovalSkeleton() {
  return (
    <Card className="border-border/60 bg-card/40 p-5">
      <div className="flex animate-pulse items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-muted/60" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-muted/60" />
          <div className="h-2 w-1/4 rounded bg-muted/40" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-muted/40" />
        <div className="h-3 w-5/6 rounded bg-muted/40" />
      </div>
    </Card>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────
function EmptyQueue() {
  return (
    <Card className="border-dashed border-border/60 bg-card/30 p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
        <ShieldCheck className="h-7 w-7 text-emerald-400" />
      </div>
      <p className="mt-4 text-sm font-medium">The pipeline is clear — no approvals waiting.</p>
      <p className="mt-1 text-xs text-muted-foreground">Maestro is standing by.</p>
    </Card>
  );
}

// ── Revision dialog ──────────────────────────────────────────────────────
function RevisionDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (feedback: string) => void;
  pending: boolean;
}) {
  const [feedback, setFeedback] = useState("");
  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setFeedback(""); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request revision</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Tell the agent what needs to change. The pipeline will pause this stage until you re-review.
          </p>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Tighten the hook · add a stronger data point · shift tone to be more direct…"
            rows={4}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(feedback)}
            disabled={pending || !feedback.trim()}
            variant="outline"
            className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
          >
            {pending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <PenLine className="mr-1.5 h-3.5 w-3.5" />}
            Send revision feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Approval card ────────────────────────────────────────────────────────
function ApprovalCard({ gate }: { gate: ApprovalGateRecord & { projectTitle?: string } }) {
  const qc = useQueryClient();
  const { openProject } = useApp();
  const [pending, setPending] = useState<"approve" | "revise" | "reject" | null>(null);
  const [reviseOpen, setReviseOpen] = useState(false);
  const agent = AGENT_MAP[gate.agentType];

  const decide = useMutation({
    mutationFn: (vars: { decision: "approved" | "rejected" | "revised"; feedback?: string }) =>
      api.decideApproval(gate.id, vars.decision, vars.feedback),
    onMutate: (vars) => {
      setPending(vars.decision === "approved" ? "approve" : vars.decision === "rejected" ? "reject" : "revise");
    },
    onSuccess: (_d, vars) => {
      const msg =
        vars.decision === "approved"
          ? "Approved · advancing pipeline"
          : vars.decision === "rejected"
            ? "Gate rejected"
            : "Revision requested";
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ["approvals"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (gate.projectId) qc.invalidateQueries({ queryKey: ["project", gate.projectId] });
      setPending(null);
      setReviseOpen(false);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Decision failed");
      setPending(null);
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className={cn(
          "border-border/60 bg-card/40 p-5 transition-colors",
          gate.status === "pending" && "border-amber-500/30",
          gate.status === "approved" && "border-emerald-500/20",
          gate.status === "rejected" && "border-rose-500/20",
          gate.status === "revised" && "border-amber-500/20",
        )}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2">
          {agent && (
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40")}>
              <Icon name={agent.icon} className={cn("h-4 w-4", agent.color)} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{agent?.name ?? gate.agentType}</p>
            <p className="text-[11px] text-muted-foreground">{agent?.role}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="border-border/60 text-[10px] capitalize">
              {gate.stage.replace("_", " ")}
            </Badge>
            <StatusBadge status={gate.status} />
          </div>
        </div>

        {/* Project link */}
        <button
          onClick={() => gate.projectId && openProject(gate.projectId)}
          className="mt-3 flex w-full items-center gap-1.5 rounded-md border border-border/50 bg-background/40 px-2.5 py-1.5 text-left text-xs transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5"
        >
          <ChevronRight className="h-3 w-3 shrink-0 text-emerald-400" />
          <span className="truncate text-foreground/85">{gate.projectTitle ?? "Open project"}</span>
          <Clock className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="shrink-0 text-muted-foreground">{timeAgo(gate.createdAt)}</span>
        </button>

        {/* Payload */}
        <div className="mt-4 space-y-3">
          <div>
            <h3 className="text-base font-semibold leading-tight">{gate.payload.title}</h3>
            {gate.payload.summary && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{gate.payload.summary}</p>
            )}
          </div>

          {gate.payload.highlights?.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Highlights
              </p>
              <ul className="space-y-1">
                {gate.payload.highlights.map((h, i) => (
                  <li key={i} className="flex gap-1.5 text-xs leading-relaxed text-foreground/90">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {gate.payload.artifacts && gate.payload.artifacts.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Artifacts
              </p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {gate.payload.artifacts.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/50 bg-background/40 px-2.5 py-1.5 text-xs"
                  >
                    <span className="text-muted-foreground">{a.label}</span>
                    <span className="truncate font-mono text-foreground/90">{a.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gate.feedback && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs">
              <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Feedback</p>
                <p className="mt-0.5 italic text-amber-100/90">{gate.feedback}</p>
              </div>
            </div>
          )}

          {gate.decidedAt && (
            <p className="text-[10px] text-muted-foreground">Decided {timeAgo(gate.decidedAt)}</p>
          )}
        </div>

        {/* Actions */}
        {gate.status === "pending" && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border/40 pt-3">
            <Button
              size="sm"
              onClick={() => decide.mutate({ decision: "approved" })}
              disabled={!!pending}
              className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
            >
              {pending === "approve" ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReviseOpen(true)}
              disabled={!!pending}
              className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
            >
              {pending === "revise" ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <PenLine className="mr-1.5 h-3.5 w-3.5" />
              )}
              Request revision
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => decide.mutate({ decision: "rejected" })}
              disabled={!!pending}
              className="text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
            >
              {pending === "reject" ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="mr-1.5 h-3.5 w-3.5" />
              )}
              Reject
            </Button>
          </div>
        )}
      </Card>

      <RevisionDialog
        open={reviseOpen}
        onOpenChange={setReviseOpen}
        pending={pending === "revise"}
        onSubmit={(feedback) => decide.mutate({ decision: "revised", feedback })}
      />
    </motion.div>
  );
}

// ── Main view ────────────────────────────────────────────────────────────
export function ApprovalsView() {
  const [tab, setTab] = useState<"pending" | "all" | "approved" | "rejected">("pending");

  const status = tab === "all" ? undefined : tab;
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["approvals", status ?? "all"],
    queryFn: () => api.listApprovals(status),
  });

  const approvals = data?.approvals ?? [];
  // newest first
  const sorted = [...approvals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start gap-3"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
          <ClipboardCheck className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Approval Queue</h1>
          <p className="text-xs text-muted-foreground">
            Every stage pauses for your judgment. The AI never publishes without you.
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="bg-card/40">
          <TabsTrigger value="pending" className="data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-300">
            <Lock className="mr-1.5 h-3 w-3" /> Pending
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300">
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-rose-500/15 data-[state=active]:text-rose-300">
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              <ApprovalSkeleton />
              <ApprovalSkeleton />
              <ApprovalSkeleton />
            </div>
          ) : isError ? (
            <Card className="border-rose-500/30 bg-rose-500/5 p-6 text-center text-sm text-rose-300">
              Failed to load approvals: {(error as Error)?.message}
            </Card>
          ) : sorted.length === 0 ? (
            tab === "pending" ? (
              <EmptyQueue />
            ) : (
              <Card className="border-dashed border-border/60 bg-card/30 p-10 text-center text-xs text-muted-foreground">
                No {tab === "all" ? "" : tab} approvals yet.
              </Card>
            )
          ) : (
            <div className="max-h-[calc(100vh-260px)] space-y-3 overflow-y-auto pr-1 scroll-thin">
              {sorted.map((g) => (
                <ApprovalCard key={g.id} gate={g} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
