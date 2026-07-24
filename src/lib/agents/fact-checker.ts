// Agent 5 — Fact Checker ("Lex")
// Extracts claims from the draft script and verifies each via webSearch.

import { db } from "@/lib/db";
import { jstr, jparseArr } from "@/lib/json";
import { llmJson, webSearch } from "@/lib/zai";
import type { AgentType } from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, type AgentCtx } from "./_helpers";

const AGENT: AgentType = "fact_checker";

interface Claim {
  claim: string;
  verdict: "verified" | "unverified" | "false";
  evidence: string;
  suggestion: string;
}

const SYSTEM = `You are Lex, a meticulous fact checker. You extract every factual claim from a script and verify each independently.
You are skeptical of round numbers, causal claims, and anything that sounds like conventional wisdom. You require evidence.
Return STRICT JSON only — no prose, no markdown fences.`;

export async function runFactChecker(ctx: AgentCtx): Promise<{ claims: Claim[]; summary: string }> {
  return withRun(AGENT, ctx, async () => {
    const projectId = ctx.projectId!;
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { scripts: { orderBy: { createdAt: "desc" } } },
    });
    if (!project) throw new Error("Project not found");
    const draft = project.scripts.find((s) => s.stage === "draft");
    if (!draft) throw new Error("No draft script found — run script_writer stage=draft first");

    // 1. Extract claims
    const extractPrompt = `Extract every factual claim from this script that requires verification. Skip subjective statements, opinions, and the creator's own stories. Focus on numbers, statistics, causal claims, historical events, technical definitions, and quotations.
Script:
${draft.content}

Return JSON:
{ "claims": ["claim 1", "claim 2", ...] }
Aim for 5-12 claims. Be specific about what is being claimed.`;
    const extract = await llmJson<{ claims: string[] }>(extractPrompt, { system: SYSTEM });
    const claims = jparseArr<string>(jstr(extract.data?.claims ?? [])).slice(0, 12);
    if (claims.length === 0) {
      // fall back to no-claims path
      const empty: Claim[] = [];
      await persist(projectId, empty, "No verifiable claims found.");
      return { claims: empty, summary: "No verifiable claims found." };
    }

    // 2. Verify each non-trivial claim via webSearch (limit concurrency)
    const verified: Claim[] = [];
    const batchSize = 3;
    for (let i = 0; i < claims.length; i += batchSize) {
      const batch = claims.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (claim) => {
          const search = await webSearch(`${claim} fact check source`, 5);
          const verifyPrompt = `Claim: "${claim}"

Search results:
${JSON.stringify(search.slice(0, 5).map((s) => ({ name: s.name, snippet: s.snippet, host: s.host_name, url: s.url })), null, 2)}

Verify the claim against the search results.
Return JSON:
{
  "claim": "${claim.replace(/"/g, "'")}",
  "verdict": "verified" | "unverified" | "false",
  "evidence": "what the sources say — cite host_name",
  "suggestion": "how to rephrase if needed, or 'no change'"
}`;
          const v = await llmJson<Claim>(verifyPrompt, { system: SYSTEM });
          return (
            v.data ?? {
              claim,
              verdict: "unverified" as const,
              evidence: "Could not parse verification response.",
              suggestion: "Soften or remove.",
            }
          );
        }),
      );
      verified.push(...results);
    }

    const counts = {
      verified: verified.filter((c) => c.verdict === "verified").length,
      unverified: verified.filter((c) => c.verdict === "unverified").length,
      false: verified.filter((c) => c.verdict === "false").length,
    };
    const summary = `${verified.length} claims checked — ${counts.verified} verified, ${counts.unverified} unverified, ${counts.false} false.`;
    await persist(projectId, verified, summary);
    return { claims: verified, summary };
  });
}

async function persist(projectId: string, claims: Claim[], summary: string) {
  await db.project.update({ where: { id: projectId }, data: { stage: "factcheck" } });
  await ensureApprovalGate({
    projectId,
    stage: "factcheck",
    agentType: AGENT,
    payload: {
      title: "Fact-Check Report",
      summary,
      highlights: claims.slice(0, 6).map((c) => `[${c.verdict.toUpperCase()}] ${c.claim.slice(0, 80)}`),
      artifacts: [{ label: "Total claims", value: String(claims.length) }],
    },
  });
  await logActivity({
    projectId,
    type: "agent",
    message: `Fact Checker verified ${claims.length} claims — ${summary}`,
    meta: { agent: AGENT, claims: claims.length },
  });
}
