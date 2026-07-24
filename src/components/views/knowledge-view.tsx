"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { KnowledgeNodeRecord } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Network, Search } from "lucide-react";

/* ── type → color / icon / label map ─────────────────────────────────── */

type NodeType = KnowledgeNodeRecord["type"];

const TYPE_META: Record<
  NodeType,
  { color: string; chip: string; icon: string; label: string }
> = {
  audience_insight: {
    color: "oklch(0.72 0.17 162)",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    icon: "Users",
    label: "Audience insight",
  },
  creator_voice: {
    color: "oklch(0.72 0.16 305)",
    chip: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    icon: "Mic",
    label: "Creator voice",
  },
  research: {
    color: "oklch(0.7 0.15 200)",
    chip: "border-teal-500/30 bg-teal-500/10 text-teal-300",
    icon: "Microscope",
    label: "Research",
  },
  editorial: {
    color: "oklch(0.78 0.16 80)",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    icon: "FileText",
    label: "Editorial",
  },
  history: {
    color: "oklch(0.65 0.2 25)",
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    icon: "History",
    label: "History",
  },
  pattern: {
    color: "oklch(0.72 0.17 162)",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    icon: "GitBranch",
    label: "Pattern",
  },
  competitor: {
    color: "oklch(0.78 0.16 80)",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    icon: "Swords",
    label: "Competitor",
  },
};

const TYPE_ORDER: NodeType[] = [
  "audience_insight",
  "creator_voice",
  "research",
  "editorial",
  "history",
  "pattern",
  "competitor",
];

/* ── view ──────────────────────────────────────────────────────────── */

