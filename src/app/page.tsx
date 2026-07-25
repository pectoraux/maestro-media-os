"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  Brain,
  Scale,
  ShieldCheck,
  TrendingUp,
  Github,
  Loader2,
  UserRound,
  Scissors,
  Clapperboard,
  Compass,
  Search,
  Shield,
  Eye,
  LayoutDashboard,
  Fingerprint,
  CheckCircle2,
} from "lucide-react";

type DemoRole = {
  key: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
};

const DEMO_ROLES: DemoRole[] = [
  { key: "creator", label: "Creator", desc: "The strategist & storyteller", icon: UserRound, accent: "emerald" },
  { key: "editor", label: "Editor", desc: "Cuts, polishes, packages", icon: Scissors, accent: "amber" },
  { key: "producer", label: "Producer", desc: "Orchestrates production", icon: Clapperboard, accent: "teal" },
  { key: "ai_director", label: "AI Director", desc: "Compiles plans from intent", icon: Compass, accent: "violet" },
  { key: "research_analyst", label: "Research Analyst", desc: "Scans signals & competitors", icon: Search, accent: "emerald" },
  { key: "administrator", label: "Administrator", desc: "Approves & governs access", icon: Shield, accent: "amber" },
  { key: "viewer", label: "Viewer", desc: "Read-only observer", icon: Eye, accent: "teal" },
];

