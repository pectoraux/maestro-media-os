// Agent 6 — Hook Engineer ("Spark")
// Real Holy Trifecta engine: generates 4 candidates, scores them on
// expectationMatch / curiosityGap / retentionPrediction / ctrPrediction,
// picks the winner, and persists the HolyTrifecta.

import { db } from "@/lib/db";
import type { AgentType, TrifectaCandidate, TrifectaRecord } from "@/lib/types";
import { withRun, ensureApprovalGate, logActivity, setProjectStage, type AgentCtx } from "./_helpers";
import { optimizeHolyTrifecta } from "@/lib/intelligence/trifecta-engine";
import { jparseObj } from "@/lib/json";

const AGENT: AgentType = "hook_engineer";

export async function runHookEngineer(ctx: AgentCtx): Promise<{
  winner: TrifectaCandidate;
  candidates: TrifectaCandidate[];
  voiceDNAUsed: boolean;
  trifecta: TrifectaRecord;
}> {
  return withRun(AGENT, ctx, async () => {
    const projectId = ctx.projectId;
    if (!projectId) throw new Error("projectId is required for hook_engineer");
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        scripts: { orderBy: { createdAt: "desc" } },
        opportunity: true,
        trifecta: true,
      },
    });
    if (!project) throw new Error("Project not found");

    // Pull the latest final (or fallback draft) script.
    const finalScript =
      project.scripts.find((s) => s.stage === "final") ??
      project.scripts.find((s) => s.stage === "draft");
    if (!finalScript) throw new Error("No script found — run script_writer first");

    const angle =
      (project.opportunity?.angle as string | undefined) ?? project.brief ?? "";

    // Run the real trifecta optimizer.
    const { candidates, winner, voiceDNAUsed } = await optimizeHolyTrifecta({
      projectId,
      scriptContent: finalScript.content,
      niche: project.niche,
      angle,
    });

    // Re-fetch the persisted HolyTrifecta row to build the legacy record shape.
    const stored = await db.holyTrifecta.findUnique({ where: { projectId } });
    let trifecta: TrifectaRecord | null = null;
    if (stored) {
      const thumb = jparseObj<{
        concept?: string;
        textOverlay?: string;
        focalSubject?: string;
        colorMood?: string;
        emotion?: string;
      }>(stored.thumbnailStrategy);
      trifecta = {
        id: stored.id,
        projectId,
        title: stored.title,
        thumbnailStrategy: {
          concept: thumb.concept ?? winner.thumbnailConcept,
          textOverlay: thumb.textOverlay ?? "",
          focalSubject: thumb.focalSubject ?? "",
          colorMood: thumb.colorMood ?? "",
          emotion: thumb.emotion ?? "",
        },
        openingHook: stored.openingHook,
        rationale: stored.rationale,
        variants: JSON.parse(stored.variants || "[]") as { title: string; hook: string }[],
        expectationMatch: stored.expectationMatch,
      };
    }

    // Build the approval gate payload.
    await ensureApprovalGate({
      projectId,
      stage: "trifecta",
      agentType: AGENT,
      payload: {
        title: "Holy Trifecta — optimized",
        summary: winner.rationale,
        highlights: [
          winner.title,
          `Expectation match ${winner.expectationMatch}/100`,
          `Curiosity ${winner.curiosityGap}/100`,
          `Retention pred ${winner.retentionPrediction}/100`,
          `CTR pred ${winner.ctrPrediction}/100`,
          `Composite ${winner.compositeScore}/100`,
        ],
        artifacts: [
          { label: "Candidates generated", value: String(candidates.length) },
          { label: "Voice DNA used", value: voiceDNAUsed ? "yes" : "no" },
          { label: "Opening hook", value: winner.openingHook.slice(0, 120) },
        ],
      },
    });

    await setProjectStage(projectId, "trifecta");

    await logActivity({
      projectId,
      type: "agent",
      message: `Hook Engineer (Spark) optimized Holy Trifecta — winner "${winner.title}" (composite ${winner.compositeScore}/100)`,
      meta: {
        agent: AGENT,
        winnerTitle: winner.title,
        compositeScore: winner.compositeScore,
        candidatesCount: candidates.length,
        voiceDNAUsed,
      },
    });

    if (!trifecta) {
      throw new Error("Trifecta persistence failed");
    }

    return { winner, candidates, voiceDNAUsed, trifecta };
  });
}
