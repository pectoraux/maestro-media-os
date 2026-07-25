"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Share2, Network, ArrowRight, Search } from "lucide-react";

const EDGE_COLORS: Record<string, string> = {
  supports: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  contradicts: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  extends: "text-teal-400 border-teal-500/30 bg-teal-500/10",
  caused: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  learned_from: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  derived_from: "text-teal-400 border-teal-500/30 bg-teal-500/10",
  inspired: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  explains: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  belongs_to: "text-muted-foreground border-muted bg-muted/20",
  references: "text-muted-foreground border-muted bg-muted/20",
  evidence: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  reinforces: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  addresses: "text-teal-400 border-teal-500/30 bg-teal-500/10",
  applied_in: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  competitor_gap: "text-rose-400 border-rose-500/30 bg-rose-500/10",
};

const TYPE_COLORS: Record<string, string> = {
  pattern: "text-emerald-400",
  lesson: "text-amber-400",
  principle: "text-violet-400",
  history: "text-rose-400",
  audience_insight: "text-rose-400",
  creator_voice: "text-emerald-400",
  editorial: "text-amber-400",
  research: "text-teal-400",
  competitor: "text-amber-400",
  evidence: "text-teal-400",
};

export function KnowledgeGraphView() {
  const [search, setSearch] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { data: graph } = useQuery({ queryKey: ["knowledge-graph"], queryFn: () => api.getKnowledgeGraph() });
  const { data: neighbors } = useQuery({
    queryKey: ["node-neighbors", selectedNode],
    queryFn: () => api.getNodeNeighbors(selectedNode!),
    enabled: !!selectedNode,
  });

  const nodes = (graph?.nodes ?? []).filter(
    (n: any) => !search || n.label.toLowerCase().includes(search.toLowerCase()) || n.type.toLowerCase().includes(search.toLowerCase()),
  );
  const edges = graph?.edges ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30">
            <Share2 className="h-6 w-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Knowledge Graph</h1>
            <p className="text-sm text-muted-foreground">
              Typed nodes connected by typed edges. The Director reasons over relationships, not isolated documents.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Principle */}
      <Card className="border-teal-500/30 bg-teal-500/5 p-4">
        <p className="text-sm text-teal-200">
          <Network className="mr-2 inline h-4 w-4" />
          Nodes (concepts, frameworks, lessons, evidence, stories) connected by typed edges (supports, contradicts, extends, caused, learned_from). Click any node to traverse its relationships.
        </p>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Nodes" value={graph?.nodes.length ?? 0} />
        <StatCard label="Edges" value={graph?.edges.length ?? 0} />
        <StatCard label="Node types" value={Object.keys(graph?.nodeTypeCounts ?? {}).length} />
        <StatCard label="Edge types" value={Object.keys(graph?.edgeTypeCounts ?? {}).length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Nodes list */}
        <Card className="border-border/60 bg-card/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-semibold">Nodes</h2>
            <Badge variant="outline" className="ml-auto text-[10px]">{nodes.length}</Badge>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search nodes..." className="pl-7 text-sm" />
          </div>
          <div className="max-h-96 space-y-1.5 overflow-y-auto scroll-thin pr-1">
            {nodes.slice(0, 40).map((n: any) => (
              <button
                key={n.id}
                onClick={() => setSelectedNode(n.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-all",
                  selectedNode === n.id ? "border-emerald-500/40 bg-emerald-500/10" : "border-border/50 bg-background/40 hover:border-border",
                )}
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-full", TYPE_COLORS[n.type]?.replace("text-", "bg-") ?? "bg-muted")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{n.label}</p>
                  <p className="text-[10px] capitalize text-muted-foreground">{n.type.replace(/_/g, " ")}</p>
                </div>
                {n.connections > 0 && <span className="font-mono text-[10px] text-muted-foreground">{n.connections} links</span>}
              </button>
            ))}
          </div>
        </Card>

        {/* Node detail / neighbors */}
        <Card className="border-border/60 bg-card/40 p-5">
          <h2 className="mb-3 text-base font-semibold">Relationships</h2>
          {!selectedNode ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
              Select a node to see its relationships
            </div>
          ) : !neighbors ? (
            <div className="flex min-h-[200px] items-center justify-center text-xs text-muted-foreground">Loading…</div>
          ) : (
            <div className="space-y-3">
              {/* Selected node */}
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <p className="text-xs font-medium">{neighbors.node?.label}</p>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{neighbors.node?.content}</p>
                <Badge variant="outline" className="mt-2 text-[9px] capitalize">{neighbors.node?.type.replace(/_/g, " ")}</Badge>
              </div>
              {/* Neighbors */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{neighbors.neighbors.length} relationship{neighbors.neighbors.length === 1 ? "" : "s"}</p>
                {neighbors.neighbors.map((rel: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className="rounded-lg border border-border/50 bg-background/40 p-2"
                  >
                    <div className="flex items-center gap-2">
                      {rel.direction === "outgoing" ? (
                        <>
                          <span className="text-[10px] text-muted-foreground">this</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className={cn("text-[9px]", EDGE_COLORS[rel.relation] ?? "border-muted")}>{rel.relation.replace(/_/g, " ")}</Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="flex-1 truncate text-xs font-medium">{rel.node.label}</span>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 truncate text-xs font-medium">{rel.node.label}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className={cn("text-[9px]", EDGE_COLORS[rel.relation] ?? "border-muted")}>{rel.relation.replace(/_/g, " ")}</Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">this</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">{rel.node.content}</p>
                    <button onClick={() => setSelectedNode(rel.node.id)} className="mt-1 text-[10px] text-emerald-400 hover:underline">
                      → explore
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Edge type distribution */}
      <Card className="border-border/60 bg-card/40 p-5">
        <h2 className="mb-3 text-base font-semibold">Edge types</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(graph?.edgeTypeCounts ?? {}).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
            <Badge key={type} variant="outline" className={cn("text-[10px]", EDGE_COLORS[type] ?? "border-muted")}>
              {type.replace(/_/g, " ")} · {count as number}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border-border/60 bg-card/40 p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-teal-400">{value}</p>
    </Card>
  );
}
