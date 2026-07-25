"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  ShieldAlert,
  ArrowLeft,
  Brain,
  Fingerprint,
  Scale,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't join waitlist");

      const position = data?.position;
      toast.success("You're on the waitlist!", {
        description: position
          ? `Position #${position}. Complete your Creator Profile next.`
          : "Complete your Creator Profile next.",
      });
      router.push("/waitlist");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-32 left-0 h-[28rem] w-[28rem] rounded-full bg-emerald-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 -right-32 h-[24rem] w-[24rem] rounded-full bg-amber-500/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center"
      >
        {/* Left — narrative */}
        <div className="hidden lg:block">
          <Link
            href="/"
            className="group mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to home
          </Link>

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
            Join the waitlist
          </div>

          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight">
            <span className="text-gradient-emerald">Build your Creator Mind</span>
            <br />
            before you arrive.
          </h1>

          <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            Join the waitlist. While you wait, complete your Creator Profile — it becomes the foundation
            of your Creator Mind. When you&apos;re approved, Maestro already knows a lot about you: your
            skills, your voice, your goals, and the audience you serve.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: Fingerprint, t: "Identity", d: "What you believe, what you reject, who you serve." },
              { icon: Brain, t: "Intelligence", d: "Skills, knowledge, and experiences you bring." },
              { icon: Scale, t: "Constitution", d: "Boundaries the AI must respect from day one." },
            ].map((p) => (
              <div key={p.t} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                  <p.icon className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{p.t}</p>
                  <p className="text-xs text-muted-foreground">{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div className="lg:hidden">
          <Link
            href="/"
            className="group mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to home
          </Link>
        </div>

        <div>
          <Card className="glass border-border/60 p-6 shadow-2xl shadow-emerald-500/5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/5 border border-emerald-500/40">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold leading-tight">Join the waitlist</h2>
                <p className="text-xs text-muted-foreground">A few details to reserve your spot.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Name <span className="text-muted-foreground/60">(optional)</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name or pen name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="h-10 bg-input/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@studio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-10 bg-input/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-10 bg-input/40"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
                >
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-10 w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining…
                  </>
                ) : (
                  <>
                    Join Waitlist
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-5">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                or
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Link href="/login">
                <Button variant="outline" className="h-10 w-full border-border/70 bg-background/40 hover:bg-muted/30">
                  I already have an account
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="h-10 w-full text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  Try Demo first
                </Button>
              </Link>
            </div>
          </Card>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Your Creator Profile becomes the foundation of your Creator Mind.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
