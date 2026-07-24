"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CapabilityRecord, ExtensionRecord } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Store,
  Boxes,
  Bot,
  Shield,
  ChevronDown,
  Package,
  Puzzle,
  Loader2,
  Download,
  Power,
  ArrowRight,
  Check,
} from "lucide-react";

/* ── category styling helpers ───────────────────────────────────────── */

const EXT_CATEGORY_STYLES: Record<string, string> = {
  core: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  studio: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  connector: "border-teal-500/30 bg-teal-500/10 text-teal-300",
  pack: "border-violet-500/30 bg-violet-500/10 text-violet-300",
};

const CAP_CATEGORY_STYLES: Record<string, string> = {
  intelligence: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  creative: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  production: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  distribution: "border-teal-500/30 bg-teal-500/10 text-teal-300",
  learning: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  identity: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  safety: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

const COST_STYLES: Record<string, string> = {
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  high: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};
const LATENCY_STYLES: Record<string, string> = {
  fast: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  slow: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};
const QUALITY_STYLES: Record<string, string> = {
  production: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  high: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  good: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  draft: "border-border/60 bg-background/50 text-muted-foreground",
};

const CAP_FILTERS = [
  "all",
  "intelligence",
  "creative",
  "production",
  "distribution",
  "learning",
] as const;

/* ── main view ──────────────────────────────────────────────────────── */

export function MarketplaceView() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Header />

      <Tabs defaultValue="extensions" className="space-y-4">
        <TabsList className="h-9">
          <TabsTrigger value="extensions" className="gap-1.5">
            <Package className="h-3.5 w-3.5" /> Extensions
          </TabsTrigger>
          <TabsTrigger value="capabilities" className="gap-1.5">
            <Boxes className="h-3.5 w-3.5" /> Capabilities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="extensions" className="outline-none">
          <ExtensionsTab />
        </TabsContent>
        <TabsContent value="capabilities" className="outline-none">
          <CapabilitiesTab />
        </TabsContent>
      </Tabs>
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
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
          <Store className="h-3.5 w-3.5 text-amber-300" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-amber-200">
            Capability Marketplace
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">Capability Marketplace</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground lg:text-base">
          Everything the OS can do is a capability. Install extensions to add new capabilities —
          voice cloning, video generation, editing suites.
        </p>
      </div>
    </motion.section>
  );
}

/* ── extensions tab ─────────────────────────────────────────────────── */

function ExtensionsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["extensions"],
    queryFn: () => api.listExtensions(),
  });

  const installMut = useMutation({
    mutationFn: api.installExtension,
    onSuccess: (res) => {
      toast.success(`Installed ${res.extension.name}`, {
        description: `${res.extension.capabilities.length} new capabilities available`,
      });
      qc.invalidateQueries({ queryKey: ["extensions"] });
      qc.invalidateQueries({ queryKey: ["capabilities"] });
      qc.invalidateQueries({ queryKey: ["os-overview"] });
    },
    onError: (e: Error) => toast.error(e.message || "Install failed"),
  });

  const disableMut = useMutation({
    mutationFn: api.disableExtension,
    onSuccess: (res) => {
      toast.success(`Disabled ${res.extension.name}`);
      qc.invalidateQueries({ queryKey: ["extensions"] });
      qc.invalidateQueries({ queryKey: ["capabilities"] });
      qc.invalidateQueries({ queryKey: ["os-overview"] });
    },
    onError: (e: Error) => toast.error(e.message || "Disable failed"),
  });

  if (isLoading) return <ExtensionSkeletons />;

  const exts = data?.extensions ?? [];
  const installed = exts.filter((e) => e.status === "installed");
  const available = exts.filter((e) => e.status !== "installed");

  return (
    <div className="space-y-6">
      {installed.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Installed · {installed.length}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {installed.map((e, i) => (
              <ExtensionCard
                key={e.id}
                ext={e}
                delay={0.05 * i}
                installing={installMut.isPending}
                disabling={disableMut.isPending}
                onInstall={(id) => installMut.mutate(id)}
                onDisable={(id) => disableMut.mutate(id)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-amber-300" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Available · {available.length}
          </h2>
        </div>
        {available.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border/50 p-8 text-xs text-muted-foreground">
            All extensions are already installed.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {available.map((e, i) => (
              <ExtensionCard
                key={e.id}
                ext={e}
                delay={0.05 * i}
                installing={installMut.isPending}
                disabling={disableMut.isPending}
                onInstall={(id) => installMut.mutate(id)}
                onDisable={(id) => disableMut.mutate(id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ExtensionCard({
  ext,
  delay,
  installing,
  disabling,
  onInstall,
  onDisable,
}: {
  ext: ExtensionRecord;
  delay: number;
  installing: boolean;
  disabling: boolean;
  onInstall: (id: string) => void;
  onDisable: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isInstalled = ext.status === "installed";
  const catCls = EXT_CATEGORY_STYLES[ext.category] ?? "border-border/60 bg-background/50";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card
        className={cn(
          "flex h-full flex-col border-border/60 bg-card/40 p-5",
          isInstalled && "border-emerald-500/30",
        )}
      >
        {/* Header row */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{ext.name}</h3>
              <Badge variant="outline" className="font-mono text-[10px]">
                v{ext.version}
              </Badge>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">by {ext.publisher}</p>
          </div>
          <Badge variant="outline" className={cn("text-[10px]", catCls)}>
            {ext.category}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-xs leading-relaxed text-muted-foreground">{ext.description}</p>

        {/* Capabilities provided */}
        {ext.capabilities.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Capabilities
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ext.capabilities.map((c) => (
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
        )}

        {/* Agents declared */}
        {ext.agents.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Agents
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ext.agents.map((a) => (
                <Badge
                  key={a}
                  variant="outline"
                  className="gap-1 border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-300"
                >
                  <Bot className="h-2.5 w-2.5" /> {a}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Permissions */}
        {ext.permissions.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Shield className="h-2.5 w-2.5" /> Permissions
            </p>
            <p className="text-[11px] text-muted-foreground/80">
              {ext.permissions.join(" · ")}
            </p>
          </div>
        )}

        {/* Manifest collapsible */}
        <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-full justify-between px-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Puzzle className="h-3 w-3" /> Manifest
              </span>
              <ChevronDown
                className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 max-h-48 overflow-auto scroll-thin rounded-lg border border-border/50 bg-background/60 p-3 text-[10px] leading-relaxed text-muted-foreground">
              {JSON.stringify(ext.manifest, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>

        {/* Footer action */}
        <div className="mt-auto flex items-center justify-between pt-4">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              isInstalled
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300",
            )}
          >
            {ext.status}
          </Badge>
          {isInstalled ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={disabling}
              onClick={() => onDisable(ext.extId)}
              className="text-muted-foreground hover:text-rose-300"
            >
              {disabling ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Power className="mr-1 h-3.5 w-3.5" />
              )}
              Disable
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={installing}
              onClick={() => onInstall(ext.extId)}
              className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
            >
              {installing ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="mr-1 h-3.5 w-3.5" />
              )}
              Install
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

/* ── capabilities tab ───────────────────────────────────────────────── */

function CapabilitiesTab() {
  const [filter, setFilter] = useState<(typeof CAP_FILTERS)[number]>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["capabilities", filter === "all" ? undefined : filter],
    queryFn: () => api.listCapabilities(filter === "all" ? undefined : filter),
  });

  const caps = data?.capabilities ?? [];

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {CAP_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-wider transition-colors",
              filter === f
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                : "border-border/60 bg-background/40 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground",
            )}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <CapabilitySkeletons />
      ) : caps.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border/50 p-8 text-xs text-muted-foreground">
          No capabilities in this category.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {caps.map((c, i) => (
            <CapabilityCard key={c.id} cap={c} delay={0.04 * i} />
          ))}
        </div>
      )}
    </div>
  );
}

function CapabilityCard({ cap, delay }: { cap: CapabilityRecord; delay: number }) {
  const catCls = CAP_CATEGORY_STYLES[cap.category] ?? "border-border/60 bg-background/50";
  const costCls = COST_STYLES[cap.cost] ?? "border-border/60";
  const latencyCls = LATENCY_STYLES[cap.latency] ?? "border-border/60";
  const qualityCls = QUALITY_STYLES[cap.quality] ?? "border-border/60";
  const inputs = Object.keys(cap.inputs);
  const outputs = Object.keys(cap.outputs);
  const isBuiltin = cap.source === "builtin";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="flex h-full flex-col border-border/60 bg-card/40 p-4">
        {/* Header */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {cap.key}
            </p>
            <h3 className="text-sm font-semibold">{cap.name}</h3>
          </div>
          <Badge variant="outline" className={cn("text-[10px]", catCls)}>
            {cap.category}
          </Badge>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">{cap.description}</p>

        {/* Inputs → Outputs flow */}
        <div className="mt-3 rounded-lg border border-border/50 bg-background/40 p-2.5">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Flow
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <div className="flex flex-wrap gap-1">
              {inputs.length === 0 ? (
                <span className="text-muted-foreground/60">—</span>
              ) : (
                inputs.map((k) => (
                  <span
                    key={k}
                    className="rounded border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-foreground/80"
                  >
                    {k}
                  </span>
                ))
              )}
            </div>
            <ArrowRight className="h-3 w-3 shrink-0 text-emerald-400" />
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
              {cap.key}
            </span>
            <ArrowRight className="h-3 w-3 shrink-0 text-emerald-400" />
            <div className="flex flex-wrap gap-1">
              {outputs.length === 0 ? (
                <span className="text-muted-foreground/60">—</span>
              ) : (
                outputs.map((k) => (
                  <span
                    key={k}
                    className="rounded border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-foreground/80"
                  >
                    {k}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Cost / Latency / Quality */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="outline" className={cn("text-[10px]", costCls)}>
            cost: {cap.cost}
          </Badge>
          <Badge variant="outline" className={cn("text-[10px]", latencyCls)}>
            latency: {cap.latency}
          </Badge>
          <Badge variant="outline" className={cn("text-[10px]", qualityCls)}>
            quality: {cap.quality}
          </Badge>
        </div>

        {/* Source + agent */}
        <div className="mt-auto flex items-center justify-between pt-4">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              isBuiltin
                ? "border-border/60 bg-background/50 text-muted-foreground"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300",
            )}
          >
            {cap.source}
          </Badge>
          {cap.agentType && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Bot className="h-2.5 w-2.5" /> {cap.agentType}
            </span>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

/* ── skeletons ──────────────────────────────────────────────────────── */

function ExtensionSkeletons() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full" />
        ))}
      </div>
    </div>
  );
}

function CapabilitySkeletons() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-56 w-full" />
      ))}
    </div>
  );
}
