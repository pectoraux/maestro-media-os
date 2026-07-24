// Shared helpers for agent implementations — recording runs, approvals, activity.

import { db } from "@/lib/db";
import { jstr } from "@/lib/json";
import type { AgentType } from "@/lib/types";

export interface AgentCtx {
  projectId?: string;
  input?: Record<string, unknown>;
}

// Persist an AgentRun row. Returns the created row id.
export async function recordRun(opts: {
  agentType: AgentType;
  projectId?: string;
  input?: unknown;
  output?: unknown;
  status: "running" | "succeeded" | "failed";
  durationMs?: number;
  tokens?: number;
  error?: string;
}): Promise<string> {
  const raw = typeof opts.output === "string" ? opts.output : jstr(opts.output ?? {});
  const row = await db.agentRun.create({
    data: {
      agentType: opts.agentType,
      projectId: opts.projectId ?? null,
      input: jstr(opts.input ?? {}),
      output: raw,
      status: opts.status,
      durationMs: opts.durationMs ?? 0,
      tokens: opts.tokens ?? Math.max(0, Math.round(raw.length / 4)),
      error: opts.error ?? null,
    },
  });
  return row.id;
}

export async function updateRun(
  id: string,
  patch: {
    status: "running" | "succeeded" | "failed";
    output?: unknown;
    durationMs?: number;
    tokens?: number;
    error?: string;
  },
) {
  const raw = typeof patch.output === "string" ? patch.output : jstr(patch.output ?? {});
  await db.agentRun.update({
    where: { id },
    data: {
      status: patch.status,
      output: raw,
      durationMs: patch.durationMs ?? 0,
      tokens: patch.tokens ?? Math.max(0, Math.round(raw.length / 4)),
      error: patch.error ?? null,
    },
  });
}

// Create an approval gate (only if none is already pending for this stage).
export async function ensureApprovalGate(opts: {
  projectId: string;
  stage: string;
  agentType: AgentType;
  payload: unknown;
}) {
  const existing = await db.approvalGate.findFirst({
    where: { projectId: opts.projectId, stage: opts.stage, status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;
  return db.approvalGate.create({
    data: {
      projectId: opts.projectId,
      stage: opts.stage,
      agentType: opts.agentType,
      payload: jstr(opts.payload),
      status: "pending",
    },
  });
}

export async function logActivity(opts: {
  projectId?: string;
  type: "agent" | "approval" | "system" | "creator";
  message: string;
  meta?: unknown;
}) {
  return db.activityLog.create({
    data: {
      projectId: opts.projectId ?? null,
      type: opts.type,
      message: opts.message,
      meta: jstr(opts.meta ?? {}),
    },
  });
}

export async function setProjectStage(projectId: string, stage: string, status?: string) {
  return db.project.update({
    where: { id: projectId },
    data: { stage, ...(status ? { status } : {}) },
  });
}

// Wrap an agent body: handles AgentRun lifecycle + failure recording + throw-on-error.
// Returns whatever the body resolves with.
export async function withRun<T>(
  agentType: AgentType,
  ctx: AgentCtx,
  body: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  const runId = await recordRun({
    agentType,
    projectId: ctx.projectId,
    input: ctx.input,
    status: "running",
  });
  try {
    const result = await body();
    const durationMs = Date.now() - started;
    await updateRun(runId, {
      status: "succeeded",
      output: result as unknown,
      durationMs,
    });
    return result;
  } catch (err) {
    const durationMs = Date.now() - started;
    const message = (err as Error)?.message ?? String(err);
    await updateRun(runId, {
      status: "failed",
      output: { error: message },
      durationMs,
      error: message,
    });
    throw err;
  }
}
