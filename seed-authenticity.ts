// Seed Phase 4: Media DNA (8 types) + Semantic Memory + extended identity dimensions
import { db } from "./src/lib/db";
import { jstr } from "./src/lib/json";

async function main() {
  // ── Media DNA (8 types) ────────────────────────────────────────────────
  const dnaCount = await db.mediaDNA.count();
  if (dnaCount === 0) {
    const dnas = [
      {
        type: "voice",
        content: jstr({
          tone: "Analytical but warm — confident without arrogance",
          pacing: "Measured, deliberate pauses for emphasis",
          vocabulary: "Plain-language technical, avoids jargon unless defined",
          signatures: ["Opens with a contrarian question", "'here's what nobody tells you'", "Closes with a specific actionable takeaway"],
          distinctiveness: 0.85,
        }),
        source: "builtin", confidence: 0.85,
      },
      {
        type: "writing",
        content: jstr({
          avgSentenceLength: "medium (12-18 words)",
          structure: "declarative statement → evidence → implication",
          complexity: "plain-language technical",
          register: "conversational-expert",
          signatures: ["short punchy sentences after long explanatory ones", "em-dashes for asides"],
        }),
        source: "builtin", confidence: 0.78,
      },
      {
        type: "visual",
        content: jstr({
          style: "clean, high-contrast, minimal clutter",
          palette: ["dark background", "single accent color (emerald or amber)", "white text"],
          composition: "rule of thirds, one focal subject, generous negative space",
          textOverlay: "1-4 words, bold sans-serif, high contrast",
          thumbnailReadability: "optimized for 320px mobile",
        }),
        source: "builtin", confidence: 0.7,
      },
      {
        type: "editing",
        content: jstr({
          pacing: "cut every 3-5 seconds, faster during examples",
          transitions: "hard cuts (80%), match cuts (15%), dissolves (5% only for emotional beats)",
          graphicsStyle: "lower-thirds, animated callouts, code-output overlays",
          musicUse: "subtle bed, ducked under speech, no lyrics",
          brollFrequency: "every 8-12 seconds during explanations",
        }),
        source: "builtin", confidence: 0.68,
      },
      {
        type: "story",
        content: jstr({
          structure: "contrarian open → counter-example → framework → evidence → actionable close",
          openLength: "15-30 seconds",
          callbacks: "references earlier points to create coherence",
          frameworks: ["trade-off mapping", "second-order thinking", "the boring-answer test"],
          emotionalArc: "curiosity → tension → relief → conviction",
        }),
        source: "builtin", confidence: 0.75,
      },
      {
        type: "reasoning",
        content: jstr({
          approach: "first-principles, then trade-offs",
          signatures: ["asks 'and then what?' at least twice", "maps what you gain vs lose on each axis", "tests the boring answer first"],
          skepticism: "high — scrutinizes vendor claims and hype",
          evidenceStandard: "every claim needs a source or a concrete example",
          avoids: ["absolutes without qualification", "hype words", "generic advice"],
        }),
        source: "builtin", confidence: 0.8,
      },
      {
        type: "brand",
        content: jstr({
          positioning: "the rigorous, no-hype technical voice",
          promise: "trade-offs nobody else explains, with evidence",
          tone: "confident, honest, respectful of viewer's intelligence",
          avoidedTerms: ["game-changer", "revolutionary", "10x", "disruptive", "world-class"],
          visualIdentity: "dark theme, emerald accent, mono typography for metrics",
        }),
        source: "builtin", confidence: 0.82,
      },
      {
        type: "teaching",
        content: jstr({
          approach: "problem-first, then solution",
          scaffolding: "shows the failure mode before the fix",
          depthLevel: "intermediate-to-advanced",
          examplesPerConcept: "2 (one positive, one counter-example)",
          checksForUnderstanding: "recaps key decision criteria at the end",
        }),
        source: "builtin", confidence: 0.73,
      },
    ];
    for (const d of dnas) {
      await db.mediaDNA.create({ data: d });
    }
    console.log(`seeded ${dnas.length} Media DNA models`);
  }

  // ── Semantic Memory (typed knowledge nodes) ────────────────────────────
  const memCount = await db.knowledgeNode.count({ where: { type: { in: ["principle", "lesson", "pattern", "mistake", "experiment", "framework", "evidence", "relationship", "audience_reaction"] } } });
  if (memCount === 0) {
    const memories = [
      { type: "principle", label: "Show the counter-example first", content: "Demonstrate the failure mode before the fix — it increases perceived expertise and trust.", weight: 0.9 },
      { type: "principle", label: "Visual proof for every number", content: "Every quantitative claim must have an on-screen chart or code output.", weight: 0.85 },
      { type: "lesson", label: "Contrarian opens lift retention ~9pts", content: "Across 6 videos, contrarian-question opens averaged 48% retention vs 39% for neutral opens.", weight: 0.8 },
      { type: "lesson", label: "Latency-framed titles outperform", content: "Problem-framed titles (e.g. 'Why your X is slow') had 1.4x CTR vs benefit-framed.", weight: 0.82 },
      { type: "pattern", label: "14-18min is the retention sweet spot", content: "Retention curves flatten best at 14-18 minutes; AVD peaks in this band for this audience.", weight: 0.78 },
      { type: "pattern", label: "'Why' titles outperform list titles", content: "Questions beginning with 'Why' outperform listicle titles by ~18% CTR for this creator.", weight: 0.76 },
      { type: "mistake", label: "Don't promise in title what the video doesn't deliver", content: "One early video had a clickbait title; negative comments cited the gap. Trust cost > CTR gain.", weight: 0.88 },
      { type: "framework", label: "Trade-off mapping", content: "Before choosing, map what you gain vs what you lose on each axis. The creator's signature framework.", weight: 0.92 },
      { type: "framework", label: "Second-order thinking", content: "Ask 'and then what?' at least twice before deciding. Surfaces hidden costs.", weight: 0.88 },
      { type: "evidence", label: "Fintech vector DB war story", content: "Client spent 6 weeks on a vector DB for semantic search. 400ms p99. Replaced with BM25 + reranker → 60ms p99, better relevance.", weight: 0.85 },
      { type: "audience_reaction", label: "Audience trusts evidence over opinion", content: "Comments consistently praise 'showing the work' and cite specific benchmarks as why they trust the channel.", weight: 0.8 },
      { type: "audience_reaction", label: "Audience rejects hype", content: "When the creator tested a hype-framed title, comments called it 'clickbait' and engagement dropped.", weight: 0.84 },
    ];
    for (const m of memories) {
      await db.knowledgeNode.create({ data: m });
    }
    console.log(`seeded ${memories.length} semantic memories`);
  }

  // ── Extend Creator Identity with extended dimensions ───────────────────
  const identity = await db.creatorIdentity.findFirst();
  if (identity && identity.extendedDimensions === "{}") {
    await db.creatorIdentity.update({
      where: { id: identity.id },
      data: {
        extendedDimensions: jstr({
          visualLanguage: "Dark, high-contrast, minimal. One focal subject. Emerald/amber accents on near-black.",
          editingStyle: "Hard cuts, 3-5s rhythm. Animated callouts for key terms. B-roll every 8-12s.",
          musicTaste: "Subtle ambient beds, ducked under speech. No lyrics. Tension builds during problem framing.",
          brandLanguage: "Rigorous, no-hype, evidence-first. 'Trade-offs over absolutes.' Avoids superlatives.",
          relationships: ["developer community", "ML engineering teams", "open-source maintainers"],
          products: [],
          companies: [],
          history: "Started as an ML engineer; built reputation explaining trade-offs others glossed over.",
          goals: ["Become the trusted voice for technical trade-offs", "Launch a course on production ML systems"],
          thinkingStyle: "First-principles → trade-off map → boring-answer test → second-order consequences",
          reasoning: "Skeptical of hype. Tests the boring answer first. Asks 'and then what?' twice.",
          cameraStyle: "Direct-to-camera for hooks and closes; screen-record + B-roll for explanations.",
        }),
      },
    });
    console.log("extended creator identity dimensions");
  }

  console.log("Phase 4 seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