export function KnowledgeView() {
  const { data, isLoading } = useQuery({
    queryKey: ["knowledge"],
    queryFn: api.knowledge,
  });

  const [query, setQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];
  const counts = data?.counts ?? {};

  // Group nodes by type (preserving declared order).
  const byType = useMemo(() => {
    const m: Record<string, KnowledgeNodeRecord[]> = {};
    for (const t of TYPE_ORDER) m[t] = [];
    for (const n of nodes) {
      if (!m[n.type]) m[n.type] = [];
      m[n.type].push(n);
    }
    return m;
  }, [nodes]);

  // Compute positions on concentric rings (one ring per type).
  const positions = useMemo(() => {
    const cx = 400;
    const cy = 300;
    const pos: Record<string, { x: number; y: number; r: number; node: KnowledgeNodeRecord }> = {};
    const ringTypes = TYPE_ORDER.filter((t) => byType[t].length > 0);
    ringTypes.forEach((t, ringIndex) => {
      const list = byType[t];
      const radius = 90 + ringIndex * 42;
      const angleOffset = (ringIndex * Math.PI) / ringTypes.length;
      list.forEach((node, i) => {
        const angle = (i / Math.max(list.length, 1)) * Math.PI * 2 + angleOffset;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        const w = typeof node.weight === "number" ? Math.max(0, Math.min(1, node.weight)) : 0.3;
        const r = 5 + w * 9; // 5–14
        pos[node.id] = { x, y, r, node };
      });
    });
    return pos;
  }, [byType]);

  // Filtered list (by label or content).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return nodes;
    return nodes.filter(
      (n) =>
        n.label.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
    );
  }, [nodes, query]);

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
          <Network className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-300">
            Persistent intelligence
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Knowledge Graph</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Every published video makes the system smarter. Insights, voice patterns, research and learned
          patterns persist here.
        </p>
      </motion.section>

      {/* Stats row by type */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {TYPE_ORDER.map((t, i) => {
          const meta = TYPE_META[t];
          const count = counts[t] ?? byType[t].length ?? 0;
          return (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 + i * 0.03 }}
            >
              <Card className="border-border/60 bg-card/40 p-3">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                  >
                    <Icon name={meta.icon} className="h-3.5 w-3.5" />
                    <span className="sr-only">{meta.label}</span>
                  </div>
                  <span className="font-mono text-lg font-semibold">{count}</span>
                </div>
                <p className="mt-1 truncate text-[10px] text-muted-foreground">{meta.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </section>

      {isLoading ? (
        <Card className="border-border/60 bg-card/40 p-6">
          <Skeleton className="h-[520px] w-full" />
        </Card>
      ) : nodes.length === 0 ? (
        <Card className="border-border/60 bg-card/40 p-10 text-center text-sm text-muted-foreground">
          No knowledge nodes yet. Publish a video — Maestro will extract insights automatically.
        </Card>
      ) : (
        <>
          {/* Graph */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <Card className="relative overflow-hidden border-border/60 bg-card/40 p-4">
              <div className="grid-bg pointer-events-none absolute inset-0 opacity-20" />
              <div className="relative mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Graph view</h2>
                  <p className="text-xs text-muted-foreground">
                    {nodes.length} nodes · {edges.length} edges · radial layout by type
                  </p>
                </div>
                <Legend />
              </div>

              <div className="relative">
                <svg
                  viewBox="0 0 800 600"
                  className="h-[520px] w-full"
                  role="img"
                  aria-label="Knowledge graph radial layout"
                >
                  {/* faint ring guides */}
                  {TYPE_ORDER.filter((t) => byType[t].length > 0).map((_, i) => (
                    <circle
                      key={i}
                      cx={400}
                      cy={300}
                      r={90 + i * 42}
                      fill="none"
                      stroke="oklch(1 0 0 / 0.04)"
                      strokeWidth={1}
                    />
                  ))}

                  {/* edges */}
                  <g>
                    {edges.map((e, i) => {
                      const s = positions[e.sourceId];
                      const t = positions[e.targetId];
                      if (!s || !t) return null;
                      const active =
                        hoveredId === e.sourceId || hoveredId === e.targetId;
                      return (
                        <line
                          key={i}
                          x1={s.x}
                          y1={s.y}
                          x2={t.x}
                          y2={t.y}
                          stroke={active ? "oklch(0.72 0.17 162 / 0.6)" : "oklch(0.72 0.17 162 / 0.12)"}
                          strokeWidth={active ? 1.5 : 0.8}
                        />
                      );
                    })}
                  </g>

                  {/* nodes */}
                  <g>
                    {Object.values(positions).map(({ x, y, r, node }) => {
                      const meta = TYPE_META[node.type];
                      const active = hoveredId === node.id;
                      return (
                        <g
                          key={node.id}
                          onMouseEnter={() => setHoveredId(node.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={x}
                            cy={y}
                            r={r + (active ? 4 : 0)}
                            fill={meta.color}
                            fillOpacity={active ? 1 : 0.85}
                            stroke="oklch(0.16 0.006 264)"
                            strokeWidth={1.5}
                          />
                          <text
                            x={x}
                            y={y + r + 12}
                            textAnchor="middle"
                            fontSize={9}
                            fill="oklch(0.68 0.012 264)"
                            className="pointer-events-none select-none"
                          >
                            {node.label.length > 18
                              ? node.label.slice(0, 17) + "…"
                              : node.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* hover tooltip */}
                {hoveredId && positions[hoveredId] && (
                  <div className="pointer-events-none absolute right-3 top-3 max-w-xs rounded-lg border border-border/60 bg-popover/95 p-3 shadow-lg backdrop-blur">
                    {(() => {
                      const node = positions[hoveredId].node;
                      const meta = TYPE_META[node.type];
                      return (
                        <>
                          <div className="mb-1 flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: meta.color }}
                            />
                            <Badge variant="outline" className={cn("text-[10px]", meta.chip)}>
                              {meta.label}
                            </Badge>
                            <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                              w {node.weight.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs font-semibold">{node.label}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                            {node.content}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </Card>
          </motion.section>

          {/* Searchable list */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <Card className="border-border/60 bg-card/40 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">All nodes</h2>
                  <p className="text-xs text-muted-foreground">
                    {filtered.length} of {nodes.length} shown
                  </p>
                </div>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter by label or content…"
                    className="h-9 pl-8 text-xs"
                  />
                </div>
              </div>

              <div className="max-h-96 space-y-2 overflow-y-auto scroll-thin pr-1">
                {filtered.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
                    No nodes match “{query}”.
                  </div>
                ) : (
                  filtered.map((n) => {
                    const meta = TYPE_META[n.type];
                    const w = typeof n.weight === "number" ? Math.max(0, Math.min(1, n.weight)) : 0.3;
                    return (
                      <NodeRow
                        key={n.id}
                        node={n}
                        meta={meta}
                        weight={w}
                        onHover={setHoveredId}
                      />
                    );
                  })
                )}
              </div>
            </Card>
          </motion.section>
        </>
      )}
    </div>
  );
}

/* ── legend ─────────────────────────────────────────────────────────── */

function Legend() {
  return (
    <div className="hidden flex-wrap gap-x-3 gap-y-1 sm:flex">
      {TYPE_ORDER.map((t) => {
        const meta = TYPE_META[t];
        return (
          <div key={t} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: meta.color }}
            />
            <span className="text-[10px] text-muted-foreground">{meta.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── node row ───────────────────────────────────────────────────────── */

function NodeRow({
  node,
  meta,
  weight,
  onHover,
}: {
  node: KnowledgeNodeRecord;
  meta: { color: string; chip: string; icon: string; label: string };
  weight: number;
  onHover: (id: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      className="rounded-lg border border-border/50 bg-background/40 p-3 transition-colors hover:border-emerald-500/30"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-1 h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: meta.color }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px]", meta.chip)}>
              {meta.label}
            </Badge>
            <p className="truncate text-sm font-semibold">{node.label}</p>
          </div>
          <p
            className={cn(
              "mt-1 text-xs leading-relaxed text-muted-foreground",
              !expanded && "line-clamp-2",
            )}
          >
            {node.content}
          </p>
          {node.content.length > 120 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-[10px] font-medium text-emerald-400 hover:underline"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <span className="font-mono text-[10px] text-muted-foreground">
            {weight.toFixed(2)}
          </span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border/50">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.round(weight * 100)}%`, backgroundColor: meta.color }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
