"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ProjectListItem, type ProjectDetail } from "@/lib/api";
import type { YouTubeConnectionRecord } from "@/lib/types";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Send,
  Youtube,
  Loader2,
  Plug,
  PlugZap,
  Unplug,
  Info,
  CheckCircle2,
  AlertTriangle,
  Tag,
  ListOrdered,
  MessageSquare,
  ListVideo,
  Calendar,
  LayoutDashboard,
  ShieldAlert,
  FolderKanban,
  ChevronRight,
  Hash,
  Sparkles,
  Package,
} from "lucide-react";

/* ── main view ──────────────────────────────────────────────────────── */

export function PublishView() {
  const { activeProjectId } = useApp();
  if (!activeProjectId) return <ProjectPicker />;
  return <PublishWorkspace projectId={activeProjectId} />;
}

function PublishWorkspace({ projectId }: { projectId: string }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Header projectId={projectId} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* YouTube connection */}
        <div className="lg:col-span-1">
          <YouTubeConnectionCard />
        </div>
        {/* Upload payload + publish action */}
        <div className="lg:col-span-2">
          <UploadPayloadCard projectId={projectId} />
        </div>
      </div>
    </div>
  );
}

/* ── header ─────────────────────────────────────────────────────────── */

function Header({ projectId }: { projectId: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-2"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1">
        <Send className="h-3.5 w-3.5 text-rose-400" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-rose-300">
          Caster · publishing manager · final human gate
        </span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">YouTube Publishing</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Package upload metadata, connect your channel, and publish — with human approval at
            every step.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{projectId.slice(-8)}</span>
        </div>
      </div>
    </motion.section>
  );
}

/* ── YouTube connection card ────────────────────────────────────────── */

