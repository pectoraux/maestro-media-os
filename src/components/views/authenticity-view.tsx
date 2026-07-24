"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  ShieldAlert,
  Mic,
  Brain,
  Smile,
  Type,
  Scissors,
  Eye,
  Users,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const DIMENSIONS = [
  { key: "voice", label: "Voice", icon: Mic, description: "Matches Voice DNA" },
  { key: "reasoning", label: "Reasoning", icon: Brain, description: "Matches thinking style" },
  { key: "humor", label: "Humor", icon: Smile, description: "Matches humor style" },
  { key: "vocabulary", label: "Vocabulary", icon: Type, description: "Uses signature phrases" },
  { key: "editing", label: "Editing", icon: Scissors, description: "Matches structure/pacing" },
  { key: "visualIdentity", label: "Visual Identity", icon: Eye, description: "Matches visual language" },
  { key: "audienceExpectation", label: "Audience Expectation", icon: Users, description: "Meets expectations" },
] as const;

function scoreColor(v: number): string {
  if (v >= 80) return "text-emerald-400";
  if (v >= 60) return "text-amber-400";
  return "text-rose-400";
}
function scoreBar(v: number): string {
  if (v >= 80) return "bg-emerald-500";
  if (v >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

export function AuthenticityView() {
  const qc = useQueryClient();
  const [artifactType, setArtifactType] = useState("script");
  const [content, setContent] = useState("");
  const [result, setResult] = useState<any>(null);

  const checkMut = useMutation({
    mutationFn: () => api.checkAuthenticity({ type: artifactType, content }),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["authenticity-scores"] });
      if (data.passed) toast.success(`Authenticity check passed — ${data.overall}/100`);
      else toast.error(`Authenticity check blocked — ${data.overall}/100`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const scoresQuery = useQuery({ queryKey: ["authenticity-scores"], queryFn: () => api.listAuthenticityScores() });

  const sampleScript = `Everyone is reaching for a vector database right now. Most of them shouldn't. Here's why.

A vector database is just an index. It's not a solution. It's not magic. It's a way to search embeddings fast. And the problem is, most teams I've worked with don't actually have an embedding problem — they have a search problem they've misdiagnosed.

Let me show you what I mean. A fintech client of mine spent six weeks integrating Pinecone. Their p99 latency was 400 milliseconds. Four hundred. For a search query. We ripped it out, used a well-tuned BM25 plus a tiny reranker, and got to 60 milliseconds with better relevance. The vector database was solving a problem they didn't have.

So when do you actually need one? That's the real question. And the boring answer is: only when semantic similarity at scale is genuinely your bottleneck. Not when it sounds cool. Not when a vendor told you to. When your embeddings are mismatched to your query distribution, no database in the world will save you.`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-rose-500/20 border border-emerald-500/30">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Authenticity Engine</h1>
            <p className="text-sm text-muted-foreground">
              The differentiator. The question is not &ldquo;can AI generate this?&rdquo; but{" "}
              <span className="text-foreground">&ldquo;does this feel like this creator actually made it?&rdquo;</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Principle banner */}
      <Card className="border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-200">
          <ShieldCheck className="mr-2 inline h-4 w-4" />
          If authenticity drops below threshold, the OS <strong>refuses to publish</strong> until fixed. This is the enforcement layer that keeps AI amplifying the creator rather than replacing them.
        </p>
      </Card>

      {/* Check input */}
      <Card className="border-border/60 bg-card/40 p-5">
        <h2 className="mb-3 text-base font-semibold">Run an authenticity check</h2>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Select value={artifactType} onValueChange={setArtifactType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="script">Script</SelectItem>
              <SelectItem value="trifecta">Holy Trifecta</SelectItem>
              <SelectItem value="thumbnail">Thumbnail brief</SelectItem>
              <SelectItem value="scene">Production scene</SelectItem>
              <SelectItem value="full_production">Full production</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setContent(sampleScript); setArtifactType("script"); }}
            className="text-muted-foreground"
          >
            Load sample script
          </Button>
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste an artifact to check (script, title+hook, thumbnail brief, scene description)..."
          className="min-h-[180px] resize-y font-mono text-sm"
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Threshold: 70/100. Any dimension below 60 blocks publishing.
          </p>
          <Button
            onClick={() => checkMut.mutate()}
            disabled={!content.trim() || checkMut.isPending}
            className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
          >
            {checkMut.isPending ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="mr-2 h-4 w-4 border-2 border-emerald-950/30 border-t-emerald-950 rounded-full" />
                Scoring authenticity…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Run authenticity check
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Result */}
      {result && <AuthenticityResult result={result} />}

      {/* History */}
      <Card className="border-border/60 bg-card/40 p-5">
        <h2 className="mb-3 text-base font-semibold">Recent checks</h2>
        <div className="max-h-80 space-y-2 overflow-y-auto scroll-thin pr-1">
          {scoresQuery.data?.scores.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
              No authenticity checks yet. Run one above.
            </div>
          ) : (
            scoresQuery.data?.scores.slice(0, 15).map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
                {s.passed ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">
                    <span className="capitalize">{s.artifactType}</span> ·{" "}
                    <span className={scoreColor(s.overall)}>{s.overall}/100</span>
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {s.passed ? "Passed" : (s.blockingReason ?? "Blocked")}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function AuthenticityResult({ result }: { result: any }) {
  const dims = result.dimensions;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className={cn("border p-5", result.passed ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5")}>
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {result.passed ? (
              <ShieldCheck className="h-8 w-8 text-emerald-400" />
            ) : (
              <ShieldAlert className="h-8 w-8 text-rose-400" />
            )}
            <div>
              <h3 className={cn("text-lg font-semibold", result.passed ? "text-emerald-300" : "text-rose-300")}>
                {result.passed ? "Authentic — clear to publish" : "Blocked — below authenticity threshold"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Overall score: <span className={cn("font-mono font-bold", scoreColor(result.overall))}>{result.overall}/100</span> · threshold {result.threshold}
              </p>
            </div>
          </div>
        </div>

        {/* Dimensions grid */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DIMENSIONS.map((dim) => {
            const v = dims[dim.key] ?? 0;
            return (
              <div key={dim.key} className="rounded-lg border border-border/50 bg-background/40 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <dim.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{dim.label}</span>
                  </div>
                  <span className={cn("font-mono text-sm font-bold", scoreColor(v))}>{Math.round(v)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                  <motion.div
                    className={cn("h-full rounded-full", scoreBar(v))}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(4, Math.min(100, v))}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">{dim.description}</p>
              </div>
            );
          })}
        </div>

        {/* Rationale */}
        <div className="rounded-lg bg-background/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Engine rationale</p>
          <p className="mt-1 text-sm text-foreground/90">{result.rationale}</p>
        </div>

        {/* Blocking reason */}
        {!result.passed && result.blockingReason && (
          <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
            <p className="flex items-center gap-2 text-xs font-medium text-rose-300">
              <ShieldAlert className="h-4 w-4" /> Publishing blocked
            </p>
            <p className="mt-1 text-sm text-rose-200/90">{result.blockingReason}</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
