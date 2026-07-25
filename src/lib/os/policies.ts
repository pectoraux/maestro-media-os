// Creative Policies — runtime rules that govern capability execution.
//
// Different from DNA (describes identity) and Constitution (principles).
// Policies define boundaries: "Never clone my voice unless I explicitly approve."

import { db } from "@/lib/db";
import { jparseObj } from "@/lib/json";
import type { CreativePolicyRecord, PolicyEvaluationResult } from "@/lib/types";

export async function getPolicies(): Promise<CreativePolicyRecord[]> {
  const rows = await db.creativePolicy.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(decode);
}

export async function createPolicy(data: {
  name: string;
  rule: string;
  scope: CreativePolicyRecord["scope"];
  action?: string;
  condition?: Record<string, unknown>;
}): Promise<CreativePolicyRecord> {
  const created = await db.creativePolicy.create({
    data: {
      name: data.name,
      rule: data.rule,
      scope: data.scope,
      action: data.action ?? "require_approval",
      condition: JSON.stringify(data.condition ?? {}),
    },
  });
  return decode(created);
}

export async function updatePolicy(id: string, patch: Partial<CreativePolicyRecord>): Promise<void> {
  const data: Record<string, unknown> = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.rule !== undefined) data.rule = patch.rule;
  if (patch.scope !== undefined) data.scope = patch.scope;
  if (patch.action !== undefined) data.action = patch.action;
  if (patch.isActive !== undefined) data.isActive = patch.isActive;
  if (patch.condition !== undefined) data.condition = JSON.stringify(patch.condition);
  await db.creativePolicy.update({ where: { id }, data });
}

// Evaluate policies against a capability invocation
export async function evaluatePolicies(input: {
  capabilityKey: string;
  scope?: string;
  projectId?: string;
}): Promise<PolicyEvaluationResult> {
  const policies = await getPolicies();
  const matched: { name: string; rule: string; action: string }[] = [];
  let requiresApproval = false;
  let blocked = false;

  for (const p of policies) {
    const condition = p.condition as any;
    const capabilityMatch = condition.capability
      ? input.capabilityKey.startsWith(condition.capability.replace("*", "")) ||
        input.capabilityKey === condition.capability
      : true;
    const scopeMatch = p.scope === "all" || p.scope === input.scope;

    if (capabilityMatch && scopeMatch) {
      matched.push({ name: p.name, rule: p.rule, action: p.action });
      if (p.action === "require_approval") requiresApproval = true;
      if (p.action === "block") blocked = true;
    }
  }

  const reason = matched.length > 0
    ? `Matched ${matched.length} polic${matched.length === 1 ? "y" : "ies"}: ${matched.map((m) => m.name).join(", ")}`
    : "No policies matched — allowed";

  return {
    allowed: !blocked,
    requiresApproval,
    matchedPolicies: matched,
    reason,
  };
}

function decode(r: any): CreativePolicyRecord {
  return {
    id: r.id,
    name: r.name,
    rule: r.rule,
    scope: r.scope,
    condition: jparseObj(r.condition),
    action: r.action,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
