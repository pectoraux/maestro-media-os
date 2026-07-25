"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  ShieldAlert,
  FileSearch,
  Network,
  Brain,
  Eye,
  Users,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
} from "lucide-react";
import { toast } from "sonner";

function scoreColor(v: number, inverse = false): string {
  const adjusted = inverse ? 100 - v : v;
  if (adjusted >= 80) return "text-emerald-400";
  if (adjusted >= 60) return "text-amber-400";
  return "text-rose-400";
}
function scoreBar(v: number, inverse = false): string {
  const adjusted = inverse ? 100 - v : v;
  if (adjusted >= 80) return "bg-emerald-500";
  if (adjusted >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

export function TrustView() {
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [result, setResult] = useState<any>(null);

  const checkMut = useMutation({
    mutationFn: () => api.checkTrust({ artifactType: "script", content }),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["trust-profiles"] });
      if (data.reviewStatus === "approved") toast.success(`Trusted — ${data.trustScore}/100`);
      else if (data.reviewStatus === "rejected") toast.error(`Trust failed — ${data.trustScore}/100 (hallucination risk: ${data.hallucinationRisk})`);
      else toast(`Trust pending review — ${data.trustScore}/100`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const profilesQuery = useQuery({ queryKey: ["trust-profiles"], queryFn: () => api.listTrustProfiles() });
  const lifecycleQuery = useQuery({ queryKey: ["memory-lifecycle"], queryFn: () => api.getMemoriesByLifecycle() });

  const sampleContent = `A recent study from Stanford showed that 94% of engineering teams using vector databases saw a 3x improvement in search latency. The research, published in Nature Machine Intelligence, demonstrates that vector search fundamentally outperforms traditional keyword search. Industry leaders like OpenAI, Anthropic, and Google have all adopted this approach.`;

  const trustMetrics = result ? [
    { label: "Trust Score", value: result.trustScore, icon: ShieldCheck, inverse: false },
    { label: "Evidence", value: result.evidenceScore, icon: FileSearch, inverse: false },
    { label: "Source Diversity", value: result.sourceDiversity, icon: Network, inverse: false },
    { label: "Hallucination Risk", value: result.hallucinationRisk, icon: Brain, inverse: true },
    { label: "Authenticity", value: result.authenticityScore, icon: Eye, inverse: false },
    { label: "Constitution", value: result.constitutionAlignment, icon: ShieldCheck, inverse: false },
    { label: "Creator Confidence", value: result.creatorConfidence, icon: Users, inverse: false },
    { label: "Audience Confidence", value: result.audienceConfidence, icon: Users, inverse: false },
  ] : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-rose-500/20 border border-emerald-500/30">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Trust Engine</h1>
            <p className="text-sm text-muted-foreground">
              The platform&apos;s biggest differentiator. Not just &ldquo;is this authentic?&rdquo; but <span className="text-foreground">&ldquo;can the audience trust this?&rdquo;</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Principle */}
      <Card className="border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-200">
          <ShieldCheck className="mr-2 inline h-4 w-4" />
          Every artifact gets a trust profile: evidence score, source diversity, hallucination risk, authenticity, constitution alignment, creator &amp; audience confidence. Extensions can <strong>improve trust</strong>, not just generate content. This is the infrastructure layer that makes the platform defensible.
        </p>
      </Card>

      {/* Trust check */}
      <Card className="border-border/60 bg-card/40 p-5">
        <h2 className="mb-3 text-base font-semibold">Run a trust analysis</h2>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste an artifact to analyze for trustworthiness..."
          className="min-h-[120px] resize-y text-sm"
        />
        <div className="mt-3 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setContent(sampleContent)} className="text-muted-foreground">
            Load hallucination sample
          </Button>
          <Button onClick={() => checkMut.mutate()} disabled={!content.trim() || checkMut.isPending} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
            {checkMut.isPending ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="mr-2 h-4 w-4 border-2 border-emerald-950/30 border-t-emerald-950 rounded-full" />
                Analyzing trust…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Analyze trust
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className={cn("border p-5", result.reviewStatus === "approved" ? "border-emerald-500/40 bg-emerald-500/5" : result.reviewStatus === "rejected" ? "border-rose-500/40 bg-rose-500/5" : "border-amber-500/40 bg-amber-500/5")}>
            <div className="mb-5 flex items-center gap-3">
              {result.reviewStatus === "approved" ? <CheckCircle2 className="h-8 w-8 text-emerald-400" /> : result.reviewStatus === "rejected" ? <XCircle className="h-8 w-8 text-rose-400" /> : <AlertTriangle className="h-8 w-8 text-amber-400" />}
              <div>
                <h3 className={cn("text-lg font-semibold capitalize", result.reviewStatus === "approved" ? "text-emerald-300" : result.reviewStatus === "rejected" ? "text-rose-300" : "text-amber-300")}>
                  {result.reviewStatus}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Trust: <span className={cn("font-mono font-bold", scoreColor(result.trustScore))}>{result.trustScore}/100</span>
                </p>
              </div>
            </div>

            {/* Trust metrics grid */}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {trustMetrics.map((m) => (
                <div key={m.label} className="rounded-lg border border-border/50 bg-background/40 p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={cn("font-mono text-sm font-bold", scoreColor(m.value, m.inverse))}>{Math.round(m.value)}</span>
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                    <motion.div className={cn("h-full rounded-full", scoreBar(m.value, m.inverse))} initial={{ width: 0 }} animate={{ width: `${Math.max(4, Math.min(100, m.inverse ? 100 - m.value : m.value))}%` }} transition={{ duration: 0.6, delay: 0.1 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Risk factors */}
            {result.riskFactors.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Risk factors</p>
                <div className="space-y-1">
                  {result.riskFactors.map((rf: any, i: number) => (
                    <div key={i} className={cn("flex items-center gap-2 rounded-lg border p-2 text-xs", rf.severity === "high" ? "border-rose-500/30 bg-rose-500/10" : rf.severity === "medium" ? "border-amber-500/30 bg-amber-500/10" : "border-muted bg-muted/20")}>
                      <AlertTriangle className={cn("h-3 w-3", rf.severity === "high" ? "text-rose-400" : "text-amber-400")} />
                      <span className="flex-1">{rf.factor}</span>
                      <Badge variant="outline" className="text-[9px] uppercase">{rf.severity}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sources */}
            {result.sources.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Detected sources ({result.sources.length})</p>
                <div className="flex flex-wrap gap-1">
                  {result.sources.map((s: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px]">
                      {s.type} · {(s.reliability * 100).toFixed(0)}%
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Rationale */}
            <div className="rounded-lg bg-background/40 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Trust rationale</p>
              <p className="mt-1 text-sm text-foreground/90">{result.rationale}</p>
            </div>

            {/* Artifact Envelope */}
            <div className="mt-3 rounded-lg border border-violet-500/30 bg-violet-500/5 p-3">
              <p className="flex items-center gap-2 text-xs font-medium text-violet-300">
                <Package className="h-4 w-4" /> Artifact Envelope
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Every artifact carries: authenticity ({result.authenticityScore}), constitution ({result.constitutionAlignment}), confidence ({(result.trustScore / 100 * 100).toFixed(0)}%), provenance, sources, identityVersion, modelVersion, generatedBy.
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Memory Lifecycle */}
      <Card className="border-border/60 bg-card/40 p-5">
        <h2 className="mb-1 text-base font-semibold">Self-improving memory lifecycle</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Memories have lifecycle states. The system genuinely learns over time: observation → pattern → lesson → principle → constitution.
        </p>
        {/* Lifecycle stages */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {["observation", "pattern", "lesson", "principle", "constitution"].map((stage, i) => {
            const count = lifecycleQuery.data?.distribution?.[stage] ?? 0;
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
        {/* Memory list */}
        <div className="max-h-64 space-y-2 overflow-y-auto scroll-thin pr-1">
          {lifecycleQuery.data?.memories.slice(0, 15).map((m: any) => (
            <div key={m.id} className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
              <Badge variant="outline" className={cn("shrink-0 text-[9px] capitalize", m.lifecycle === "constitution" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : m.lifecycle === "principle" ? "border-violet-500/30 bg-violet-500/10 text-violet-300" : m.lifecycle === "lesson" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : m.lifecycle === "pattern" ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-muted bg-muted/20 text-muted-foreground")}>
                {m.lifecycle}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{m.label}</p>
                <p className="line-clamp-1 text-[11px] text-muted-foreground">{m.content}</p>
              </div>
              {m.lifecycle !== "constitution" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] text-emerald-400"
                  onClick={async () => {
                    try {
                      await api.promoteMemory(m.id);
                      toast.success(`Promoted to next lifecycle stage`);
                      qc.invalidateQueries({ queryKey: ["memory-lifecycle"] });
                    } catch (e) { toast.error((e as Error).message); }
                  }}
                >
                  Promote ↑
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Recent trust profiles */}
      <Card className="border-border/60 bg-card/40 p-5">
        <h2 className="mb-3 text-base font-semibold">Recent trust profiles</h2>
        <div className="max-h-64 space-y-2 overflow-y-auto scroll-thin pr-1">
          {profilesQuery.data?.profiles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
              No trust profiles yet. Run a trust analysis above.
            </div>
          ) : (
            profilesQuery.data?.profiles.slice(0, 15).map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-bold", p.trustScore >= 75 ? "bg-emerald-500/10 text-emerald-400" : p.trustScore >= 50 ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400")}>
                  {Math.round(p.trustScore)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium capitalize">{p.artifactType}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Hallucination risk: {p.hallucinationRisk} · Evidence: {p.evidenceScore} · Sources: {p.sourceDiversity}
                  </p>
                </div>
                <Badge variant="outline" className={cn("shrink-0 text-[9px] capitalize", p.reviewStatus === "approved" ? "border-emerald-500/30 text-emerald-300" : p.reviewStatus === "rejected" ? "border-rose-500/30 text-rose-300" : "border-amber-500/30 text-amber-300")}>
                  {p.reviewStatus}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
