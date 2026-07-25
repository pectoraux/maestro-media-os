// Reasoning Trace — an auditable decision trail for every artifact.
//
// Records: intent → capabilities selected → evidence used → identity constraints →
// constitution checks → trust analysis → human approvals → final artifact.
//
// If something looks wrong, the creator can inspect WHY the system made
// particular decisions without exposing internal model reasoning.

import { db } from "@/lib/db";
import { jstr, jparseArr, jparseObj } from "@/lib/json";
import type { ReasoningTraceRecord, ReasoningTraceStep } from "@/lib/types";

export interface CreateTraceInput {
  projectId?: string;
  artifactType: string;
  artifactRef?: string;
  intent: string;
}

// Start a new reasoning trace
export async function startTrace(input: CreateTraceInput): Promise<ReasoningTraceRecord> {
  const created = await db.reasoningTrace.create({
    data: {
      projectId: input.projectId ?? null,
      artifactType: input.artifactType,
      artifactRef: input.artifactRef ?? null,
      intent: input.intent,
      steps: jstr([{ step: "intent", description: input.intent, timestamp: new Date().toISOString() }]),
    },
  });
  return decode(created);
}

// Add a step to an existing trace
export async function addStep(traceId: string, step: Omit<ReasoningTraceStep, "timestamp">): Promise<ReasoningTraceRecord> {
  const trace = await db.reasoningTrace.findUnique({ where: { id: traceId } });
  if (!trace) throw new Error("Trace not found");
  const steps = jparseArr<ReasoningTraceStep>(trace.steps);
  steps.push({ ...step, timestamp: new Date().toISOString() });
  const updated = await db.reasoningTrace.update({
    where: { id: traceId },
    data: { steps: jstr(steps) },
  });
  return decode(updated);
}

// Record capabilities used
export async function recordCapabilities(traceId: string, capabilities: string[]): Promise<void> {
  const trace = await db.reasoningTrace.findUnique({ where: { id: traceId } });
  if (!trace) return;
  await db.reasoningTrace.update({
    where: { id: traceId },
    data: { capabilitiesUsed: jstr(capabilities) },
  });
}

// Record evidence used
export async function recordEvidence(traceId: string, evidence: string[]): Promise<void> {
  const trace = await db.reasoningTrace.findUnique({ where: { id: traceId } });
  if (!trace) return;
  await db.reasoningTrace.update({
    where: { id: traceId },
    data: { evidenceUsed: jstr(evidence) },
  });
}

// Record constitution checks
export async function recordConstitutionChecks(traceId: string, checks: any[]): Promise<void> {
  const trace = await db.reasoningTrace.findUnique({ where: { id: traceId } });
  if (!trace) return;
  await db.reasoningTrace.update({
    where: { id: traceId },
    data: { constitutionChecks: jstr(checks) },
  });
}

// Record trust result
export async function recordTrustResult(traceId: string, trust: Record<string, unknown>): Promise<void> {
  await db.reasoningTrace.update({
    where: { id: traceId },
    data: { trustResult: jstr(trust) },
  });
}

// Record a human approval
export async function recordHumanApproval(traceId: string, approval: { stage: string; decision: string; feedback?: string }): Promise<void> {
  const trace = await db.reasoningTrace.findUnique({ where: { id: traceId } });
  if (!trace) return;
  const approvals = jparseArr<any>(trace.humanApprovals);
  approvals.push({ ...approval, timestamp: new Date().toISOString() });
  await db.reasoningTrace.update({
    where: { id: traceId },
    data: { humanApprovals: jstr(approvals) },
  });
}

// Finalize the trace with the final artifact
export async function finalizeTrace(traceId: string, finalArtifact: string): Promise<ReasoningTraceRecord> {
  const updated = await db.reasoningTrace.update({
    where: { id: traceId },
    data: { finalArtifact },
  });
  return decode(updated);
}

// Get a trace
export async function getTrace(id: string): Promise<ReasoningTraceRecord | null> {
  const row = await db.reasoningTrace.findUnique({ where: { id } });
  return row ? decode(row) : null;
}

// List traces
export async function listTraces(projectId?: string, limit = 20): Promise<ReasoningTraceRecord[]> {
  const where = projectId ? { projectId } : {};
  const rows = await db.reasoningTrace.findMany({ where, orderBy: { createdAt: "desc" }, take: limit });
  return rows.map(decode);
}

function decode(r: any): ReasoningTraceRecord {
  return {
    id: r.id,
    projectId: r.projectId,
    artifactType: r.artifactType,
    artifactRef: r.artifactRef,
    intent: r.intent,
    steps: jparseArr(r.steps),
    capabilitiesUsed: jparseArr(r.capabilitiesUsed),
    evidenceUsed: jparseArr(r.evidenceUsed),
    identityConstraints: jparseArr(r.identityConstraints),
    constitutionChecks: jparseArr(r.constitutionChecks),
    trustResult: jparseObj(r.trustResult),
    humanApprovals: jparseArr(r.humanApprovals),
    finalArtifact: r.finalArtifact,
    createdAt: r.createdAt.toISOString(),
  };
}
