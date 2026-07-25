"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
  Flag,
  BookOpen,
  FileSearch,
  Clapperboard,
  Mic,
  Image as ImageIcon,
  MessageCircle,
  GraduationCap,
  Boxes,
  ArrowRight,
  GitBranch,
  Plus,
} from "lucide-react";

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; description: string }> = {
  idea: { label: "Idea", icon: Lightbulb, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", description: "A topic, thesis, or insight" },
  claim: { label: "Claim", icon: Flag, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", description: "A specific assertion to support" },
  story: { label: "Story", icon: BookOpen, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", description: "A narrative or anecdote" },
  evidence: { label: "Evidence", icon: FileSearch, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/30", description: "Data, citations, or examples" },
  scene: { label: "Scene", icon: Clapperboard, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30", description: "A visual sequence" },
  voice_performance: { label: "Voice Performance", icon: Mic, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", description: "Spoken delivery" },
  visual_asset: { label: "Visual Asset", icon: ImageIcon, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", description: "Images, graphics, or animations" },
  audience_reaction: { label: "Audience Reaction", icon: MessageCircle, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", description: "Comments, questions, objections, praise" },
  knowledge_asset: { label: "Knowledge Asset", icon: GraduationCap, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/30", description: "Evergreen frameworks and principles" },
};

const FILTER_TYPES = ["all", "idea", "claim", "story", "evidence", "scene", "voice_performance", "visual_asset", "audience_reaction", "knowledge_asset"];

export function PrimitivesView() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["primitives", filter],
    queryFn: () => api.listPrimitives(filter === "all" ? undefined : filter),
  });

  const primitives = (data?.primitives ?? []).filter(
    (p: any) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase()),
  );
  const counts = data?.counts ?? {};

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 border border-emerald-500/30">
            <Boxes className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Media Primitives</h1>
            <p className="text-sm text-muted-foreground">
              The creator isn&apos;t producing videos. They&apos;re producing <span className="text-foreground">ideas</span>. Everything else is a transformation.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Principle */}
      <Card className="border-violet-500/30 bg-violet-500/5 p-4">
        <p className="text-sm text-violet-200">
          <Boxes className="mr-2 inline h-4 w-4" />
          Format-independent creative building blocks. Extensions consume and produce these. Connectors transform them into platform-specific outputs. The kernel never thinks in terms of &ldquo;YouTube videos&rdquo; or &ldquo;tweets&rdquo; — only primitives.
        </p>
      </Card>

      {/* Type overview — the 9 primitive types */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {Object.entries(TYPE_META).map(([type, meta], i) => {
          const count = counts[type] ?? 0;
          return (
            <motion.button
              key={type}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              onClick={() => setFilter(filter === type ? "all" : type)}
              className={cn(
                "group flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                filter === type ? meta.bg : "border-border/50 bg-card/40 hover:border-border",
              )}
            >
              <div className={cn("rounded-lg bg-background/40 p-2", meta.color)}>
                <meta.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{meta.label}</p>
                <p className="truncate text-[10px] text-muted-foreground">{meta.description}</p>
              </div>
              <span className={cn("font-mono text-sm font-bold", count > 0 ? meta.color : "text-muted-foreground/50")}>{count}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search primitives..."
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-1">
          {FILTER_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === t ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
            >
              {t === "all" ? "All" : TYPE_META[t]?.label ?? t}
            </button>
          ))}
        </div>
      </div>

      {/* Primitives list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-border/50 bg-card/20" />
            ))}
          </div>
        ) : primitives.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 p-8 text-center text-sm text-muted-foreground">
            No primitives found. {filter !== "all" && <button onClick={() => setFilter("all")} className="text-emerald-400 hover:underline">Clear filter</button>}
          </div>
        ) : (
          primitives.map((p: any, i: number) => {
            const meta = TYPE_META[p.type] ?? TYPE_META.idea;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3) }}
              >
                <Card className="border-border/60 bg-card/40 p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("shrink-0 rounded-lg border p-2", meta.bg)}>
                      <meta.icon className={cn("h-4 w-4", meta.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{p.title}</h3>
                        <Badge variant="outline" className={cn("text-[10px] capitalize", meta.color)}>{meta.label}</Badge>
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{p.content}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="rounded bg-muted/40 px-1.5 py-0.5 font-mono">{p.source}</span>
                        {p.tags.map((tag: string) => (
                          <span key={tag} className="rounded bg-muted/30 px-1.5 py-0.5">#{tag}</span>
                        ))}
                        {p.parentId && (
                          <span className="flex items-center gap-0.5 text-violet-400">
                            <GitBranch className="h-3 w-3" /> derived
                          </span>
                        )}
                        {p.authenticityScore > 0 && (
                          <span className={cn("font-mono font-semibold", p.authenticityScore >= 70 ? "text-emerald-400" : "text-rose-400")}>
                            auth {p.authenticityScore}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Transformation callout */}
      <Card className="border-emerald-500/30 bg-emerald-500/5 p-5">
        <h3 className="mb-2 text-sm font-semibold text-emerald-300">How primitives become outputs</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded bg-background/60 px-2 py-1 text-emerald-300">Idea</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="rounded bg-background/60 px-2 py-1 text-amber-300">Claim + Evidence</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="rounded bg-background/60 px-2 py-1 text-rose-300">Story</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="rounded bg-background/60 px-2 py-1 text-violet-300">Scene</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="rounded bg-background/60 px-2 py-1 text-foreground">Script</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 font-medium text-emerald-300">YouTube / TikTok / Newsletter / Podcast</span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          One creative asset becomes many outputs. The creator produces ideas; the OS transforms them into every format via connectors.
        </p>
      </Card>
    </div>
  );
}
