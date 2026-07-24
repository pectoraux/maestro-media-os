"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ProjectListItem } from "@/lib/api";
import type { ProductionSceneRecord } from "@/lib/types";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Clapperboard,
  Loader2,
  RefreshCw,
  Sparkles,
  FolderKanban,
  ChevronRight,
  Film,
  Quote,
  Captions,
  ArrowRight,
  Package,
  AlertTriangle,
  Clock,
  Wand2,
} from "lucide-react";

/* ── main view ──────────────────────────────────────────────────────── */

export function ProductionView() {
  const { activeProjectId } = useApp();
  if (!activeProjectId) return <ProjectPicker />;
  return <ProductionBlueprint projectId={activeProjectId} />;
}

function ProductionBlueprint({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["production-scenes", projectId],
    queryFn: () => api.getProductionScenes(projectId),
    refetchInterval: 15000,
  });

  const genMut = useMutation({
    mutationFn: () => api.generateProductionScenes(projectId, 14),
    onSuccess: (res) => {
      const n = res.scenes?.length ?? 0;
      toast.success(`Forge produced ${n} scene${n === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["production-scenes", projectId] });
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (e: Error) => toast.error(e.message || "Forge failed to build the blueprint"),
  });

  const scenes = data?.scenes ?? [];
  const generating = genMut.isPending;
  const errMsg = error ? (error as Error).message : genMut.error ? (genMut.error as Error).message : null;
  const needsScript =
    !!errMsg &&
    /no script|scriptwriter|script_writer|run script_writer/i.test(errMsg);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Header projectId={projectId} sceneCount={scenes.length} />

      {isLoading ? (
        <Skeletons />
      ) : scenes.length === 0 ? (
        <EmptyBlueprint
          onGenerate={() => genMut.mutate()}
          generating={generating}
          error={errMsg}
          needsScript={needsScript}
        />
      ) : (
        <div className="space-y-5">
          {/* Action bar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Clapperboard className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {scenes.length} scene{scenes.length === 1 ? "" : "s"} · target 14 min
                </p>
                <p className="text-xs text-muted-foreground">
                  Scene-by-scene editor instructions · B-roll · motion graphics · captions ·
                  transitions · asset requirements.
                </p>
              </div>
            </div>
            <Button
              onClick={() => genMut.mutate()}
              disabled={generating}
              variant="outline"
              className="border-amber-500/30 bg-amber-500/5 text-amber-200 hover:bg-amber-500/10"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {generating ? "Forge is regenerating…" : "Regenerate blueprint"}
            </Button>
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            {/* vertical spine */}
            <div className="absolute bottom-4 left-[19px] top-4 w-px bg-gradient-to-b from-emerald-500/40 via-border/60 to-transparent sm:left-[27px]" />
            <div className="space-y-4">
              {scenes.map((scene, i) => (
                <SceneCard key={scene.id} scene={scene} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── header ─────────────────────────────────────────────────────────── */

function Header({
  projectId,
  sceneCount,
}: {
  projectId: string;
  sceneCount: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-2"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
        <Clapperboard className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-amber-200">
          Forge · production designer
        </span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Production Blueprint</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Forge breaks the script into scene-by-scene editor instructions: B-roll, motion
            graphics, captions, transitions & asset requirements.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{projectId.slice(-8)}</span>
          {sceneCount > 0 && (
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 font-mono text-amber-300">
              {sceneCount} scenes
            </Badge>
          )}
        </div>
      </div>
    </motion.section>
  );
}

/* ── empty / loading / needs-script states ──────────────────────────── */

function EmptyBlueprint({
  onGenerate,
  generating,
  error,
  needsScript,
}: {
  onGenerate: () => void;
  generating: boolean;
  error: string | null;
  needsScript: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-border/60 bg-card/40 p-8 lg:p-12">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
            <Clapperboard className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-tight">No production blueprint yet</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Forge reads the final script and produces a scene-by-scene breakdown with B-roll,
            motion graphics, captions, transitions and asset requirements. Generation takes 15–25
            seconds and targets a 14-minute final video.
          </p>

          {!needsScript && (
            <Button
              onClick={onGenerate}
              disabled={generating}
              className="mt-6 bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              {generating ? "Forge is designing scene breakdowns…" : "Generate production blueprint"}
            </Button>
          )}

          {generating && !needsScript && (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-amber-400" />
              Reading final script · building 6–10 scenes · ~20s
            </p>
          )}

          {needsScript && (
            <div className="mt-6 max-w-md rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-left">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <p className="text-sm font-semibold text-amber-200">Final script required</p>
              </div>
              <p className="text-xs leading-relaxed text-amber-200/80">
                Forge needs a final script before it can build a production blueprint. Open the
                project workspace and run Quill (script_writer) through to the final stage first.
              </p>
            </div>
          )}

          {!needsScript && error && (
            <div className="mt-4 max-w-md rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function Skeletons() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-72 w-full" />
      ))}
    </div>
  );
}

/* ── scene card ─────────────────────────────────────────────────────── */

function SceneCard({ scene, index }: { scene: ProductionSceneRecord; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
      className="relative pl-10 sm:pl-14"
    >
      {/* timeline node */}
      <div className="absolute left-0 top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-500/40 bg-background text-amber-300 sm:h-14 sm:w-14">
        <span className="font-mono text-xs font-semibold sm:text-sm">{scene.sceneNumber}</span>
      </div>

      <Card className="border-border/60 bg-card/40 p-5">
        {/* header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 font-mono text-[11px] text-emerald-300"
            >
              <Clock className="mr-1 h-3 w-3" />
              {scene.timecode}
            </Badge>
            <h3 className="text-sm font-semibold">{scene.section}</h3>
          </div>
          {scene.retentionNotes && (
            <div className="flex max-w-md items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-1.5">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              <p className="text-[11px] leading-snug text-amber-200/90">{scene.retentionNotes}</p>
            </div>
          )}
        </div>

        {/* visual description */}
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
          {scene.visualDescription}
        </p>

        {/* grid of sub-sections */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* B-roll */}
          <SubSection icon={Film} accent="emerald" title="B-roll suggestions">
            {scene.brollSuggestions.length === 0 ? (
              <Empty mini />
            ) : (
              <ul className="space-y-2">
                {scene.brollSuggestions.map((b, i) => (
                  <li key={i} className="rounded-lg border border-border/50 bg-background/40 p-2.5">
                    <p className="text-xs leading-relaxed text-foreground/90">{b.description}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="font-mono uppercase tracking-wider">{b.source}</span>
                      {b.duration && (
                        <span className="rounded border border-border/60 px-1.5 py-0.5 font-mono">
                          {b.duration}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SubSection>

          {/* Motion graphics */}
          <SubSection icon={Sparkles} accent="amber" title="Motion graphics">
            {scene.motionGraphics.length === 0 ? (
              <Empty mini />
            ) : (
              <ul className="space-y-2">
                {scene.motionGraphics.map((g, i) => (
                  <li key={i} className="rounded-lg border border-border/50 bg-background/40 p-2.5">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-300"
                      >
                        {g.type}
                      </Badge>
                      {g.trigger && (
                        <span className="text-[10px] text-muted-foreground">on {g.trigger}</span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/90">{g.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </SubSection>

          {/* Editor instructions */}
          <SubSection icon={Quote} accent="emerald" title="Editor instructions" full>
            <blockquote className="rounded-r-lg border-l-2 border-emerald-500/50 bg-emerald-500/5 py-2 pl-3 pr-2 text-xs italic leading-relaxed text-foreground/90">
              {scene.editorInstructions || "—"}
            </blockquote>
          </SubSection>

          {/* Captions */}
          <SubSection icon={Captions} accent="emerald" title="Captions">
            {scene.captions.length === 0 ? (
              <Empty mini />
            ) : (
              <ul className="space-y-2">
                {scene.captions.map((c, i) => (
                  <li key={i} className="rounded-lg border border-border/50 bg-background/40 p-2.5">
                    <p className="text-xs leading-relaxed text-foreground/90">{c.text}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                      {c.timing && (
                        <span className="font-mono uppercase tracking-wider">{c.timing}</span>
                      )}
                      {c.style && (
                        <span className="rounded border border-border/60 px-1.5 py-0.5">{c.style}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SubSection>

          {/* Transitions */}
          <SubSection icon={ArrowRight} accent="amber" title="Transitions">
            {scene.transitions.length === 0 ? (
              <Empty mini />
            ) : (
              <ul className="space-y-2">
                {scene.transitions.map((t, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-background/40 p-2.5 text-xs"
                  >
                    <span className="text-foreground/90">{t.from}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-foreground/90">{t.to}</span>
                    {t.type && (
                      <Badge
                        variant="outline"
                        className="ml-auto border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-300"
                      >
                        {t.type}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SubSection>

          {/* Asset requirements */}
          <SubSection icon={Package} accent="rose" title="Asset requirements" full>
            {scene.assetRequirements.length === 0 ? (
              <Empty mini />
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {scene.assetRequirements.map((a, i) => {
                  const isMust =
                    a.priority.toLowerCase().includes("must") ||
                    a.priority.toLowerCase() === "required";
                  return (
                    <li
                      key={i}
                      className={cn(
                        "rounded-lg border p-2.5",
                        isMust
                          ? "border-rose-500/30 bg-rose-500/5"
                          : "border-border/50 bg-background/40",
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {a.type}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px]",
                            isMust
                              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                              : "border-border/60 bg-muted text-muted-foreground",
                          )}
                        >
                          {a.priority}
                        </Badge>
                      </div>
                      <p className="text-xs leading-relaxed text-foreground/90">{a.description}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </SubSection>
        </div>
      </Card>
    </motion.div>
  );
}

function SubSection({
  icon: IconCmp,
  accent,
  title,
  full,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent: "emerald" | "amber" | "rose";
  title: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  const accentCls =
    accent === "emerald"
      ? "bg-emerald-500/10 text-emerald-400"
      : accent === "amber"
        ? "bg-amber-500/10 text-amber-400"
        : "bg-rose-500/10 text-rose-400";
  return (
    <div className={cn(full && "lg:col-span-2")}>
      <div className="mb-2 flex items-center gap-2">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded", accentCls)}>
          <IconCmp className="h-3.5 w-3.5" />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      </div>
      <div className="max-h-60 overflow-y-auto scroll-thin pr-1">{children}</div>
    </div>
  );
}

function Empty({ mini }: { mini?: boolean }) {
  return (
    <p className={cn("text-muted-foreground", mini ? "text-[11px]" : "text-xs")}>None specified.</p>
  );
}

/* ── project picker ─────────────────────────────────────────────────── */

function ProjectPicker() {
  const { openProject } = useApp();
  const { data, isLoading } = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });
  const projects: ProjectListItem[] = data?.projects ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-2"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
          <Clapperboard className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-amber-200">
            Forge · production designer
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Production Blueprint</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Select a project to view its scene-by-scene editor instructions.
        </p>
      </motion.section>

      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15">
          <FolderKanban className="h-6 w-6 text-amber-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-card/30 p-10 text-center text-sm text-muted-foreground">
          No projects yet — discover an opportunity to begin.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => openProject(p.id)}
              className="group flex flex-col gap-2 rounded-xl border border-border/60 bg-card/40 p-4 text-left transition-all hover:border-amber-500/40 hover:bg-amber-500/5"
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] capitalize text-amber-300">
                  {p.stage.replace("_", " ")}
                </Badge>
                {p.opportunityScore != null && (
                  <span className="font-mono text-xs font-semibold text-emerald-400">
                    {Math.round(Number(p.opportunityScore))}
                  </span>
                )}
              </div>
              <p className="line-clamp-2 text-sm font-medium leading-tight">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.niche}</p>
              <div className="mt-auto flex items-center justify-between pt-1">
                <StatusBadge status={p.status} />
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-amber-400" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
