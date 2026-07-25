"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  TrendingUp, Sparkles, Target, DollarSign, Trophy, Zap, Brain,
  Shield, BarChart3, Rocket, Clock, Lightbulb, Play, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

function scoreColor(v: number): string {
  if (v >= 0.8) return "text-emerald-400";
  if (v >= 0.6) return "text-amber-400";
  return "text-rose-400";
}
function fitColor(v: number): string {
  if (v >= 80) return "text-emerald-400";
  if (v >= 60) return "text-amber-400";
  return "text-rose-400";
}
function fmtMoney(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}
function fmtNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return n.toString();
}

export function VentureView() {
  const qc = useQueryClient();
  const [forecastParams, setForecastParams] = useState({ videosPerWeek: 2, qualityLevel: 83, retention: 47, targetAudience: "Senior engineers" });

  const ventureQuery = useQuery({ queryKey: ["venture"], queryFn: () => api.getVenture() });
  const advantagesQuery = useQuery({ queryKey: ["unfair-advantages"], queryFn: () => api.getUnfairAdvantages() });
  const opportunitiesQuery = useQuery({ queryKey: ["market-opportunities"], queryFn: () => api.getMarketOpportunities() });
  const forecastsQuery = useQuery({ queryKey: ["forecasts"], queryFn: () => api.getForecasts() });
  const outcomesQuery = useQuery({ queryKey: ["outcomes"], queryFn: () => api.getOutcomes("active") });

  const discoverMut = useMutation({
    mutationFn: () => api.discoverUnfairAdvantages(),
    onSuccess: () => { toast.success("Unfair advantages discovered"); qc.invalidateQueries({ queryKey: ["unfair-advantages"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const fitMut = useMutation({
    mutationFn: (id: string) => api.computeMarketFit(id),
    onSuccess: () => { toast.success("Creator-Market Fit computed"); qc.invalidateQueries({ queryKey: ["market-opportunities"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const forecastMut = useMutation({
    mutationFn: () => api.generateForecast(forecastParams),
    onSuccess: () => { toast.success("Financial forecast generated"); qc.invalidateQueries({ queryKey: ["forecasts"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const venture = ventureQuery.data?.venture;
  const advantages = advantagesQuery.data?.advantages ?? [];
  const opportunities = opportunitiesQuery.data?.opportunities ?? [];
  const forecasts = forecastsQuery.data?.forecasts ?? [];
  const outcomes = outcomesQuery.data?.outcomes ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/30">
            <TrendingUp className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Creator Venture Studio</h1>
            <p className="text-sm text-muted-foreground">
              The platform maximizes the economic value of your unique abilities while remaining authentic. You&apos;re not a creator — you&apos;re a venture.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Principle */}
      <Card className="border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-200">
          <Rocket className="mr-2 inline h-4 w-4" />
          The optimization target is not &ldquo;better videos.&rdquo; It&apos;s <strong>the long-term success of the creator</strong> — audience, revenue, authority, products, and trust compounding over years.
        </p>
      </Card>

      {/* Venture overview */}
      {venture && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Trophy} label="Stage" value={venture.stage} accent="text-emerald-400" />
          <StatCard icon={DollarSign} label="Projected annual value" value={fmtMoney(venture.projectedValue)} accent="text-amber-400" />
          <StatCard icon={BarChart3} label="Revenue streams" value={venture.revenueStreams.length} accent="text-teal-400" />
          <StatCard icon={Clock} label="Execution capacity" value={`${venture.executionCapacity.hoursPerWeek}h/week`} accent="text-violet-400" />
        </div>
      )}

      {/* Vision */}
      {venture?.vision && (
        <Card className="border-border/60 bg-card/40 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-semibold">Venture vision</h2>
          </div>
          <p className="text-sm italic text-foreground/90">{venture.vision}</p>
        </Card>
      )}

      {/* Revenue streams */}
      {venture && venture.revenueStreams.length > 0 && (
        <Card className="border-border/60 bg-card/40 p-5">
          <h2 className="mb-3 text-base font-semibold">Revenue streams</h2>
          <div className="space-y-2">
            {venture.revenueStreams.map((rs: any, i: number) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
                <DollarSign className="h-4 w-4 shrink-0 text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{rs.type}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">${rs.currentMonthly}/mo</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-sm font-bold text-emerald-400">${rs.potentialMonthly}/mo</span>
                  </div>
                </div>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted/40">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (rs.currentMonthly / rs.potentialMonthly) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Unfair Advantages */}
      <Card className="border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-semibold">Unfair advantages</h2>
            <Badge variant="outline" className="text-[10px]">{advantages.length}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => discoverMut.mutate()} disabled={discoverMut.isPending} className="text-emerald-400">
            {discoverMut.isPending ? "Discovering…" : <><Sparkles className="mr-1 h-3.5 w-3.5" /> Discover</>}
          </Button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">What combination of skills, experiences, and personality is <strong>rare and hard to copy</strong>? That&apos;s the moat.</p>
        <div className="space-y-3">
          {advantages.map((a: any) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 bg-background/40 p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{a.title}</p>
                <div className="flex shrink-0 gap-1">
                  <Badge variant="outline" className={cn("text-[9px]", scoreColor(a.rarity))}>Rarity {Math.round(a.rarity * 100)}%</Badge>
                  <Badge variant="outline" className={cn("text-[9px]", scoreColor(a.defensibility))}>Moat {Math.round(a.defensibility * 100)}%</Badge>
                  <Badge variant="outline" className={cn("text-[9px]", scoreColor(a.monetization))}>$ {Math.round(a.monetization * 100)}%</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{a.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {a.components.map((c: any, i: number) => (
                  <span key={i} className="rounded bg-muted/30 px-1.5 py-0.5 text-[10px] capitalize">{c.type}: {c.value}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Market Opportunities + Creator-Market Fit */}
      <Card className="border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-teal-400" />
          <h2 className="text-base font-semibold">Market opportunities</h2>
          <Badge variant="outline" className="text-[10px]">{opportunities.length}</Badge>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">Not &ldquo;can this niche make money?&rdquo; but <strong>&ldquo;can THIS creator sustainably dominate THIS niche?&rdquo;</strong></p>
        <div className="space-y-2">
          {opportunities.map((o: any) => (
            <div key={o.id} className="rounded-xl border border-border/50 bg-background/40 p-3">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{o.niche}</p>
                  <p className="text-[11px] text-muted-foreground">{o.audience}</p>
                </div>
                {o.creatorMarketFit > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className={cn("font-mono text-lg font-bold", fitColor(o.creatorMarketFit))}>{Math.round(o.creatorMarketFit)}</span>
                    <span className="text-[10px] text-muted-foreground">fit</span>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => fitMut.mutate(o.id)} disabled={fitMut.isPending} className="h-7 text-[10px] text-emerald-400">
                    {fitMut.isPending ? "Computing…" : "Compute fit"}
                  </Button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[9px] capitalize">{o.marketSize}</Badge>
                <Badge variant="outline" className="text-[9px] capitalize">{o.competition} comp</Badge>
                <Badge variant="outline" className="text-[9px] capitalize">{o.growthRate}</Badge>
                <Badge variant="outline" className="text-[9px] capitalize">{o.monetization} $</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Financial Forecast */}
      <Card className="border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          <h2 className="text-base font-semibold">Financial forecast</h2>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">If you publish consistently, what happens? Conservative / Expected / Aggressive scenarios with confidence intervals.</p>
        {/* Forecast params */}
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <label className="text-[10px] uppercase text-muted-foreground">Videos/week</label>
            <Input type="number" value={forecastParams.videosPerWeek} onChange={(e) => setForecastParams({ ...forecastParams, videosPerWeek: Number(e.target.value) })} className="h-8 text-sm" />
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground">Quality</label>
            <Input type="number" value={forecastParams.qualityLevel} onChange={(e) => setForecastParams({ ...forecastParams, qualityLevel: Number(e.target.value) })} className="h-8 text-sm" />
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground">Retention %</label>
            <Input type="number" value={forecastParams.retention} onChange={(e) => setForecastParams({ ...forecastParams, retention: Number(e.target.value) })} className="h-8 text-sm" />
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground">Audience</label>
            <Input value={forecastParams.targetAudience} onChange={(e) => setForecastParams({ ...forecastParams, targetAudience: e.target.value })} className="h-8 text-sm" />
          </div>
        </div>
        <Button onClick={() => forecastMut.mutate()} disabled={forecastMut.isPending} className="mb-4 bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
          {forecastMut.isPending ? (
            <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="mr-2 h-4 w-4 border-2 border-emerald-950/30 border-t-emerald-950 rounded-full" /> Forecasting…</>
          ) : (
            <><Play className="mr-2 h-4 w-4" /> Generate forecast</>
          )}
        </Button>
        {/* Forecast results */}
        {forecasts.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {forecasts.slice(0, 3).map((f: any) => (
              <div key={f.id} className={cn("rounded-xl border p-4", f.scenario === "conservative" ? "border-amber-500/30 bg-amber-500/5" : f.scenario === "expected" ? "border-emerald-500/30 bg-emerald-500/5" : "border-violet-500/30 bg-violet-500/5")}>
                <p className={cn("mb-2 text-xs font-semibold capitalize", f.scenario === "conservative" ? "text-amber-300" : f.scenario === "expected" ? "text-emerald-300" : "text-violet-300")}>{f.scenario}</p>
                <div className="space-y-1.5 text-xs">
                  <ForecastRow label="Subscribers" value={fmtNum(f.projections.subscribers)} />
                  <ForecastRow label="Monthly views" value={fmtNum(f.projections.monthlyViews)} />
                  <ForecastRow label="Sponsorship" value={fmtMoney(f.projections.sponsorshipRevenue)} />
                  <ForecastRow label="Course sales" value={fmtMoney(f.projections.courseSales)} />
                  <ForecastRow label="Consulting leads" value={`${f.projections.consultingLeads}/mo`} />
                  <div className="border-t border-border/40 pt-1.5">
                    <ForecastRow label="ARR" value={fmtMoney(f.projections.arr)} bold />
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">Confidence: {Math.round(f.confidence * 100)}%</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Outcomes */}
      <Card className="border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-rose-400" />
          <h2 className="text-base font-semibold">Outcomes — the optimization target</h2>
          <Badge variant="outline" className="ml-auto text-[10px]">{outcomes.length} active</Badge>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">Every recommendation answers: <strong>&ldquo;Does this move the creator closer to the outcome?&rdquo;</strong></p>
        <div className="grid gap-3 sm:grid-cols-2">
          {outcomes.map((o: any) => (
            <div key={o.id} className="rounded-xl border border-border/50 bg-background/40 p-3">
              <div className="mb-1 flex items-center gap-2">
                <p className="flex-1 text-xs font-medium">{o.title}</p>
                <Badge variant="outline" className={cn("text-[9px]", o.priority === "critical" ? "border-rose-500/30 text-rose-300" : o.priority === "high" ? "border-amber-500/30 text-amber-300" : "border-muted text-muted-foreground")}>{o.priority}</Badge>
              </div>
              {o.target && <p className="text-[10px] text-muted-foreground">Target: {o.target}</p>}
              {o.deadline && <p className="text-[10px] text-muted-foreground">Deadline: {o.deadline}</p>}
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/40">
                  <motion.div className="h-full rounded-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${o.progress * 100}%` }} transition={{ duration: 0.6, delay: 0.2 }} />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">{Math.round(o.progress * 100)}%</span>
              </div>
              {o.milestones.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {o.milestones.map((m: any, i: number) => (
                    <span key={i} className={cn("rounded px-1.5 py-0.5 text-[9px]", m.done ? "bg-emerald-500/15 text-emerald-300" : "bg-muted/30 text-muted-foreground")}>
                      {m.done ? "✓" : "○"} {m.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Roadmap */}
      {venture && venture.roadmap.length > 0 && (
        <Card className="border-border/60 bg-card/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Rocket className="h-4 w-4 text-violet-400" />
            <h2 className="text-base font-semibold">Execution roadmap</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {venture.roadmap.map((q: any, i: number) => (
              <div key={i} className="rounded-xl border border-border/50 bg-background/40 p-3">
                <p className="mb-2 text-xs font-semibold text-violet-300">{q.quarter}</p>
                <div className="space-y-1">
                  {q.milestones.map((m: string, j: number) => (
                    <div key={j} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/50" />
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; accent: string }) {
  return (
    <Card className="border-border/60 bg-card/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={cn("mt-1 font-mono text-xl font-bold capitalize", accent)}>{value}</p>
        </div>
        <Icon className={cn("h-5 w-5", accent)} />
      </div>
    </Card>
  );
}

function ForecastRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono", bold ? "font-bold text-emerald-300" : "")}>{value}</span>
    </div>
  );
}
