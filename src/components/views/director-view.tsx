"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CompiledPlan,
  ProductionPlanRecord,
  ProductionPlanStep,
  OutputChannelRecord,
} from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { StatusBadge } from "@/components/status-badge";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Compass,
  Sparkles,
  Loader2,
  ShieldCheck,
  Puzzle,
  Check,
  ChevronDown,
  ChevronRight,
  Bot,
  ArrowRight,
  Clock,
  ListChecks,
  AlertTriangle,
  RefreshCw,
  Eye,
  Brain,
  Boxes,
  Layers,
  Wand2,
  History,
  CircleCheck,
  CircleDot,
} from "lucide-react";

/* ── main view ──────────────────────────────────────────────────────── */

export function DirectorView() {
  const qc = useQueryClient();
  const [intent, setIntent] = useState("");
  const [targetChannel, setTargetChannel] = useState<string>("youtube");
  const [prefs, setPrefs] = useState({
    voiceCloning: false,
    videoGen: false,
    multiChannel: false,
  });

  const [compiled, setCompiled] = useState<{ plan: CompiledPlan; savedPlan: ProductionPlanRecord } | null>(null);

  const channelsQuery = useQuery({
    queryKey: ["channels"],
    queryFn: () => api.listChannels(),
  });
  const channels = (channelsQuery.data?.channels ?? []) as OutputChannelRecord[];
  const connectedChannels = channels.filter((c) => c.status === "connected");
  const channelOptions = connectedChannels.length > 0 ? connectedChannels : channels;

  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: () => api.listPlans(),
  });

  const compileMut = useMutation({
    mutationFn: () =>
      api.compilePlan({
        intent: intent.trim(),
        targetChannel,
        preferences: {
          voiceCloning: prefs.voiceCloning,
          videoGeneration: prefs.videoGen,
          multiChannelDistribution: prefs.multiChannel,
        },
      }),
    onSuccess: (res) => {
      setCompiled(res);
      toast.success("Plan compiled", {
        description: `${res.plan.steps.length} steps · grounded in creator identity`,
      });
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["os-overview"] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Compilation failed — try again");
    },
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => api.approvePlan(id),
    onSuccess: (res) => {
      toast.success("Plan approved", {
        description: `${res.plan.steps.length} steps queued for execution`,
      });
      qc.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (e: Error) => toast.error(e.message || "Approval failed"),
  });

  const handleCompile = () => {
    if (!intent.trim()) {
      toast.error("Describe your creative intent first");
      return;
    }
    setCompiled(null);
    compileMut.mutate();
  };

  const handleRecompile = () => {
    setCompiled(null);
    handleCompile();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Header />

      {/* Intent compiler */}
      <IntentCompiler
        intent={intent}
        setIntent={setIntent}
        targetChannel={targetChannel}
        setTargetChannel={setTargetChannel}
        prefs={prefs}
        setPrefs={setPrefs}
        channels={channelOptions}
        channelsLoading={channelsQuery.isLoading}
        compiling={compileMut.isPending}
        onCompile={handleCompile}
        error={compileMut.error ? (compileMut.error as Error).message : null}
      />

      {/* Compiling state OR compiled plan */}
      <AnimatePresence mode="wait">
        {compileMut.isPending && (
          <motion.div
            key="compiling"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <CompilingState intent={intent} />
          </motion.div>
        )}

        {compiled && !compileMut.isPending && (
          <motion.div
            key="compiled"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <CompiledPlanDisplay
              compiled={compiled}
              approving={approveMut.isPending}
              onApprove={() => approveMut.mutate(compiled.savedPlan.id)}
              onRecompile={handleRecompile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent plans */}
      <RecentPlans plans={plansQuery.data?.plans ?? []} isLoading={plansQuery.isLoading} />
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
          <Compass className="h-3.5 w-3.5 text-emerald-300" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-200">
            Executive Director · Phase 3 centerpiece
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">Director AI</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground lg:text-base">
          The Executive Director takes your creative intent and compiles a production plan by
          dynamically composing available capabilities. No hardcoded pipelines — the plan adapts to
          what&apos;s installed.
        </p>
      </div>
    </motion.section>
  );
}

/* ── intent compiler ────────────────────────────────────────────────── */

interface IntentCompilerProps {
  intent: string;
  setIntent: (v: string) => void;
  targetChannel: string;
  setTargetChannel: (v: string) => void;
  prefs: { voiceCloning: boolean; videoGen: boolean; multiChannel: boolean };
  setPrefs: (p: { voiceCloning: boolean; videoGen: boolean; multiChannel: boolean }) => void;
  channels: OutputChannelRecord[];
  channelsLoading: boolean;
  compiling: boolean;
  onCompile: () => void;
  error: string | null;
}

function IntentCompiler({
  intent,
  setIntent,
  targetChannel,
  setTargetChannel,
  prefs,
  setPrefs,
  channels,
  channelsLoading,
  compiling,
  onCompile,
  error,
}: IntentCompilerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="relative overflow-hidden border-emerald-500/30 bg-card/40 p-5 lg:p-6">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-20" />
        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
              <Wand2 className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Compile a production plan</h2>
              <p className="text-[11px] text-muted-foreground">
                Describe what you want to make — the Director discovers capabilities and chains them.
              </p>
            </div>
          </div>

          <Textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="e.g. Make a 12-minute video on vector databases for senior engineers, with voice cloning and multi-channel distribution."
            className="min-h-28 resize-y border-border/60 bg-background/50 text-sm"
            disabled={compiling}
          />

          <div className="flex flex-wrap items-end gap-4">
            {/* Target channel */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Target channel
              </label>
              <Select value={targetChannel} onValueChange={setTargetChannel} disabled={compiling}>
                <SelectTrigger className="h-9 w-44 border-border/60 bg-background/50">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {channelsLoading ? (
                    <SelectItem value="loading" disabled>
                      loading…
                    </SelectItem>
                  ) : (
                    channels.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        <span className="flex items-center gap-2">
                          <Icon name={c.icon} className="h-3 w-3" />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Preferences */}
            <div className="flex flex-wrap items-center gap-4">
              <PrefCheckbox
                checked={prefs.voiceCloning}
                onChange={(v) => setPrefs({ ...prefs, voiceCloning: v })}
                label="Use voice cloning"
                disabled={compiling}
              />
              <PrefCheckbox
                checked={prefs.videoGen}
                onChange={(v) => setPrefs({ ...prefs, videoGen: v })}
                label="Use video generation"
                disabled={compiling}
              />
              <PrefCheckbox
                checked={prefs.multiChannel}
                onChange={(v) => setPrefs({ ...prefs, multiChannel: v })}
                label="Multi-channel distribution"
                disabled={compiling}
              />
            </div>

            <div className="ml-auto">
              <Button
                size="lg"
                disabled={compiling || !intent.trim()}
                onClick={onCompile}
                className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              >
                {compiling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {compiling ? "Compiling…" : "Compile plan"}
              </Button>
            </div>
          </div>

          {compiling && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" /> This takes 15–25s — the Director reads your identity,
              discovers capabilities and grounds the plan before composing steps.
            </p>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function PrefCheckbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} disabled={disabled} />
      <span className={cn(disabled && "opacity-60")}>{label}</span>
    </label>
  );
}

/* ── compiling state ────────────────────────────────────────────────── */

const COMPILE_STEPS = [
  { label: "Reading Creator Identity…", icon: ShieldCheck },
  { label: "Discovering available capabilities…", icon: Boxes },
  { label: "Selecting optimal capability chain…", icon: Layers },
  { label: "Grounding plan in identity…", icon: Brain },
  { label: "Compiling execution steps…", icon: ListChecks },
];

function CompilingState({ intent }: { intent: string }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((s) => (s < COMPILE_STEPS.length - 1 ? s + 1 : s));
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <Card className="relative overflow-hidden border-emerald-500/30 bg-card/40 p-6 lg:p-8">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative flex flex-col items-center text-center">
        {/* Pulsing compass */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/20 opacity-50" />
          <span className="absolute inline-flex h-16 w-16 animate-pulse rounded-full bg-emerald-500/20" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/15">
            <Compass className="h-8 w-8 animate-spin text-emerald-300" style={{ animationDuration: "4s" }} />
          </div>
        </div>

        <h3 className="mt-5 text-lg font-semibold tracking-tight">
          Director AI is compiling your plan
        </h3>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
          Discovering capabilities and composing a dynamic production chain. No hardcoded
          pipelines — the plan adapts to what&apos;s installed.
        </p>

        {/* Intent echo */}
        <div className="mt-4 max-w-lg rounded-lg border border-border/50 bg-background/40 p-3 text-left">
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
            Intent
          </p>
          <p className="line-clamp-2 text-xs italic text-foreground/80">“{intent}”</p>
        </div>

        {/* Progress steps */}
        <div className="mt-6 w-full max-w-md space-y-2 text-left">
          {COMPILE_STEPS.map((s, i) => {
            const isDone = i < activeStep;
            const isActive = i === activeStep;
            const StepIcon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: isDone || isActive ? 1 : 0.4 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border p-2.5 transition-colors",
                  isDone
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : isActive
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border/40 bg-background/30",
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                    isDone
                      ? "bg-emerald-500/15 text-emerald-300"
                      : isActive
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : isActive ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <StepIcon className="h-3.5 w-3.5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs",
                    isDone || isActive ? "text-foreground/90" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

/* ── compiled plan display ──────────────────────────────────────────── */

function CompiledPlanDisplay({
  compiled,
  approving,
  onApprove,
  onRecompile,
}: {
  compiled: { plan: CompiledPlan; savedPlan: ProductionPlanRecord };
  approving: boolean;
  onApprove: () => void;
  onRecompile: () => void;
}) {
  const { plan, savedPlan } = compiled;
  return (
    <div className="space-y-4">
      {/* Plan header */}
      <Card className="relative overflow-hidden border-emerald-500/30 bg-card/40 p-5 lg:p-6">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-20" />
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
                <CircleCheck className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Compiled production plan</h2>
                <p className="text-[11px] text-muted-foreground">
                  {plan.steps.length} steps · {plan.capabilitiesUsed.length} capabilities ·
                  target: <span className="font-mono">{plan.targetChannel}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {plan.identityGrounded && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-300"
                >
                  <ShieldCheck className="mr-1 h-3 w-3" /> Grounded in Creator Identity
                </Badge>
              )}
              <StatusBadge status={savedPlan.status} />
            </div>
          </div>

          {/* Rationale */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
              <Brain className="h-3 w-3" /> Director&apos;s rationale
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">{plan.rationale}</p>
          </div>

          {/* Extensions required */}
          {plan.extensionsRequired.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Requires:
              </span>
              {plan.extensionsRequired.map((ext) => (
                <Badge
                  key={ext}
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-300"
                >
                  <Puzzle className="mr-1 h-2.5 w-2.5" /> {ext}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Plan steps timeline */}
      <Card className="border-border/60 bg-card/40 p-5 lg:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold">Execution plan</h3>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {plan.steps.filter((s) => s.requiresApproval).length} approval gates
          </span>
        </div>

        <div className="space-y-3">
          {plan.steps.map((step, i) => (
            <PlanStepCard key={step.stepKey} step={step} index={i} isLast={i === plan.steps.length - 1} />
          ))}
        </div>
      </Card>

      {/* Capabilities considered */}
      {plan.capabilitiesConsidered.length > 0 && (
        <CapabilitiesConsidered considered={plan.capabilitiesConsidered} />
      )}

      {/* Actions */}
      <Card className="border-border/60 bg-card/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Ready to execute?</p>
            <p className="text-[11px] text-muted-foreground">
              Approving queues this plan for production. You retain approval gates at each step.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onRecompile} disabled={approving}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Recompile
            </Button>
            <Button
              onClick={onApprove}
              disabled={approving || savedPlan.status === "approved"}
              className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
            >
              {approving ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="mr-1 h-3.5 w-3.5" />
              )}
              {savedPlan.status === "approved" ? "Approved" : "Approve plan"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ── plan step card ─────────────────────────────────────────────────── */

function PlanStepCard({
  step,
  index,
  isLast,
}: {
  step: ProductionPlanStep;
  index: number;
  isLast: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.05 * index }}
      className="relative"
    >
      {/* Connecting line */}
      {!isLast && (
        <div className="absolute left-[18px] top-[44px] z-0 h-[calc(100%-32px)] w-px bg-gradient-to-b from-emerald-500/40 to-border/30" />
      )}
      <div className="relative z-10 flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-4">
        {/* Step number badge */}
        <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
          <span className="font-mono text-xs font-semibold text-emerald-300">{index + 1}</span>
        </div>

        <div className="min-w-0 flex-1">
          {/* Step header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold">{step.stepLabel}</h4>
              {step.agentType && (
                <Badge
                  variant="outline"
                  className="gap-1 border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-300"
                >
                  <Bot className="h-2.5 w-2.5" /> {step.agentType}
                </Badge>
              )}
              {step.requiresApproval && (
                <Badge
                  variant="outline"
                  className="gap-1 border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-300"
                >
                  <AlertTriangle className="h-2.5 w-2.5" /> approval gate
                </Badge>
              )}
            </div>
            <StatusBadge status={step.status} className="shrink-0" />
          </div>

          {/* Capability */}
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="font-mono text-emerald-300">{step.capabilityKey}</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{step.capabilityName}</span>
          </div>

          {/* Inputs → capability → outputs flow */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-lg border border-border/50 bg-background/50 p-2.5 text-[10px]">
            <div className="flex flex-wrap gap-1">
              {step.inputs.length === 0 ? (
                <span className="text-muted-foreground/60">—</span>
              ) : (
                step.inputs.map((k, i) => (
                  <span
                    key={`${k}-${i}`}
                    className="rounded border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-foreground/80"
                  >
                    {k}
                  </span>
                ))
              )}
            </div>
            <ArrowRight className="h-3 w-3 shrink-0 text-emerald-400" />
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
              {step.capabilityKey}
            </span>
            <ArrowRight className="h-3 w-3 shrink-0 text-emerald-400" />
            <div className="flex flex-wrap gap-1">
              {step.outputs.length === 0 ? (
                <span className="text-muted-foreground/60">—</span>
              ) : (
                step.outputs.map((k, i) => (
                  <span
                    key={`${k}-${i}`}
                    className="rounded border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-foreground/80"
                  >
                    {k}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Step rationale */}
          <div className="mt-3 flex items-start gap-1.5">
            <Eye className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground/70">Why this here:</span> {step.rationale}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── capabilities considered (transparency) ─────────────────────────── */

function CapabilitiesConsidered({
  considered,
}: {
  considered: CompiledPlan["capabilitiesConsidered"];
}) {
  const [open, setOpen] = useState(false);
  const unused = considered.filter((c) => !c.used);
  const used = considered.filter((c) => c.used);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-border/60 bg-card/40 p-5">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between gap-2 text-left">
            <div className="flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-amber-300" />
              <div>
                <h3 className="text-sm font-semibold">Capabilities considered</h3>
                <p className="text-[11px] text-muted-foreground">
                  {used.length} used · {unused.length} considered & rejected — transparency
                </p>
              </div>
            </div>
            <ChevronDown
              className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {unused.map((c, i) => (
              <div
                key={`${c.key}-${i}`}
                className="rounded-lg border border-border/50 bg-background/40 p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-foreground/80">{c.key}</span>
                  <Badge
                    variant="outline"
                    className="border-rose-500/30 bg-rose-500/10 text-[10px] text-rose-300"
                  >
                    not used
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{c.name}</p>
                <p className="mt-1.5 text-[11px] italic leading-relaxed text-muted-foreground/80">
                  {c.reason}
                </p>
              </div>
            ))}
            {unused.length === 0 && (
              <div className="col-span-2 flex items-center justify-center rounded-lg border border-dashed border-border/50 p-4 text-xs text-muted-foreground">
                Every considered capability was used.
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

/* ── recent plans ───────────────────────────────────────────────────── */

function RecentPlans({
  plans,
  isLoading,
}: {
  plans: ProductionPlanRecord[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="border-border/60 bg-card/40 p-5">
        <div className="mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold">Recent plans</h3>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold">Recent plans</h3>
        </div>
        <span className="text-[11px] text-muted-foreground">{plans.length} total</span>
      </div>

      {plans.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border/50 p-6 text-xs text-muted-foreground">
          No plans yet — compile one above.
        </div>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto scroll-thin pr-1">
          {plans.map((p) => (
            <RecentPlanRow key={p.id} plan={p} />
          ))}
        </div>
      )}
    </Card>
  );
}

function RecentPlanRow({ plan }: { plan: ProductionPlanRecord }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-border/50 bg-background/40">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-background/60">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <Compass className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-xs font-medium">{plan.intent}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                {plan.targetChannel && (
                  <span className="font-mono">{plan.targetChannel}</span>
                )}
                <span>· {plan.steps.length} steps</span>
                <span>· {timeAgo(plan.createdAt)}</span>
              </div>
            </div>
            <StatusBadge status={plan.status} className="shrink-0" />
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border/40 p-3">
            {/* Rationale */}
            <div className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                Rationale
              </p>
              <p className="text-xs leading-relaxed text-foreground/80">{plan.rationale}</p>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              {plan.steps.map((step, i) => (
                <div
                  key={step.stepKey}
                  className="flex items-start gap-2 rounded-lg border border-border/40 bg-background/40 p-2.5"
                >
                  <span className="mt-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium">{step.stepLabel}</span>
                      {step.requiresApproval && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-300"
                        >
                          gate
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {step.capabilityKey}
                    </p>
                  </div>
                  <StatusBadge status={step.status} className="shrink-0" />
                </div>
              ))}
            </div>

            {/* Capabilities used */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Capabilities:
              </span>
              {plan.capabilitiesUsed.map((c) => (
                <Badge
                  key={c}
                  variant="outline"
                  className="border-border/60 bg-background/50 font-mono text-[10px] text-foreground/80"
                >
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/* ── helpers ────────────────────────────────────────────────────────── */

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
