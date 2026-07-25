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
  Scale,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  MessageSquare,
  Briefcase,
  Users,
  Scissors,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORY_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; description: string }> = {
  truthfulness: { label: "Truthfulness", icon: ShieldCheck, color: "text-emerald-400", description: "Never fabricate. Distinguish opinion from fact. Don't exaggerate certainty." },
  teaching: { label: "Teaching", icon: GraduationCap, color: "text-teal-400", description: "Explain before persuading. First principles. Show tradeoffs." },
  tone: { label: "Tone", icon: MessageSquare, color: "text-amber-400", description: "Curious, calm, never condescending. No manufactured urgency." },
  business: { label: "Business", icon: Briefcase, color: "text-violet-400", description: "No bad recommendations. Disclose sponsorships." },
  audience: { label: "Audience", icon: Users, color: "text-rose-400", description: "Respect beginners. Never optimize for outrage." },
  editing: { label: "Editing", icon: Scissors, color: "text-emerald-400", description: "Remove filler. Keep the strongest argument." },
};

const ENFORCEMENT_STYLE: Record<string, string> = {
  block: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  log: "border-muted bg-muted/20 text-muted-foreground",
};

function scoreColor(v: number): string {
  if (v >= 80) return "text-emerald-400";
  if (v >= 60) return "text-amber-400";
  return "text-rose-400";
}

