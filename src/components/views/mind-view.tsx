"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import {
  Brain,
  Scale,
  Network,
  Lightbulb,
  Target,
  Users,
  ShieldCheck,
  Fingerprint,
  Package,
  Boxes,
  Plug,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export function MindView() {
  const { setView } = useApp();
  const { data: mind, isLoading } = useQuery({ queryKey: ["creator-mind"], queryFn: () => api.getCreatorMind() });
  const { data: brief } = useQuery({ queryKey: ["mind-brief"], queryFn: () => api.getMindBrief() });

  if (isLoading || !mind) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mr-3 h-5 w-5 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full" />
        Modeling the creator&apos;s mind…
      </div>
    );
  }

  const pillars = [
    { label: "Identity", icon: Fingerprint, value: `${Math.round(mind.identity.authenticityScore * 100)}%`, sub: `v${mind.identity.version} · ${mind.identity.beliefs.length} beliefs`, color: "text-emerald-400", view: "identity" as const },
    { label: "Constitution", icon: Scale, value: mind.constitution.principleCount, sub: `${mind.constitution.categories.length} categories · ${mind.constitution.openViolations} open`, color: "text-violet-400", view: "constitution" as const },
    { label: "Knowledge", icon: Network, value: mind.knowledge.nodeCount, sub: `${mind.knowledge.edgeCount} edges · ${Object.keys(mind.knowledge.byType).length} types`, color: "text-teal-400", view: "knowledge-graph" as const },
    { label: "Memory", icon: Lightbulb, value: mind.memory.total, sub: `${Object.keys(mind.memory.byLifecycle).length} lifecycle stages`, color: "text-amber-400", view: "trust" as const },
    { label: "Trust", icon: ShieldCheck, value: mind.trust.avgTrustScore, sub: `${mind.trust.totalProfiles} profiles · ${mind.trust.approvedCount} approved`, color: "text-emerald-400", view: "trust" as const },
    { label: "Media DNA", icon: Fingerprint, value: mind.mediaDNA.count, sub: `${mind.mediaDNA.types.length} types`, color: "text-rose-400", view: "voice-dna" as const },
    { label: "Capabilities", icon: Boxes, value: mind.capabilities.total, sub: `${mind.capabilities.active} active`, color: "text-emerald-400", view: "marketplace" as const },
    { label: "Extensions", icon: Package, value: `${mind.extensions.installed}/${mind.extensions.total}`, sub: "installed", color: "text-amber-400", view: "marketplace" as const },
    { label: "Channels", icon: Plug, value: `${mind.channels.connected}/${mind.channels.total}`, sub: "connected", color: "text-teal-400", view: "connectors" as const },
    { label: "Assets", icon: Package, value: mind.assets.count, sub: "primitives", color: "text-violet-400", view: "primitives" as const },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 border border-emerald-500/30">
            <Brain className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Creator Mind</h1>
            <p className="text-sm text-muted-foreground">
              A living model of the creator&apos;s intelligence. Everything else — videos, newsletters, podcasts — is an expression of this.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Principle */}
      <Card className="border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-200">
          <Brain className="mr-2 inline h-4 w-4" />
          The platform doesn&apos;t create content. It maintains a model of the creator&apos;s mind — constitution, identity, memory, knowledge, beliefs, goals, audience, trust, Media DNA, assets. Outputs are expressions of that model. This is the intelligence substrate.
        </p>
      </Card>

      {/* Mind brief */}
      {brief?.brief && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="border-border/60 bg-card/40 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-semibold">State of mind</h2>
            </div>
            <p className="text-sm text-foreground/90">{brief.brief}</p>
          </Card>
        </motion.div>
      )}

      {/* The 10 pillars */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {pillars.map((p, i) => (
          <motion.button
            key={p.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            onClick={() => setView(p.view)}
            className="group rounded-xl border border-border/50 bg-card/40 p-4 text-left transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5"
          >
            <div className="mb-2 flex items-center justify-between">
              <p.icon className={cn("h-4 w-4", p.color)} />
              <span className={cn("font-mono text-xl font-bold", p.color)}>{p.value}</span>
            </div>
            <p className="text-xs font-medium">{p.label}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{p.sub}</p>
          </motion.button>
        ))}
      </div>

      {/* Goals */}
      <Card className="border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-amber-400" />
          <h2 className="text-base font-semibold">Active goals</h2>
          <Badge variant="outline" className="ml-auto text-[10px]">{mind.goals.length}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {mind.goals.map((g: any) => (
            <div key={g.id} className="rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="mb-1 flex items-center gap-2">
                <p className="flex-1 text-xs font-medium">{g.title}</p>
                <Badge variant="outline" className={cn("text-[9px]", g.priority === "high" ? "border-rose-500/30 text-rose-300" : g.priority === "medium" ? "border-amber-500/30 text-amber-300" : "border-muted text-muted-foreground")}>{g.priority}</Badge>
              </div>
              {g.targetMetric && <p className="text-[10px] text-muted-foreground">Target: {g.targetMetric}</p>}
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/40">
                  <motion.div className="h-full rounded-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${g.progress * 100}%` }} transition={{ duration: 0.6, delay: 0.2 }} />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">{Math.round(g.progress * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Audiences */}
      <Card className="border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-rose-400" />
          <h2 className="text-base font-semibold">Audience models</h2>
          <Badge variant="outline" className="ml-auto text-[10px]">{mind.audiences.length}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {mind.audiences.map((a: any) => (
            <div key={a.id} className="rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="mb-1 flex items-center gap-2">
                <p className="flex-1 text-xs font-medium">{a.name}</p>
                <Badge variant="outline" className="text-[9px] capitalize">{a.expertiseLevel}</Badge>
                <Badge variant="outline" className="text-[9px] capitalize">{a.attentionSpan}</Badge>
              </div>
              <p className="line-clamp-2 text-[10px] text-muted-foreground">{a.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {a.interests.slice(0, 3).map((i: string) => (
                  <span key={i} className="rounded bg-muted/30 px-1.5 py-0.5 text-[9px]">{i}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Knowledge graph preview */}
      <Card className="border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Network className="h-4 w-4 text-teal-400" />
          <h2 className="text-base font-semibold">Knowledge graph</h2>
          <Badge variant="outline" className="ml-auto text-[10px]">{mind.knowledge.nodeCount} nodes · {mind.knowledge.edgeCount} edges</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(mind.knowledge.byType).slice(0, 12).map(([type, count]) => (
            <div key={type} className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/40 px-2 py-1">
              <TrendingUp className="h-3 w-3 text-teal-400" />
              <span className="text-[10px] capitalize">{type.replace(/_/g, " ")}</span>
              <span className="font-mono text-[10px] font-bold text-teal-400">{count as number}</span>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setView("knowledge-graph")} className="mt-3 text-muted-foreground">
          Explore the graph →
        </Button>
      </Card>

      {/* Memory lifecycle */}
      <Card className="border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-400" />
          <h2 className="text-base font-semibold">Memory lifecycle</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {["observation", "pattern", "lesson", "principle", "constitution"].map((stage, i) => {
            const count = mind.memory.byLifecycle[stage] ?? 0;
            const colors = ["text-muted-foreground", "text-amber-400", "text-emerald-400", "text-violet-400", "text-emerald-400"];
            return (
              <div key={stage} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span className={cn("text-xs font-medium capitalize", colors[i])}>{stage}</span>
                  <span className={cn("font-mono text-lg font-bold", colors[i])}>{count}</span>
                </div>
                {i < 4 && <span className="text-muted-foreground">→</span>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
