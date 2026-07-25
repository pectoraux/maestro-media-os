// Seed Phase 6: Creative Constitution (6 categories) + Creative Policies
import { db } from "./src/lib/db";
import { jstr } from "./src/lib/json";

async function main() {
  // ── Constitution Principles ────────────────────────────────────────────
  const pCount = await db.constitutionPrinciple.count();
  if (pCount === 0) {
    const principles = [
      // Truthfulness
      { category: "truthfulness", principle: "Never fabricate evidence", rationale: "Every factual claim must be traceable to a real source or marked as opinion. Fabrication destroys trust permanently.", enforcement: "block", order: 1, examples: jstr(["Citing a study that doesn't exist", "Inventing a benchmark result"]) },
      { category: "truthfulness", principle: "Distinguish opinion from fact", rationale: "The creator's opinions are valuable, but presenting them as facts is deceptive.", enforcement: "warn", order: 2, examples: jstr(["Saying 'this is the best approach' without qualification"]) },
      { category: "truthfulness", principle: "Never exaggerate certainty beyond evidence", rationale: "If the evidence supports 'likely', don't say 'definitely'. Overstating certainty erodes credibility over time.", enforcement: "warn", order: 3, examples: jstr([]) },

      // Teaching
      { category: "teaching", principle: "Explain before persuading", rationale: "The audience must understand the mechanism before being told the conclusion. Persuading without explaining is manipulation.", enforcement: "warn", order: 1, examples: jstr([]) },
      { category: "teaching", principle: "Prefer first principles", rationale: "Build understanding from fundamentals rather than analogies alone. Analogies supplement, not replace, first-principles reasoning.", enforcement: "log", order: 2, examples: jstr([]) },
      { category: "teaching", principle: "Show tradeoffs", rationale: "Every recommendation must acknowledge what you give up. One-sided recommendations are incomplete teaching.", enforcement: "warn", order: 3, examples: jstr([]) },

      // Tone
      { category: "tone", principle: "Stay curious, not condescending", rationale: "The creator's authority comes from rigor, not superiority. Condescension alienates the audience.", enforcement: "warn", order: 1, examples: jstr(["'Obviously...' 'As any engineer knows...'"]) },
      { category: "tone", principle: "Remain calm", rationale: "Hype and urgency signal low-quality content. The creator's calm, measured tone is a differentiator.", enforcement: "log", order: 2, examples: jstr([]) },
      { category: "tone", principle: "Never manufacture urgency", rationale: "False urgency ('act now', 'before it's too late') violates trust. Real urgency must be evidence-based.", enforcement: "block", order: 3, examples: jstr(["Thumbnail: 'You're doing X WRONG'"]) },

      // Business
      { category: "business", principle: "Never recommend products I wouldn't use", rationale: "Sponsorships and recommendations must be genuine. The creator's endorsement is a trust asset that degrades with bad recommendations.", enforcement: "block", order: 1, examples: jstr([]) },
      { category: "business", principle: "Disclose sponsorships clearly", rationale: "Audience trust requires transparency about commercial relationships.", enforcement: "warn", order: 2, examples: jstr([]) },

      // Audience
      { category: "audience", principle: "Respect beginners", rationale: "The creator was a beginner once. Content should be accessible without being dumbed down. Mocking beginners is unacceptable.", enforcement: "warn", order: 1, examples: jstr([]) },
      { category: "audience", principle: "Never optimize for outrage", rationale: "Outrage drives engagement but destroys the audience the creator wants. Constructive disagreement over manufactured conflict.", enforcement: "block", order: 2, examples: jstr(["'X is destroying Y' framing"]) },

      // Editing
      { category: "editing", principle: "Remove filler", rationale: "Respect the viewer's time. Every sentence should add value. Filler signals low effort.", enforcement: "log", order: 1, examples: jstr([]) },
      { category: "editing", principle: "Keep the strongest argument", rationale: "When in doubt, cut. The strongest argument should dominate. Diluting it weakens the whole piece.", enforcement: "log", order: 2, examples: jstr([]) },
    ];
    for (const p of principles) {
      await db.constitutionPrinciple.create({ data: p });
    }
    console.log(`seeded ${principles.length} constitution principles`);
  }

  // ── Creative Policies ─────────────────────────────────────────────────
  const polCount = await db.creativePolicy.count();
  if (polCount === 0) {
    const policies = [
      { name: "Voice cloning approval", rule: "Never clone my voice unless I explicitly approve each use", scope: "voice", action: "require_approval", condition: jstr({ capability: "production.voice_cloning", requiresExplicitApproval: true }) },
      { name: "No auto-publish", rule: "Never publish automatically. Require human approval for every publish.", scope: "publish", action: "require_approval", condition: jstr({ capability: "distribution.publishing", requiresApproval: true }) },
      { name: "AI research allowed", rule: "Research may use AI. Opinions must always be mine.", scope: "research", action: "allow", condition: jstr({ capability: "intelligence.*", allowed: true }) },
      { name: "Opinions are human-only", rule: "Opinions must always be mine. AI may draft but may not originate opinions.", scope: "opinion", action: "require_approval", condition: jstr({ artifactType: "opinion", requiresHumanOrigin: true }) },
      { name: "No AI video without review", rule: "AI-generated video requires human review before inclusion in any output", scope: "video", action: "require_approval", condition: jstr({ capability: "production.video_generation", requiresReview: true }) },
      { name: "Fact-check mandatory", rule: "Any script with factual claims must pass the Fact Checker before final approval", scope: "all", action: "block", condition: jstr({ stage: "factcheck", required: true }) },
    ];
    for (const p of policies) {
      await db.creativePolicy.create({ data: p });
    }
    console.log(`seeded ${policies.length} creative policies`);
  }

  console.log("Phase 6 seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
