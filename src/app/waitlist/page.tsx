"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Loader2,
  ShieldAlert,
  Clock,
  Gauge,
  Save,
  Brain,
  Fingerprint,
  Target,
  Users,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Eye,
  Hourglass,
  Scale,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  country: string | null;
  occupation: string | null;
  skills: string[];
  experience: string | null;
  goals: string[];
  targetPlatforms: string[];
  interests: string[];
  existingAudience: string | null;
  youtubeChannel: string | null;
  xAccount: string | null;
  linkedinUrl: string | null;
  preferredFormats: string[];
  monetizationGoals: string | null;
  availableHours: number | null;
  personality: string | null;
  readinessScore: number;
  readinessBreakdown: Record<string, number>;
  position: number;
  status: string;
  createdAt: string;
  approvedAt: string | null;
}

interface ReadinessInput {
  skills: string[];
  experience?: string;
  goals: string[];
  targetPlatforms: string[];
  interests: string[];
  existingAudience?: string;
  youtubeChannel?: string;
  xAccount?: string;
  linkedinUrl?: string;
  preferredFormats: string[];
  monetizationGoals?: string;
  availableHours: number;
  personality?: string;
}

// Client-side mirror of computeReadinessScore from src/lib/auth.ts
function computeReadinessScore(input: ReadinessInput): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {
    skills: 0,
    experience: 0,
    goals: 0,
    audience: 0,
    platforms: 0,
    completeness: 0,
  };
  breakdown.skills = input.skills.length >= 5 ? 20 : input.skills.length >= 3 ? 15 : input.skills.length >= 1 ? 10 : 0;
  breakdown.experience = input.experience && input.experience.length > 10 ? 15 : 0;
  breakdown.goals = input.goals.length >= 3 ? 15 : input.goals.length >= 1 ? 10 : 0;
  const socialLinks = [input.youtubeChannel, input.xAccount, input.linkedinUrl].filter(Boolean).length;
  breakdown.audience = input.existingAudience && socialLinks >= 2 ? 20 : input.existingAudience || socialLinks >= 1 ? 10 : 0;
  breakdown.platforms = input.targetPlatforms.length >= 2 ? 15 : input.targetPlatforms.length >= 1 ? 10 : 0;
  const fields = [
    input.skills.length > 0,
    input.experience,
    input.goals.length > 0,
    input.targetPlatforms.length > 0,
    input.interests.length > 0,
    input.preferredFormats.length > 0,
    input.monetizationGoals,
    input.personality,
    input.availableHours > 0,
  ];
  const filled = fields.filter(Boolean).length;
  breakdown.completeness = Math.round((filled / fields.length) * 15);
  const score = Math.round(Object.values(breakdown).reduce((s, v) => s + v, 0));
  return { score, breakdown };
}

const PLATFORMS = ["YouTube", "TikTok", "Instagram", "X", "LinkedIn", "Podcast", "Newsletter", "Blog"];
const FORMATS = ["Long-form", "Shorts", "Newsletter", "Podcast", "Course"];

const BREAKDOWN_META: { key: string; label: string; max: number; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { key: "skills", label: "Skills", max: 20, icon: Brain, color: "text-emerald-400" },
  { key: "experience", label: "Experience", max: 15, icon: Hourglass, color: "text-amber-400" },
  { key: "goals", label: "Goals", max: 15, icon: Target, color: "text-rose-400" },
  { key: "audience", label: "Audience", max: 20, icon: Users, color: "text-teal-400" },
  { key: "platforms", label: "Platforms", max: 15, icon: TrendingUp, color: "text-violet-400" },
  { key: "completeness", label: "Completeness", max: 15, icon: CheckCircle2, color: "text-emerald-400" },
];