export function ConstitutionView() {
  const qc = useQueryClient();
  const [checkContent, setCheckContent] = useState("");
  const [checkType, setCheckType] = useState("script");
  const [checkResult, setCheckResult] = useState<any>(null);

  const constitutionQuery = useQuery({ queryKey: ["constitution"], queryFn: () => api.getConstitution() });
  const violationsQuery = useQuery({ queryKey: ["constitution-violations"], queryFn: () => api.getConstitutionViolations() });
  const policiesQuery = useQuery({ queryKey: ["policies"], queryFn: () => api.getPolicies() });

  const checkMut = useMutation({
    mutationFn: () => api.checkConstitution({ artifactType: checkType, content: checkContent }),
    onSuccess: (data) => {
      setCheckResult(data);
      qc.invalidateQueries({ queryKey: ["constitution-violations"] });
      if (data.passed) toast.success(`Constitution aligned — ${data.overallAlignment}/100`);
      else toast.error(`Constitution violation — ${data.overallAlignment}/100 (${data.riskLevel} risk)`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const principlesByCategory: Record<string, any[]> = {};
  for (const p of constitutionQuery.data?.principles ?? []) {
    if (!principlesByCategory[p.category]) principlesByCategory[p.category] = [];
    principlesByCategory[p.category].push(p);
  }

  const sampleViolation = `You won't BELIEVE what happens when you use a vector database! This will DESTROY your performance! Act now before your competitors leave you behind! Everyone is doing it and you're missing out!`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-rose-500/20 border border-emerald-500/30">
            <Scale className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Creative Constitution</h1>
            <p className="text-sm text-muted-foreground">
              The <span className="text-foreground">why</span> layer. Not just preferences — principles. Authenticity becomes Constitutional AI: scoring alignment with principles, not just style.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Principle banner */}
      <Card className="border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-200">
          <Scale className="mr-2 inline h-4 w-4" />
          The Constitution governs everything. A publish gate can fail because <em>&ldquo;this thumbnail uses manufactured urgency that violates your constitution&rdquo;</em> or <em>&ldquo;this script exaggerates certainty beyond your evidence threshold.&rdquo;</em> That&apos;s far more valuable than merely sounding like the creator.
        </p>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Principles" value={constitutionQuery.data?.principles.length ?? "—"} icon={Scale} accent="text-emerald-400" />
        <StatCard label="Open violations" value={violationsQuery.data?.violations.length ?? "—"} icon={AlertTriangle} accent="text-rose-400" />
        <StatCard label="Policies" value={policiesQuery.data?.policies.length ?? "—"} icon={ShieldCheck} accent="text-amber-400" />
        <StatCard label="Categories" value={Object.keys(principlesByCategory).length} icon={Briefcase} accent="text-violet-400" />
      </div>

      {/* Constitution check */}
      <Card className="border-border/60 bg-card/40 p-5">
        <h2 className="mb-3 text-base font-semibold">Run a constitution check</h2>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Select value={checkType} onValueChange={setCheckType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="script">Script</SelectItem>
              <SelectItem value="trifecta">Holy Trifecta / Title</SelectItem>
              <SelectItem value="thumbnail">Thumbnail brief</SelectItem>
              <SelectItem value="scene">Production scene</SelectItem>
              <SelectItem value="metadata">Description / Metadata</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => { setCheckContent(sampleViolation); setCheckType("trifecta"); }} className="text-muted-foreground">
            Load violation sample
          </Button>
        </div>
        <Textarea
          value={checkContent}
          onChange={(e) => setCheckContent(e.target.value)}
          placeholder="Paste an artifact to check against the constitution..."
          className="min-h-[120px] resize-y text-sm"
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={() => checkMut.mutate()} disabled={!checkContent.trim() || checkMut.isPending} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
            {checkMut.isPending ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="mr-2 h-4 w-4 border-2 border-emerald-950/30 border-t-emerald-950 rounded-full" />
                Checking constitution…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Check constitution
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Check result */}
      {checkResult && <ConstitutionResult result={checkResult} />}

      {/* Principles by category */}
      <Card className="border-border/60 bg-card/40 p-5">
        <h2 className="mb-4 text-base font-semibold">Constitution principles</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {Object.entries(principlesByCategory).map(([cat, principles]) => {
            const meta = CATEGORY_META[cat] ?? CATEGORY_META.truthfulness;
            return (
              <div key={cat} className="rounded-xl border border-border/50 bg-background/40 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <meta.icon className={cn("h-4 w-4", meta.color)} />
                  <h3 className="text-sm font-semibold">{meta.label}</h3>
                  <Badge variant="outline" className="ml-auto text-[10px]">{principles.length}</Badge>
                </div>
                <p className="mb-3 text-[11px] text-muted-foreground">{meta.description}</p>
                <div className="space-y-2">
                  {principles.map((p) => (
                    <div key={p.id} className="rounded-lg bg-background/30 p-2">
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-xs font-medium">{p.principle}</p>
                        <Badge variant="outline" className={cn("text-[9px] uppercase", ENFORCEMENT_STYLE[p.enforcement])}>{p.enforcement}</Badge>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">{p.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Creative Policies */}
      <Card className="border-border/60 bg-card/40 p-5">
        <h2 className="mb-1 text-base font-semibold">Creative Policies</h2>
        <p className="mb-3 text-xs text-muted-foreground">Runtime rules that govern capability execution. Different from DNA (describes identity) — policies define boundaries.</p>
        <div className="space-y-2">
          {policiesQuery.data?.policies.map((p: any) => (
            <div key={p.id} className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold">{p.name}</p>
                  <Badge variant="outline" className="text-[9px] capitalize">{p.scope}</Badge>
                  <Badge variant="outline" className={cn("text-[9px]", p.action === "block" ? "border-rose-500/30 bg-rose-500/10 text-rose-300" : p.action === "require_approval" ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300")}>
                    {p.action.replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.rule}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Open violations */}
      {violationsQuery.data && violationsQuery.data.violations.length > 0 && (
        <Card className="border-rose-500/30 bg-rose-500/5 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-rose-300">
            <AlertTriangle className="h-4 w-4" /> Open violations ({violationsQuery.data.violations.length})
          </h2>
          <div className="max-h-72 space-y-2 overflow-y-auto scroll-thin pr-1">
            {violationsQuery.data.violations.map((v: any) => (
              <div key={v.id} className="rounded-lg border border-rose-500/20 bg-background/40 p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[9px] uppercase", ENFORCEMENT_STYLE[v.severity])}>{v.severity}</Badge>
                  <span className="text-xs font-medium capitalize">{v.category}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs font-medium">{v.principle}</p>
                <p className="mt-1 text-xs text-muted-foreground">{v.reason}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ConstitutionResult({ result }: { result: any }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className={cn("border p-5", result.passed ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5")}>
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {result.passed ? <CheckCircle2 className="h-8 w-8 text-emerald-400" /> : <XCircle className="h-8 w-8 text-rose-400" />}
            <div>
              <h3 className={cn("text-lg font-semibold", result.passed ? "text-emerald-300" : "text-rose-300")}>
                {result.passed ? "Constitution aligned" : "Constitution violation"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Alignment: <span className={cn("font-mono font-bold", scoreColor(result.overallAlignment))}>{result.overallAlignment}/100</span>
                {" · "}Risk: <span className={cn("font-medium", result.riskLevel === "low" ? "text-emerald-400" : result.riskLevel === "medium" ? "text-amber-400" : "text-rose-400")}>{result.riskLevel}</span>
                {" · "}{result.violations.length} violation{result.violations.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        {/* Category scores */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {result.categoryScores.map((cs: any) => {
            const meta = CATEGORY_META[cs.category] ?? CATEGORY_META.truthfulness;
            return (
              <div key={cs.category} className="rounded-lg border border-border/50 bg-background/40 p-2 text-center">
                <meta.icon className={cn("mx-auto mb-1 h-4 w-4", meta.color)} />
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{meta.label}</p>
                <p className={cn("font-mono text-lg font-bold", scoreColor(cs.score))}>{Math.round(cs.score)}</p>
              </div>
            );
          })}
        </div>

        {/* Violations */}
        {result.violations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Violations detected</p>
            {result.violations.map((v: any, i: number) => (
              <div key={i} className={cn("rounded-lg border p-3", ENFORCEMENT_STYLE[v.severity])}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[9px] uppercase", ENFORCEMENT_STYLE[v.severity])}>{v.severity}</Badge>
                  <span className="text-xs font-medium capitalize">{v.category}</span>
                  <span className="text-xs text-muted-foreground">— {v.principle}</span>
                </div>
                <p className="mt-1 text-xs">{v.reason}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function StatCard({ label, value, icon: IconCmp, accent }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; accent: string }) {
  return (
    <Card className="border-border/60 bg-card/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={cn("mt-1 font-mono text-2xl font-bold", accent)}>{value}</p>
        </div>
        <IconCmp className={cn("h-5 w-5", accent)} />
      </div>
    </Card>
  );
}
