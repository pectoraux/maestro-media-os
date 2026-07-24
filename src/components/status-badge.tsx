"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<string, string> = {
  discovery: "bg-muted text-muted-foreground border-border",
  research: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  scripting: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  packaging: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  production: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  publish: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  live: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  archived: "bg-muted text-muted-foreground border-border",
  approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  revised: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  succeeded: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  running: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  failed: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  idle: "bg-muted text-muted-foreground border-border",
  new: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  accepted: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  high: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("capitalize", cls, className)}>
      {status}
    </Badge>
  );
}