const FEATURES = [
  {
    icon: Brain,
    title: "Creator Mind",
    desc: "A living model of the creator's intelligence — identity, constitution, knowledge, memory, goals, audiences, trust. Every output is an expression of this substrate.",
    accent: "text-emerald-400",
    border: "border-emerald-500/30",
    glow: "from-emerald-500/10",
  },
  {
    icon: Scale,
    title: "Creative Constitution",
    desc: "A governed set of principles the AI must respect — voice, values, boundaries. Every artifact is checked against the constitution before it ships.",
    accent: "text-violet-400",
    border: "border-violet-500/30",
    glow: "from-violet-500/10",
  },
  {
    icon: ShieldCheck,
    title: "Authenticity Engine",
    desc: "Not \u201cis this real?\u201d but \u201ccan the audience trust this?\u201d \u2014 evidence, source diversity, hallucination risk, and creator alignment scored on every artifact.",
    accent: "text-amber-400",
    border: "border-amber-500/30",
    glow: "from-amber-500/10",
  },
  {
    icon: TrendingUp,
    title: "Creator Venture Studio",
    desc: "The platform treats the creator as a startup — unfair advantages, creator-market fit, financial forecasts, and outcomes it optimizes toward.",
    accent: "text-rose-400",
    border: "border-rose-500/30",
    glow: "from-rose-500/10",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<undefined | null | { name?: string | null; role?: string; status?: string }>(undefined);
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSessionUser(data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setSessionUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDemo(role: string, label: string) {
    setPendingRole(role);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Demo failed");
      toast.success(`Signed in as ${label}`, {
        description: "Redirecting to your command center…",
      });
      router.push("/app");
    } catch (err) {
      toast.error("Couldn't start demo", { description: (err as Error).message });
      setPendingRole(null);
    }
  }

  function scrollToDemo() {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute -top-40 right-0 h-[36rem] w-[36rem] rounded-full bg-emerald-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-20 -left-40 h-[32rem] w-[32rem] rounded-full bg-violet-500/10 blur-[120px]" />

      <div className="relative flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border/40 bg-background/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/30 to-emerald-500/5 border border-emerald-500/40">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold tracking-tight">Maestro</span>
                <span className="hidden text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
                  Media OS
                </span>
              </div>
            </div>
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={scrollToDemo}
                className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                Demo
              </button>
              <a
                href="#features"
                className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                Features
              </a>
              {sessionUser ? (
                <Button
                  size="sm"
                  onClick={() => router.push("/app")}
                  className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/login")} className="text-muted-foreground">
                    Sign in
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => router.push("/signup")}
                    className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                  >
                    Join Waitlist
                  </Button>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero */}
          <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-3xl text-center"
            >
              <Badge
                variant="outline"
                className="mx-auto mb-6 border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-300"
              >
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
                AI Media Operating System
              </Badge>

              <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                <span className="text-gradient-emerald">Maestro</span>
                <span className="mt-2 block text-foreground/95">
                  the AI Media Operating System
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Identity-first. Capability-driven. Authenticity-governed. Maestro orchestrates a team of
                specialized AI agents — from opportunity discovery to publication — while keeping the
                creator&apos;s voice, judgment, and authenticity at the center of every decision.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => router.push("/signup")}
                  className="w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400 sm:w-auto"
                >
                  Join Waitlist
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={scrollToDemo}
                  className="w-full border-border/70 bg-card/40 hover:bg-emerald-500/10 hover:border-emerald-500/40 sm:w-auto"
                >
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  Try Demo
                </Button>
              </div>

              {sessionUser?.name && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 text-sm text-muted-foreground"
                >
                  Welcome back, <span className="text-emerald-300">{sessionUser.name}</span> — your
                  dashboard is ready.
                </motion.p>
              )}
            </motion.div>

            {/* Hero stat strip */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {[
                { k: "12+", v: "Specialized AI agents" },
                { k: "44", v: "Intelligence models" },
                { k: "9", v: "Trust dimensions" },
                { k: "∞", v: "Capability extensions" },
              ].map((s) => (
                <div
                  key={s.v}
                  className="rounded-xl border border-border/50 bg-card/30 px-4 py-3 text-center backdrop-blur-sm"
                >
                  <div className="font-mono text-2xl font-bold text-emerald-400">{s.k}</div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {s.v}
                  </div>
                </div>
              ))}
            </motion.div>
          </section>

          {/* Demo login */}
          <section id="demo" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4 }}
              className="mb-8 text-center"
            >
              <Badge
                variant="outline"
                className="mb-3 border-amber-500/40 bg-amber-500/10 text-[11px] uppercase tracking-[0.16em] text-amber-300"
              >
                No sign-up required
              </Badge>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Try Maestro — Continue as…
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                Pick a role and step straight into the operating system. Each demo session is sandboxed
                and pre-seeded with realistic projects, agents, and intelligence.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_ROLES.map((role, i) => {
                const isLoading = pendingRole === role.key;
                return (
                  <motion.button
                    key={role.key}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                    onClick={() => handleDemo(role.key, role.label)}
                    disabled={pendingRole !== null}
                    className={cn(
                      "group relative flex items-center gap-4 overflow-hidden rounded-xl border bg-card/40 p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-card/70 disabled:cursor-not-allowed disabled:opacity-60",
                      role.accent === "emerald" && "border-emerald-500/30 hover:border-emerald-500/60",
                      role.accent === "amber" && "border-amber-500/30 hover:border-amber-500/60",
                      role.accent === "teal" && "border-teal-500/30 hover:border-teal-500/60",
                      role.accent === "violet" && "border-violet-500/30 hover:border-violet-500/60",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border",
                        role.accent === "emerald" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
                        role.accent === "amber" && "border-amber-500/40 bg-amber-500/10 text-amber-400",
                        role.accent === "teal" && "border-teal-500/40 bg-teal-500/10 text-teal-400",
                        role.accent === "violet" && "border-violet-500/40 bg-violet-500/10 text-violet-400",
                      )}
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <role.icon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.label}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{role.desc}</p>
                    </div>
                  </motion.button>
                );
              })}

              {/* The 8th tile — informational */}
              <div className="flex items-center gap-4 rounded-xl border border-dashed border-border/60 bg-background/40 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
                  <Fingerprint className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground/80">Want your own space?</p>
                  <p className="mt-0.5">
                    <button
                      onClick={() => router.push("/signup")}
                      className="text-emerald-400 underline-offset-2 hover:underline"
                    >
                      Join the waitlist →
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section id="features" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4 }}
              className="mb-10 text-center"
            >
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Built on principles, not prompts
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
                Maestro isn&apos;t a faster way to make videos. It&apos;s durable, identity-driven
                infrastructure that compounds value for the creator over years.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <Card
                    className={cn(
                      "relative h-full overflow-hidden border bg-gradient-to-br to-transparent p-6 backdrop-blur-sm",
                      f.border,
                      f.glow,
                    )}
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-border/60 bg-background/60">
                      <f.icon className={cn("h-5 w-5", f.accent)} />
                    </div>
                    <h3 className="text-base font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Principles strip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mt-12 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8"
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {[
                  {
                    t: "Identity-first",
                    d: "The system maintains a model of who you are — your voice, beliefs, and boundaries come first.",
                  },
                  {
                    t: "Capability-driven",
                    d: "Capabilities are a marketplace. New models, formats, and connectors are replaceable components.",
                  },
                  {
                    t: "Authenticity-governed",
                    d: "Every artifact carries a Trust Envelope. The audience can verify what they're trusting.",
                  },
                ].map((p) => (
                  <div key={p.t}>
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <h4 className="text-sm font-semibold text-emerald-200">{p.t}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{p.d}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Final CTA */}
          <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card/40 to-violet-500/10 p-8 text-center sm:p-12"
            >
              <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
              <div className="relative">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Your Creator Mind is waiting.
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Join the waitlist. While you wait, complete your Creator Profile — it becomes the
                  foundation Maestro uses to know you from day one.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    onClick={() => router.push("/signup")}
                    className="w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400 sm:w-auto"
                  >
                    Join Waitlist
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push("/login")}
                    className="w-full border-border/70 bg-card/40 hover:bg-card/70 sm:w-auto"
                  >
                    Sign in
                  </Button>
                </div>
              </div>
            </motion.div>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-border/40 bg-background/60 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Maestro — the AI Media Operating System</span>
            </div>
            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <button onClick={scrollToDemo} className="transition-colors hover:text-foreground">
                Demo
              </button>
              <button
                onClick={() => router.push("/signup")}
                className="transition-colors hover:text-foreground"
              >
                Waitlist
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
