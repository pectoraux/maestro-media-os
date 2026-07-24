"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OutputChannelRecord } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Plug,
  Radio,
  Share2,
  Check,
  Loader2,
  ArrowRight,
  Unplug,
  Plus,
  Layers3,
  Workflow,
} from "lucide-react";

/* ── category styling ───────────────────────────────────────────────── */

const CATEGORY_STYLES: Record<string, string> = {
  video: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  short: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  social: "border-teal-500/30 bg-teal-500/10 text-teal-300",
  text: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  audio: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

/* ── main view ──────────────────────────────────────────────────────── */

export function ConnectorsView() {
  const { data, isLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: () => api.listChannels(),
  });

  const channels = data?.channels ?? [];
  const connected = channels.filter((c) => c.status === "connected");

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Header />

      {/* Connected channels summary */}
      {connected.length > 0 && (
        <ConnectedSummary channels={connected} />
      )}

      {/* Channel grid */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Channels · {channels.length}
        </h2>
        {isLoading ? (
          <ChannelSkeletons />
        ) : channels.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border/50 p-8 text-xs text-muted-foreground">
            No output connectors registered.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((ch, i) => (
              <ChannelCard key={ch.id} channel={ch} delay={0.04 * i} />
            ))}
          </div>
        )}
      </section>

      {/* Multi-channel vision callout */}
      <VisionCallout connectedCount={connected.length} />
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
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1">
          <Plug className="h-3.5 w-3.5 text-teal-300" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-teal-200">
            Output Connectors
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">Output Connectors</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground lg:text-base">
          One production pipeline, many outputs. YouTube is the first channel — not the product.
          Connect more channels to distribute everywhere.
        </p>
      </div>
    </motion.section>
  );
}

/* ── connected channels summary ─────────────────────────────────────── */

function ConnectedSummary({ channels }: { channels: OutputChannelRecord[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="border-emerald-500/30 bg-emerald-500/5 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
              <Check className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-300">
                Distribution surface
              </p>
              <p className="font-mono text-sm font-semibold">
                {channels.length} channel{channels.length === 1 ? "" : "s"} connected
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2">
            {channels.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-background/40 px-2.5 py-1.5"
              >
                <Icon name={c.icon} className="h-3.5 w-3.5 text-emerald-300" />
                <span className="text-[11px] font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ── channel card ───────────────────────────────────────────────────── */

function ChannelCard({
  channel,
  delay,
}: {
  channel: OutputChannelRecord;
  delay: number;
}) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [channelName, setChannelName] = useState("");
  const isConnected = channel.status === "connected";
  const catCls = CATEGORY_STYLES[channel.category] ?? "border-border/60 bg-background/50";

  const connectMut = useMutation({
    mutationFn: () => api.connectChannel(channel.key, { channelName }),
    onSuccess: (res) => {
      toast.success(`Connected to ${res.channel.name}`);
      qc.invalidateQueries({ queryKey: ["channels"] });
      qc.invalidateQueries({ queryKey: ["os-overview"] });
      setDialogOpen(false);
      setChannelName("");
    },
    onError: (e: Error) => toast.error(e.message || "Connection failed"),
  });

  const disconnectMut = useMutation({
    mutationFn: () => api.disconnectChannel(channel.key),
    onSuccess: (res) => {
      toast.success(`Disconnected from ${res.channel.name}`);
      qc.invalidateQueries({ queryKey: ["channels"] });
      qc.invalidateQueries({ queryKey: ["os-overview"] });
    },
    onError: (e: Error) => toast.error(e.message || "Disconnect failed"),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card
        className={cn(
          "flex h-full flex-col border-border/60 bg-card/40 p-5",
          isConnected && "border-emerald-500/30",
        )}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl border",
                isConnected
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-border/60 bg-background/50",
              )}
            >
              <Icon
                name={channel.icon}
                className={cn("h-5 w-5", isConnected ? "text-emerald-300" : "text-muted-foreground")}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{channel.name}</h3>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {channel.key}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[10px]", catCls)}>
            {channel.category}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-xs leading-relaxed text-muted-foreground">{channel.description}</p>

        {/* Connected metadata */}
        {isConnected && channel.connectedAt && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Radio className="h-3 w-3 text-emerald-400" />
            connected {timeAgo(channel.connectedAt)}
          </div>
        )}

        {/* Footer action */}
        <div className="mt-auto flex items-center justify-between pt-4">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              isConnected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-border/60 bg-background/50 text-muted-foreground",
            )}
          >
            {channel.status}
          </Badge>

          {isConnected ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={disconnectMut.isPending}
              onClick={() => disconnectMut.mutate()}
              className="text-muted-foreground hover:text-rose-300"
            >
              {disconnectMut.isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Unplug className="mr-1 h-3.5 w-3.5" />
              )}
              Disconnect
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Connect
              </Button>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Icon name={channel.icon} className="h-5 w-5 text-emerald-300" />
                    </div>
                    <DialogTitle>Connect {channel.name}</DialogTitle>
                    <DialogDescription>
                      Enter your {channel.name} handle or channel name. This will register the
                      channel with the Director AI for multi-channel distribution.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Channel handle / name
                    </label>
                    <Input
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder={`e.g. @yourhandle or "Your Channel Name"`}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && channelName.trim()) {
                          connectMut.mutate();
                        }
                      }}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDialogOpen(false);
                        setChannelName("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!channelName.trim() || connectMut.isPending}
                      onClick={() => connectMut.mutate()}
                      className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                    >
                      {connectMut.isPending ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plug className="mr-1 h-3.5 w-3.5" />
                      )}
                      Connect
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

/* ── multi-channel vision callout ───────────────────────────────────── */

function VisionCallout({ connectedCount }: { connectedCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-teal-500/10 via-card/40 to-card/40 p-6 lg:p-8">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/15">
                <Share2 className="h-4 w-4 text-teal-300" />
              </div>
              <h3 className="text-base font-semibold">Produce once, distribute everywhere</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              When you connect more channels, the Director AI can compile multi-channel production
              plans that repurpose your content automatically — a 12-minute YouTube video becomes a
              TikTok short, a Twitter thread, a podcast excerpt and a blog post, all from one
              approved plan.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Workflow className="h-3 w-3 text-teal-300" /> Single plan, multiple outputs
              </span>
              <span className="flex items-center gap-1.5">
                <Layers3 className="h-3 w-3 text-teal-300" /> Automatic repurposing
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-teal-500/30 bg-background/40 p-5 text-center">
            <span className="font-mono text-3xl font-semibold text-teal-300">{connectedCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              channels connected
            </span>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
              <ArrowRight className="h-2.5 w-2.5" /> connect more to unlock multi-channel
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ── skeletons ──────────────────────────────────────────────────────── */

function ChannelSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-52 w-full" />
      ))}
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
