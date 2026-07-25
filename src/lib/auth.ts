// Authentication & Access System
// Password hashing (bcryptjs), JWT (jose), session cookies, RBAC roles.
// Creator onboarding: Visitor → Waitlisted → Active.

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "maestro-dev-secret-change-in-production-2024"
);

const SESSION_COOKIE = "maestro-session";
const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  organizationId: string | null;
}

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: "demo";
}

export type SessionUser = AuthUser | DemoUser;

// ── Password hashing ────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT ──────────────────────────────────────────────────────────────────────
export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

// ── Session cookies ──────────────────────────────────────────────────────────
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

// ── Get current user from session ────────────────────────────────────────────
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return verifyToken(token);
}

// ── RBAC ─────────────────────────────────────────────────────────────────────
export const ROLES = {
  super_admin: { label: "Super Admin", permissions: ["*"] },
  platform_admin: { label: "Platform Admin", permissions: ["users", "waitlist", "marketplace", "extensions", "intelligence", "creator_approvals", "analytics", "settings"] },
  org_owner: { label: "Organization Owner", permissions: ["projects", "assets", "team", "billing"] },
  manager: { label: "Manager", permissions: ["projects", "assets", "team"] },
  producer: { label: "Producer", permissions: ["projects", "assets", "production"] },
  editor: { label: "Editor", permissions: ["projects", "assets", "editing"] },
  researcher: { label: "Research Analyst", permissions: ["projects", "research"] },
  creator: { label: "Creator", permissions: ["projects", "assets", "content"] },
  reviewer: { label: "Reviewer", permissions: ["projects", "review"] },
  viewer: { label: "Viewer", permissions: ["projects.read"] },
  guest: { label: "Guest", permissions: [] },
  demo_user: { label: "Demo User", permissions: ["projects", "assets", "content", "research", "production", "editing", "review"] },
} as const;

export type RoleKey = keyof typeof ROLES;

export function hasPermission(role: string, permission: string): boolean {
  const perms = ROLES[role as RoleKey]?.permissions ?? [];
  return perms.includes("*") || perms.includes(permission);
}

export function isAdmin(role: string): boolean {
  return role === "super_admin" || role === "platform_admin";
}

// ── Creator Readiness Score ──────────────────────────────────────────────────
export interface ReadinessInput {
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

export function computeReadinessScore(input: ReadinessInput): {
  score: number;
  breakdown: Record<string, number>;
} {
  const breakdown: Record<string, number> = {
    skills: 0,
    experience: 0,
    goals: 0,
    audience: 0,
    platforms: 0,
    completeness: 0,
  };

  // Skills (0-20): 5+ skills = 20, 3-4 = 15, 1-2 = 10, 0 = 0
  breakdown.skills = input.skills.length >= 5 ? 20 : input.skills.length >= 3 ? 15 : input.skills.length >= 1 ? 10 : 0;

  // Experience (0-15): has experience description = 15, none = 0
  breakdown.experience = input.experience && input.experience.length > 10 ? 15 : 0;

  // Goals (0-15): 3+ goals = 15, 1-2 = 10, 0 = 0
  breakdown.goals = input.goals.length >= 3 ? 15 : input.goals.length >= 1 ? 10 : 0;

  // Audience (0-20): has existing audience + social links = 20, partial = 10, none = 0
  const socialLinks = [input.youtubeChannel, input.xAccount, input.linkedinUrl].filter(Boolean).length;
  breakdown.audience = input.existingAudience && socialLinks >= 2 ? 20 : input.existingAudience || socialLinks >= 1 ? 10 : 0;

  // Platforms (0-15): 2+ platforms = 15, 1 = 10, 0 = 0
  breakdown.platforms = input.targetPlatforms.length >= 2 ? 15 : input.targetPlatforms.length >= 1 ? 10 : 0;

  // Completeness (0-15): based on overall form completion
  const fields = [input.skills.length > 0, input.experience, input.goals.length > 0, input.targetPlatforms.length > 0, input.interests.length > 0, input.preferredFormats.length > 0, input.monetizationGoals, input.personality, input.availableHours > 0];
  const filled = fields.filter(Boolean).length;
  breakdown.completeness = Math.round((filled / fields.length) * 15);

  const score = Math.round(Object.values(breakdown).reduce((s, v) => s + v, 0));
  return { score, breakdown };
}

// ── Seed admin user ──────────────────────────────────────────────────────────
export async function ensureAdminUser(): Promise<void> {
  const existing = await db.user.findUnique({ where: { email: "ekontetevi@gmail.com" } });
  if (existing) return;
  const passwordHash = await hashPassword("Payswap123456");
  await db.user.create({
    data: {
      email: "ekontetevi@gmail.com",
      passwordHash,
      name: "Admin",
      role: "super_admin",
      status: "active",
    },
  });
}

// ── Demo users ───────────────────────────────────────────────────────────────
export const DEMO_USERS: Record<string, DemoUser> = {
  creator: { id: "demo-creator", email: "demo.creator@maestro.ai", name: "Demo Creator", role: "creator", status: "demo" },
  editor: { id: "demo-editor", email: "demo.editor@maestro.ai", name: "Demo Editor", role: "editor", status: "demo" },
  producer: { id: "demo-producer", email: "demo.producer@maestro.ai", name: "Demo Producer", role: "producer", status: "demo" },
  ai_director: { id: "demo-director", email: "demo.director@maestro.ai", name: "Demo AI Director", role: "platform_admin", status: "demo" },
  research_analyst: { id: "demo-researcher", email: "demo.researcher@maestro.ai", name: "Demo Research Analyst", role: "researcher", status: "demo" },
  administrator: { id: "demo-admin", email: "demo.admin@maestro.ai", name: "Demo Administrator", role: "super_admin", status: "demo" },
  viewer: { id: "demo-viewer", email: "demo.viewer@maestro.ai", name: "Demo Viewer", role: "viewer", status: "demo" },
};