function parseTags(v: string | string[] | null | undefined): string[] {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  return v
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function tagsToString(arr: string[]): string {
  return arr.join(", ");
}

// ── Gauge ────────────────────────────────────────────────────────────────────
function ScoreGauge({ score, size = 168 }: { score: number; size?: number }) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circ - (pct / 100) * circ;
  const colorClass =
    pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-rose-400";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted/40"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={cn("transition-colors", colorClass)}
          style={{ stroke: "currentColor" }}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-mono text-4xl font-bold", colorClass)}>{Math.round(pct)}</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export default function WaitlistPage() {
  const router = useRouter();
  const [entry, setEntry] = useState<WaitlistEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [skills, setSkills] = useState("");
  const [occupation, setOccupation] = useState("");
  const [country, setCountry] = useState("");
  const [experience, setExperience] = useState("");
  const [goals, setGoals] = useState("");
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>([]);
  const [interests, setInterests] = useState("");
  const [existingAudience, setExistingAudience] = useState("");
  const [youtubeChannel, setYoutubeChannel] = useState("");
  const [xAccount, setXAccount] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [preferredFormats, setPreferredFormats] = useState<string[]>([]);
  const [monetizationGoals, setMonetizationGoals] = useState("");
  const [availableHours, setAvailableHours] = useState<string>("10");
  const [personality, setPersonality] = useState("");

  // Load entry
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/waitlist", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login?redirect=/waitlist");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (data?.entry) {
          const e = data.entry as WaitlistEntry;
          setEntry(e);
          setSkills(tagsToString(e.skills));
          setOccupation(e.occupation ?? "");
          setCountry(e.country ?? "");
          setExperience(e.experience ?? "");
          setGoals(tagsToString(e.goals));
          setTargetPlatforms(e.targetPlatforms ?? []);
          setInterests(tagsToString(e.interests));
          setExistingAudience(e.existingAudience ?? "");
          setYoutubeChannel(e.youtubeChannel ?? "");
          setXAccount(e.xAccount ?? "");
          setLinkedinUrl(e.linkedinUrl ?? "");
          setPreferredFormats(e.preferredFormats ?? []);
          setMonetizationGoals(e.monetizationGoals ?? "");
          setAvailableHours(String(e.availableHours ?? 10));
          setPersonality(e.personality ?? "");
        }
      } catch {
        if (!cancelled) setError("Couldn't load your waitlist entry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Live readiness preview (client-side mirror)
  const livePreview = useMemo(() => {
    return computeReadinessScore({
      skills: parseTags(skills),
      experience,
      goals: parseTags(goals),
      targetPlatforms,
      interests: parseTags(interests),
      existingAudience,
      youtubeChannel,
      xAccount,
      linkedinUrl,
      preferredFormats,
      monetizationGoals,
      availableHours: Number(availableHours) || 0,
      personality,
    });
  }, [skills, experience, goals, targetPlatforms, interests, existingAudience, youtubeChannel, xAccount, linkedinUrl, preferredFormats, monetizationGoals, availableHours, personality]);

  function togglePlatform(p: string) {
    setTargetPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }
  function toggleFormat(f: string) {
    setPreferredFormats((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: entry?.name ?? undefined,
        country: country || undefined,
        occupation: occupation || undefined,
        skills: parseTags(skills),
        experience: experience || undefined,
        goals: parseTags(goals),
        targetPlatforms,
        interests: parseTags(interests),
        existingAudience: existingAudience || undefined,
        youtubeChannel: youtubeChannel || undefined,
        xAccount: xAccount || undefined,
        linkedinUrl: linkedinUrl || undefined,
        preferredFormats,
        monetizationGoals: monetizationGoals || undefined,
        availableHours: Number(availableHours) || 0,
        personality: personality || undefined,
      };
      const res = await fetch("/api/waitlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't save profile");
      setEntry(data.entry as WaitlistEntry);
      toast.success("Creator Profile saved", {
        description: `Readiness score is now ${data.entry.readinessScore}/100.`,
      });
    } catch (err) {
      setError((err as Error).message);
      toast.error("Save failed", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          Loading your waitlist entry…
        </div>
      </div>
    );
  }

  const approved = entry?.status === "approved";

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-40 right-0 h-[32rem] w-[32rem] rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-[11px] uppercase tracking-[0.16em] text-emerald-300"
            >
              <span className="mr-1 h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
              {approved ? "Approved" : "On the waitlist"}
            </Badge>
            {entry?.email && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {entry.email}
              </Badge>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                {approved ? "You're approved." : "You're on the waitlist."}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                {approved
                  ? "Welcome to Maestro. Your Creator Mind is ready — head to the dashboard to start."
                  : "Complete your Creator Profile while you wait. It becomes the foundation Maestro uses to know you from day one."}
              </p>
              {approved && (
                <Button
                  className="mt-4 bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                  onClick={() => router.push("/app")}
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {!approved && (
              <Card className="border-emerald-500/30 bg-emerald-500/5 p-5 text-center sm:min-w-[220px]">
                <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">
                  Your position
                </div>
                <div className="my-1 font-mono text-5xl font-bold text-emerald-400">
                  #{entry?.position ?? "—"}
                </div>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Est. access: <span className="text-foreground/80">2–3 weeks</span>
                </div>
              </Card>
            )}
          </div>
        </motion.div>

        {/* Readiness + breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr]"
        >
          <Card className="flex flex-col items-center justify-center border-border/60 bg-card/40 p-6">
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Gauge className="h-4 w-4 text-emerald-400" />
              Creator Readiness
            </div>
            <ScoreGauge score={livePreview.score} />
            <div className="mt-3 text-center text-xs text-muted-foreground">
              {livePreview.score >= 80
                ? "Outstanding — your Creator Mind is rich."
                : livePreview.score >= 50
                  ? "Good progress. Keep adding detail."
                  : "Add more detail to raise your score."}
            </div>
            {entry && livePreview.score !== entry.readinessScore && (
              <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-400">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-amber-400" />
                Unsaved changes
              </div>
            )}
          </Card>

          <Card className="border-border/60 bg-card/40 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold">Score breakdown</h2>
              </div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Live preview
              </span>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {BREAKDOWN_META.map((b) => {
                const value = livePreview.breakdown[b.key] ?? 0;
                const pct = Math.round((value / b.max) * 100);
                return (
                  <div key={b.key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <b.icon className={cn("h-3.5 w-3.5", b.color)} />
                        {b.label}
                      </span>
                      <span className="font-mono text-foreground/80">
                        {value}
                        <span className="text-muted-foreground">/{b.max}</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        className={cn("h-full rounded-full", b.color.replace("text-", "bg-"))}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Profile form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-border/60 bg-card/40 p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Fingerprint className="h-4 w-4 text-emerald-400" />
                  Complete your Creator Profile
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Everything here feeds your Creator Mind. Be specific — Maestro uses this to ground every
                  decision it makes for you.
                </p>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Skills" hint="Comma-separated. e.g. ML engineering, teaching, writing">
                <Input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="ML engineering, teaching, writing"
                  className="bg-input/40"
                />
                <TagPreview tags={parseTags(skills)} />
              </Field>

              <Field label="Occupation" hint="What you do today">
                <Input
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Senior ML engineer"
                  className="bg-input/40"
                />
              </Field>

              <Field label="Country" hint="Where you're based">
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="United States"
                  className="bg-input/40"
                />
              </Field>

              <Field label="Available hours per week" hint="Time you can commit to creating">
                <Input
                  type="number"
                  min={0}
                  max={80}
                  value={availableHours}
                  onChange={(e) => setAvailableHours(e.target.value)}
                  placeholder="10"
                  className="bg-input/40"
                />
              </Field>

              <Field label="Experience" hint="Briefly: what's your track record?" full>
                <Textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="10 years building ML infra at scale. Taught 3 cohorts of engineers. Wrote a newsletter on distributed systems for 2 years."
                  rows={2}
                  className="bg-input/40"
                />
              </Field>

              <Field label="Goals" hint="Comma-separated. What are you optimizing for?" full>
                <Input
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="Grow to 100k subs, launch a course, build consulting pipeline"
                  className="bg-input/40"
                />
                <TagPreview tags={parseTags(goals)} accent="amber" />
              </Field>

              <Field label="Target platforms" hint="Where you want to publish" full>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PLATFORMS.map((p) => {
                    const checked = targetPlatforms.includes(p);
                    return (
                      <label
                        key={p}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                          checked
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                            : "border-border/60 bg-background/40 text-muted-foreground hover:border-border hover:text-foreground",
                        )}
                      >
                        <Checkbox checked={checked} onCheckedChange={() => togglePlatform(p)} />
                        {p}
                      </label>
                    );
                  })}
                </div>
              </Field>

              <Field label="Interests" hint="Comma-separated. Topics you love" full>
                <Input
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="distributed systems, vector DBs, AI infra, career growth"
                  className="bg-input/40"
                />
                <TagPreview tags={parseTags(interests)} accent="teal" />
              </Field>

              <Field label="Existing audience" hint="Size + where. e.g. '5k newsletter subs, 2k LinkedIn'" full>
                <Input
                  value={existingAudience}
                  onChange={(e) => setExistingAudience(e.target.value)}
                  placeholder="5k newsletter subs, 2k LinkedIn followers"
                  className="bg-input/40"
                />
              </Field>

              <Field label="YouTube channel">
                <Input
                  value={youtubeChannel}
                  onChange={(e) => setYoutubeChannel(e.target.value)}
                  placeholder="@yourchannel"
                  className="bg-input/40"
                />
              </Field>

              <Field label="X account">
                <Input
                  value={xAccount}
                  onChange={(e) => setXAccount(e.target.value)}
                  placeholder="@handle"
                  className="bg-input/40"
                />
              </Field>

              <Field label="LinkedIn URL" full>
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/you"
                  className="bg-input/40"
                />
              </Field>

              <Field label="Preferred formats" hint="What kinds of content" full>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {FORMATS.map((f) => {
                    const checked = preferredFormats.includes(f);
                    return (
                      <label
                        key={f}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                          checked
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-200"
                            : "border-border/60 bg-background/40 text-muted-foreground hover:border-border hover:text-foreground",
                        )}
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleFormat(f)} />
                        {f}
                      </label>
                    );
                  })}
                </div>
              </Field>

              <Field label="Monetization goals" hint="How do you want to make this sustainable?" full>
                <Textarea
                  value={monetizationGoals}
                  onChange={(e) => setMonetizationGoals(e.target.value)}
                  placeholder="Course sales, sponsorship, consulting pipeline. Target $20k/mo within 12 months."
                  rows={2}
                  className="bg-input/40"
                />
              </Field>

              <Field label="Personality & communication style" hint="How you show up — tone, voice, quirks" full>
                <Textarea
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder="First-principles, dry humor, no hype. I over-explain diagrams. I reject buzzwords."
                  rows={2}
                  className="bg-input/40"
                />
              </Field>
            </div>

            <Separator className="my-5" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Saving updates your readiness score live. Higher scores get reviewed first.
              </p>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* What happens while you wait */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-8"
        >
          <Card className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card/40 to-violet-500/10 p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
            <div className="relative">
              <div className="mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-semibold">What happens while you wait</h2>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Every field you complete becomes the foundation of your Creator Mind — the model Maestro
                uses to make decisions on your behalf. When you&apos;re approved, the system doesn&apos;t
                start from scratch: it already knows your skills, your voice, your goals, and your
                audience. The richer your profile, the richer the mind.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: Fingerprint,
                    t: "Identity forms",
                    d: "Skills, personality, goals → identity v1.",
                  },
                  {
                    icon: Scale,
                    t: "Constitution drafts",
                    d: "Your boundaries become constitutional principles.",
                  },
                  {
                    icon: Users,
                    t: "Audience modeled",
                    d: "Target platforms + audience → audience model.",
                  },
                ].map((s) => (
                  <div
                    key={s.t}
                    className="rounded-lg border border-border/60 bg-background/40 p-4"
                  >
                    <s.icon className="mb-2 h-4 w-4 text-emerald-400" />
                    <p className="text-sm font-medium">{s.t}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.d}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-200">
                <Eye className="h-4 w-4 shrink-0" />
                Higher readiness scores are reviewed first. Aim for 70+ to accelerate your access.
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>Maestro — the AI Media Operating System</span>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
            }}
            className="transition-colors hover:text-foreground"
          >
            Sign out
          </button>
        </footer>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  full,
  children,
}: {
  label: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", full && "sm:col-span-2")}>
      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground/70">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function TagPreview({ tags, accent = "emerald" }: { tags: string[]; accent?: "emerald" | "amber" | "teal" }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.slice(0, 12).map((t, i) => (
        <Badge
          key={`${t}-${i}`}
          variant="outline"
          className={cn(
            "border-border/60 bg-background/40 font-mono text-[10px]",
            accent === "emerald" && "text-emerald-300",
            accent === "amber" && "text-amber-300",
            accent === "teal" && "text-teal-300",
          )}
        >
          {t}
        </Badge>
      ))}
      {tags.length > 12 && (
        <span className="text-[10px] text-muted-foreground">+{tags.length - 12} more</span>
      )}
    </div>
  );
}
