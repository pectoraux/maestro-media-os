"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Code2, Package, Puzzle, Terminal, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const SDK_CODE = `import { defineExtension } from "@maestro/sdk";

export default defineExtension({
  id: "real-video",
  version: "2.1",
  name: "Realistic Video Studio",
  description: "Generate talking-head video, B-roll, lip sync...",

  capabilities: [
    {
      key: "video.generate",
      name: "Video Generation",
      description: "Generate talking-head video from script",
      inputs: ["script", "scene"],
      outputs: ["videoUrl"]
    },
    {
      key: "video.lipsync",
      name: "Lip Sync",
      description: "Sync audio to generated video",
      inputs: ["videoUrl", "audioUrl"],
      outputs: ["syncedVideoUrl"]
    }
  ],

  agents: ["Video Director"],
  connectors: ["runway", "veo", "kling"],
  workflows: ["youtube-video", "instagram-reel"],
  permissions: ["project.read", "video.generate", "asset.write"]
});`;

export function DeveloperView() {
  const qc = useQueryClient();
  const [manifestText, setManifestText] = useState("");

  const examplesQuery = useQuery({ queryKey: ["sdk-examples"], queryFn: () => api.getSDKExamples() });

  const publishMut = useMutation({
    mutationFn: (manifest: any) => api.publishExtension(manifest),
    onSuccess: (data) => {
      toast.success(`Extension "${data.extension.name}" published — available in the marketplace`);
      qc.invalidateQueries({ queryKey: ["extensions"] });
      qc.invalidateQueries({ queryKey: ["capabilities"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handlePublish = () => {
    try {
      const manifest = JSON.parse(manifestText);
      publishMut.mutate(manifest);
    } catch {
      toast.error("Invalid JSON. Check the manifest syntax.");
    }
  };

  const loadExample = (example: any) => {
    setManifestText(JSON.stringify(example, null, 2));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 border border-emerald-500/30">
            <Code2 className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Developer SDK</h1>
            <p className="text-sm text-muted-foreground">
              Publish extensions via <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-xs">defineExtension()</code>. The kernel discovers new capabilities automatically — no core code changes.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Principle */}
      <Card className="border-violet-500/30 bg-violet-500/5 p-4">
        <p className="text-sm text-violet-200">
          <Package className="mr-2 inline h-4 w-4" />
          Don&apos;t think in terms of agents. Agents are an implementation detail. A capability might be powered by a single model, a chain of models, or a human approval step — the Director only needs to know what it does, its inputs, outputs, cost, latency, and quality.
        </p>
      </Card>

      {/* SDK code reference */}
      <Card className="border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <h2 className="text-base font-semibold">defineExtension() reference</h2>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-black/40 p-4 text-xs leading-relaxed text-emerald-200/90 scroll-thin">
          <code>{SDK_CODE}</code>
        </pre>
      </Card>

      {/* Example manifests */}
      <Card className="border-border/60 bg-card/40 p-5">
        <h2 className="mb-3 text-base font-semibold">Example extensions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {examplesQuery.data?.examples.map((ex: any) => (
            <button
              key={ex.manifest.id}
              onClick={() => loadExample(ex.manifest)}
              className="group rounded-xl border border-border/50 bg-background/40 p-4 text-left transition-all hover:border-emerald-500/40"
            >
              <div className="mb-2 flex items-center gap-2">
                <Puzzle className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">{ex.name}</span>
                <Badge variant="outline" className="ml-auto font-mono text-[10px]">v{ex.manifest.version}</Badge>
              </div>
              <p className="mb-2 text-xs text-muted-foreground line-clamp-2">{ex.manifest.description}</p>
              <div className="flex flex-wrap gap-1">
                {ex.manifest.capabilities.map((c: any) => (
                  <Badge key={c.key} variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-300 font-mono">
                    {c.key}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100">
                Load into publisher <ArrowRight className="h-3 w-3" />
              </p>
            </button>
          ))}
        </div>
      </Card>

      {/* Publisher */}
      <Card className="border-border/60 bg-card/40 p-5">
        <h2 className="mb-3 text-base font-semibold">Publish an extension</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Paste a manifest JSON (or load an example above). The extension becomes available in the marketplace; install it to activate its capabilities.
        </p>
        <Textarea
          value={manifestText}
          onChange={(e) => setManifestText(e.target.value)}
          placeholder='{ "id": "my-extension", "version": "1.0", "name": "...", "capabilities": [...] }'
          className="min-h-[200px] resize-y font-mono text-xs"
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {manifestText ? `${manifestText.length} chars` : "No manifest loaded"}
          </p>
          <Button
            onClick={handlePublish}
            disabled={!manifestText.trim() || publishMut.isPending}
            className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
          >
            {publishMut.isPending ? "Publishing…" : (
              <>
                <Package className="mr-2 h-4 w-4" /> Publish extension
              </>
            )}
          </Button>
        </div>
        {publishMut.data && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-emerald-200">
              Published <strong>{publishMut.data.extension.name}</strong> · {publishMut.data.extension.capabilities.length} capabilities registered · available in marketplace
            </span>
          </motion.div>
        )}
      </Card>
    </div>
  );
}