function YouTubeConnectionCard() {
  const qc = useQueryClient();
  const [channelName, setChannelName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["youtube-connection"],
    queryFn: api.getYouTubeConnection,
  });

  const connectMut = useMutation({
    mutationFn: (name: string) => api.connectYouTube(name),
    onSuccess: (res) => {
      toast.success(`Connected to ${res.connection.channelName}`);
      setChannelName("");
      qc.invalidateQueries({ queryKey: ["youtube-connection"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to connect"),
  });

  const disconnectMut = useMutation({
    mutationFn: () => api.disconnectYouTube(),
    onSuccess: () => {
      toast.success("YouTube channel disconnected");
      qc.invalidateQueries({ queryKey: ["youtube-connection"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to disconnect"),
  });

  const connection: YouTubeConnectionRecord | null = data?.connection ?? null;
  const isConnected = connection && connection.status === "connected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
    >
      <Card className="h-full border-border/60 bg-card/40 p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
            <Youtube className="h-4 w-4 text-rose-400" />
          </div>
          <h2 className="text-sm font-semibold">YouTube channel</h2>
        </div>

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !isConnected ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed border-border/60 bg-background/40 p-4 text-center">
              <Plug className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">
                Not connected. Connect your YouTube channel to publish.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Channel name
              </label>
              <Input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="e.g. Creator Studio"
                disabled={connectMut.isPending}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && channelName.trim() && !connectMut.isPending) {
                    connectMut.mutate(channelName.trim());
                  }
                }}
              />
              <Button
                onClick={() => channelName.trim() && connectMut.mutate(channelName.trim())}
                disabled={!channelName.trim() || connectMut.isPending}
                className="w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              >
                {connectMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlugZap className="mr-2 h-4 w-4" />
                )}
                {connectMut.isPending ? "Connecting…" : "Connect YouTube channel"}
              </Button>
            </div>

            <div className="mt-2 flex items-start gap-2 rounded-lg border border-border/60 bg-background/40 p-3">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                In this sandbox, connecting records the channel. Real OAuth upload requires YouTube
                Data API credentials — the metadata packaging is real and production-ready.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-rose-400" />
                  <span className="text-sm font-semibold">{connection.channelName}</span>
                </div>
                <StatusBadge status="connected" />
              </div>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Channel ID</span>
                  <span className="font-mono text-foreground/80">
                    {connection.channelId || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Connected</span>
                  <span>{connection.connectedAt ? timeAgo(connection.connectedAt) : "—"}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => disconnectMut.mutate()}
              disabled={disconnectMut.isPending}
              variant="outline"
              className="w-full border-rose-500/30 bg-rose-500/5 text-rose-300 hover:bg-rose-500/10"
            >
              {disconnectMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Unplug className="mr-2 h-4 w-4" />
              )}
              {disconnectMut.isPending ? "Disconnecting…" : "Disconnect channel"}
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

/* ── upload payload card ────────────────────────────────────────────── */

function UploadPayloadCard({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.getProject(projectId),
    refetchInterval: 20000,
  });

  const publishMut = useMutation({
    mutationFn: () => api.publishToYouTube(projectId),
    onSuccess: (res) => {
      if (res.published) {
        toast.success(res.note || "Published to YouTube", {
          description: res.scheduledAt
            ? `Scheduled for ${new Date(res.scheduledAt).toLocaleString()}`
            : undefined,
        });
      } else {
        toast.error(res.note || "Publishing blocked");
      }
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["youtube-connection"] });
    },
    onError: (e: Error) => toast.error(e.message || "Publish failed"),
  });

  if (isLoading || !project) {
    return (
      <Card className="h-full border-border/60 bg-card/40 p-5">
        <Skeleton className="h-8 w-48" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    );
  }

  const readiness = computeReadiness(project);
  const ready = readiness.missing.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="space-y-5"
    >
      {/* Upload payload */}
      <Card className="border-border/60 bg-card/40 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Package className="h-4 w-4 text-emerald-400" />
            </div>
            <h2 className="text-sm font-semibold">Upload payload</h2>
          </div>
          <Badge
            variant="outline"
            className={cn(
              ready
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300",
            )}
          >
            {ready ? "Ready to publish" : `${readiness.missing.length} item(s) missing`}
          </Badge>
        </div>

        {/* Missing checklist */}
        {!ready && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <p className="text-xs font-semibold text-amber-200">
                Publishing readiness checklist
              </p>
            </div>
            <ul className="space-y-1.5">
              {readiness.missing.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-amber-200/90">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Payload fields */}
        <div className="space-y-4">
          {/* Title (from trifecta) */}
          <PayloadField
            icon={Sparkles}
            label="Title"
            value={project.trifecta?.title}
            missingHint="Run the Holy Trifecta optimizer first"
          />

          {/* Description */}
          <PayloadField
            icon={MessageSquare}
            label="Description"
            value={
              project.publishMetadata?.description
                ? truncate(project.publishMetadata.description, 220)
                : undefined
            }
            missingHint="Run the SEO Specialist (metadata stage)"
            mono={false}
          />

          {/* Tags */}
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Tags
              </span>
            </div>
            {project.publishMetadata?.tags && project.publishMetadata.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {project.publishMetadata.tags.map((t, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-300"
                  >
                    <Hash className="mr-0.5 h-2.5 w-2.5" />
                    {t}
                  </Badge>
                ))}
              </div>
            ) : (
              <MissingHint hint="No tags yet" />
            )}
          </div>

          {/* Chapters */}
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <ListOrdered className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Chapters
              </span>
            </div>
            {project.publishMetadata?.chapters &&
            project.publishMetadata.chapters.length > 0 ? (
              <div className="max-h-44 space-y-1 overflow-y-auto scroll-thin pr-1">
                {project.publishMetadata.chapters.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded border border-border/50 bg-background/40 px-2.5 py-1.5"
                  >
                    <span className="font-mono text-[11px] text-emerald-300">{c.timecode}</span>
                    <span className="text-xs text-foreground/90">{c.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <MissingHint hint="No chapters yet" />
            )}
          </div>

          {/* Other metadata as compact grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <PayloadField
              icon={MessageSquare}
              label="Pinned comment"
              value={
                project.publishMetadata?.pinnedComment
                  ? truncate(project.publishMetadata.pinnedComment, 100)
                  : undefined
              }
              missingHint="No pinned comment set"
              small
            />
            <PayloadField
              icon={ListVideo}
              label="Playlist"
              value={project.publishMetadata?.playlist || undefined}
              missingHint="No playlist assigned"
              small
            />
            <PayloadField
              icon={Calendar}
              label="Publish at"
              value={
                project.publishMetadata?.publishAt
                  ? new Date(project.publishMetadata.publishAt).toLocaleString()
                  : undefined
              }
              missingHint="Not scheduled"
              small
            />
            <PayloadField
              icon={LayoutDashboard}
              label="End screen"
              value={
                project.publishMetadata?.endScreen &&
                project.publishMetadata.endScreen.length > 0
                  ? `${project.publishMetadata.endScreen.length} element(s)`
                  : undefined
              }
              missingHint="No end-screen set"
              small
            />
          </div>
        </div>
      </Card>

      {/* Final publish action */}
      <Card className="border-border/60 bg-card/40 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Final human gate</p>
              <p className="mt-0.5 max-w-md text-xs leading-relaxed text-muted-foreground">
                This is the final approval before the video goes live. Publishing packages the
                metadata above and marks the project as scheduled / live. Make sure everything is
                right.
              </p>
            </div>
          </div>
          <Button
            onClick={() => publishMut.mutate()}
            disabled={!ready || publishMut.isPending}
            className={cn(
              "bg-emerald-500 text-emerald-950 hover:bg-emerald-400",
              !ready && "cursor-not-allowed opacity-60",
            )}
          >
            {publishMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {publishMut.isPending ? "Publishing…" : "Publish to YouTube"}
          </Button>
        </div>

        {publishMut.data && (
          <div
            className={cn(
              "mt-4 rounded-lg border p-3 text-xs",
              publishMut.data.published
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
                : "border-amber-500/30 bg-amber-500/5 text-amber-200",
            )}
          >
            <div className="flex items-center gap-2">
              {publishMut.data.published ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              )}
              <span className="font-semibold">{publishMut.data.note}</span>
            </div>
            {publishMut.data.scheduledAt && (
              <p className="mt-1 pl-6 text-[11px] text-muted-foreground">
                Scheduled for {new Date(publishMut.data.scheduledAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function PayloadField({
  icon: IconCmp,
  label,
  value,
  missingHint,
  mono = false,
  small = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
  missingHint: string;
  mono?: boolean;
  small?: boolean;
}) {
  const has = !!value && value.trim().length > 0;
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 p-3">
      <div className="mb-1 flex items-center gap-2">
        <IconCmp className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {has ? (
          <CheckCircle2 className="ml-auto h-3 w-3 text-emerald-400" />
        ) : (
          <AlertTriangle className="ml-auto h-3 w-3 text-amber-400" />
        )}
      </div>
      {has ? (
        <p
          className={cn(
            "leading-relaxed text-foreground/90",
            small ? "text-xs" : "text-sm",
            mono && "font-mono",
          )}
        >
          {value}
        </p>
      ) : (
        <MissingHint hint={missingHint} />
      )}
    </div>
  );
}

function MissingHint({ hint }: { hint: string }) {
  return <p className="text-[11px] italic text-muted-foreground">⚠ {hint}</p>;
}

/* ── readiness computation ──────────────────────────────────────────── */

function computeReadiness(project: ProjectDetail): {
  missing: string[];
} {
  const missing: string[] = [];
  if (!project.trifecta) {
    missing.push("⚠ No Holy Trifecta — run the optimizer first");
  }
  if (!project.publishMetadata) {
    missing.push("⚠ No upload metadata — run the SEO Specialist");
  } else {
    if (!project.publishMetadata.description) {
      missing.push("Description is empty — run the SEO Specialist");
    }
    if (!project.publishMetadata.tags || project.publishMetadata.tags.length === 0) {
      missing.push("No tags set — run the SEO Specialist");
    }
    if (
      !project.publishMetadata.chapters ||
      project.publishMetadata.chapters.length === 0
    ) {
      missing.push("No chapters defined");
    }
    if (!project.publishMetadata.publishAt) {
      missing.push("Publish time not scheduled");
    }
  }
  if (!project.scripts || !project.scripts.some((s) => s.stage === "final")) {
    missing.push("No final script — Quill must finish first");
  }
  return { missing };
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
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1">
          <Send className="h-3.5 w-3.5 text-rose-400" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-rose-300">
            Caster · publishing manager
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">YouTube Publishing</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Select a project to package its upload metadata and publish to YouTube.
        </p>
      </motion.section>

      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15">
          <FolderKanban className="h-6 w-6 text-rose-400" />
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
              className="group flex flex-col gap-2 rounded-xl border border-border/60 bg-card/40 p-4 text-left transition-all hover:border-rose-500/40 hover:bg-rose-500/5"
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-[10px] capitalize text-rose-300">
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
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-rose-400" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── helpers ────────────────────────────────────────────────────────── */

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}
