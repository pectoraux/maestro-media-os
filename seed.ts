import { db } from "./src/lib/db";
import { jstr } from "./src/lib/json";

// Seed Maestro with a creator profile, a knowledge graph, and one in-flight
// demo project so the operating system feels alive on first load.

async function main() {
  // ── Creator profile (learned voice & style) ──────────────────────────────
  const existingProfile = await db.creatorProfile.findFirst();
  if (!existingProfile) {
    await db.creatorProfile.create({
      data: {
        voiceProfile: jstr({
          tone: "Analytical but warm — confident without arrogance",
          pacing: "Measured, deliberate pauses for emphasis",
          vocabulary: "Plain-language technical, avoids jargon unless defined",
          signatures: [
            "Opens with a contrarian question",
            "Uses 'here's what nobody tells you' framing",
            "Closes with a specific, actionable takeaway",
          ],
        }),
        styleGuidelines: jstr([
          "Always show the counter-example before the solution",
          "No clickbait — promises must be deliverable in-video",
          "Visual proof for every quantitative claim",
          "Respect the viewer's time — front-load value",
        ]),
        expertise: jstr([
          { area: "Applied machine learning", depth: "expert" },
          { area: "Developer tooling & DX", depth: "expert" },
          { area: "Product strategy", depth: "proficient" },
          { area: "Systems design", depth: "proficient" },
        ]),
        recurringThemes: jstr([
          "Trade-offs over absolutes",
          "Second-order consequences",
          "Why smart people disagree",
        ]),
        toneSamples: jstr([
          "Everyone is optimizing for the wrong metric — and it's costing them.",
          "The boring answer is usually the right one. Let me prove it.",
        ]),
        distinctivenessScore: 0.78,
      },
    });
    console.log("seeded creator profile");
  }

  // ── Knowledge graph: nodes + edges ───────────────────────────────────────
  const nodeCount = await db.knowledgeNode.count();
  if (nodeCount === 0) {
    const nodes = [
      { type: "audience_insight", label: "Core audience: senior engineers", content: "Viewers are 25-40, senior IC engineers who value depth over hype. They finish videos >12min when the first 90s proves rigor.", weight: 0.9 },
      { type: "audience_insight", label: "Pain: tool fatigue", content: "Audience is skeptical of 'yet another framework'. Responds to honest trade-off framing.", weight: 0.82 },
      { type: "audience_insight", label: "Watch pattern: evenings + commute", content: "Peak watch 7-9pm weekdays; mobile share rising. Hooks must work without sound for first 3s.", weight: 0.7 },
      { type: "creator_voice", label: "Signature: contrarian open", content: "Creator consistently opens with a contrarian question; +18% retention vs neutral open.", weight: 0.88 },
      { type: "creator_voice", label: "Signature: 'nobody tells you'", content: "Recurring phrase that signals insider knowledge; audiences comment on it directly.", weight: 0.74 },
      { type: "editorial", label: "Rule: show counter-example first", content: "Editorial guideline — demonstrate the failure mode before the fix increases perceived expertise.", weight: 0.8 },
      { type: "editorial", label: "Rule: visual proof for numbers", content: "Every quantitative claim must have an on-screen chart or code output.", weight: 0.85 },
      { type: "pattern", label: "Pattern: 'X is broken' titles outperform", content: "Across 6 videos, problem-framed titles had 1.4x CTR vs benefit-framed.", weight: 0.76 },
      { type: "pattern", label: "Pattern: 14-18min is the sweet spot", content: "Retention curve flattens best at 14-18min; AVD peaks in this band.", weight: 0.81 },
      { type: "competitor", label: "Competitor: TechLead", content: "High volume, opinionated; weaker on technical depth — gap opportunity.", weight: 0.6 },
      { type: "competitor", label: "Competitor: ThePrimeagen", content: "Strong personality-driven; our angle is rigor + structure.", weight: 0.66 },
      { type: "research", label: "Research: vector DB adoption", content: "Search interest in 'vector database' up 240% YoY; tutorial demand gap exists.", weight: 0.72 },
      { type: "history", label: "Video: 'Why your LLM app is slow'", content: "Published 2024; 340k views, 9.2% CTR, 48% retention. Lesson: latency framing resonates.", weight: 0.9 },
    ];
    const created = [];
    for (const n of nodes) {
      created.push(await db.knowledgeNode.create({ data: n }));
    }
    // edges
    const byLabel = Object.fromEntries(created.map((n) => [n.label, n.id]));
    const edges: { s: string; t: string; r: string; w: number }[] = [
      { s: "Core audience: senior engineers", t: "Pattern: 14-18min is the sweet spot", r: "prefers", w: 0.7 },
      { s: "Core audience: senior engineers", t: "Signature: contrarian open", r: "responds_to", w: 0.75 },
      { s: "Pain: tool fatigue", t: "Rule: show counter-example first", r: "addresses", w: 0.68 },
      { s: "Signature: contrarian open", t: "Pattern: 'X is broken' titles outperform", r: "reinforces", w: 0.8 },
      { s: "Research: vector DB adoption", t: "Competitor: TechLead", r: "competitor_gap", w: 0.55 },
      { s: "Video: 'Why your LLM app is slow'", t: "Pattern: 'X is broken' titles outperform", r: "evidence", w: 0.85 },
      { s: "Video: 'Why your LLM app is slow'", t: "Pattern: 14-18min is the sweet spot", r: "evidence", w: 0.78 },
      { s: "Rule: visual proof for numbers", t: "Video: 'Why your LLM app is slow'", r: "applied_in", w: 0.7 },
    ];
    for (const e of edges) {
      const s = byLabel[e.s];
      const t = byLabel[e.t];
      if (s && t) {
        await db.knowledgeEdge.create({ data: { sourceId: s, targetId: t, relation: e.r, weight: e.w } });
      }
    }
    console.log(`seeded ${created.length} knowledge nodes + ${edges.length} edges`);
  }

  // ── Demo project: in-flight at the outline stage ─────────────────────────
  const demoExists = await db.project.findFirst({ where: { niche: "AI infrastructure" } });
  if (!demoExists) {
    const project = await db.project.create({
      data: {
        title: "Vector Databases Are Not What You Think",
        niche: "AI infrastructure",
        status: "scripting",
        stage: "outline",
        brief: "A rigorous, contrarian breakdown of when vector DBs help vs hurt — grounded in real latency benchmarks.",
      },
    });
    await db.opportunity.create({
      data: {
        projectId: project.id,
        title: "Vector Databases Are Not What You Think",
        niche: "AI infrastructure",
        angle: "Contrarian rigor — most teams misuse vector DBs; show the trade-off map.",
        opportunityScore: 87,
        scoreBreakdown: jstr({
          searchDemand: 88,
          competition: 62,
          freshness: 91,
          audienceFit: 90,
          monetization: 78,
          knowledgeGap: 84,
        }),
        sources: jstr([
          { name: "Google Trends", type: "trend", signal: "'vector database' +240% YoY" },
          { name: "Reddit r/MachineLearning", type: "community", signal: "3 top posts this week question utility" },
          { name: "YouTube search", type: "demand", signal: "Tutorial gap — only shallow intros exist" },
          { name: "Hacker News", type: "news", signal: "Pinecone/Qdrant funding rounds drive interest" },
        ]),
        competitors: jstr([
          { channel: "TechLead", subs: "1.4M", gap: "No technical depth on trade-offs" },
          { channel: "James Briggs", subs: "180k", gap: "Tutorial-only, no 'when not to' framing" },
        ]),
        audienceSignals: jstr([
          "Senior engineers skeptical of hype",
          "Recurring question: 'do I even need a vector DB?'",
          "Latency & cost concerns dominate discussion",
        ]),
        trends: jstr([
          { source: "Google Trends", signal: "Rising interest", momentum: "+240% YoY" },
          { source: "Reddit", signal: "Skepticism threads", momentum: "+3 top posts/week" },
          { source: "News", signal: "Vendor funding", momentum: "Pinecone + Qdrant rounds" },
        ]),
        confidence: "high",
        status: "accepted",
      },
    });

    await db.researchDossier.create({
      data: {
        projectId: project.id,
        summary:
          "Vector DB adoption is accelerating but misuse is widespread. The real differentiator is not the database — it's the indexing strategy, embedding quality, and query pattern. A rigorous trade-off framing (when to use vs avoid) is an open gap with strong demand signals.",
        marketData: jstr([
          { label: "Search demand", value: "88 / 100" },
          { label: "Competitor depth", value: "Low — tutorials only" },
          { label: "Freshness", value: "91 / 100" },
          { label: "Monetization", value: "Sponsor: Qdrant / Weaviate fit" },
        ]),
        competitors: jstr([
          { channel: "James Briggs", positioning: "Hands-on tutorials", weakness: "Never asks 'should you?'" },
          { channel: "TechLead", positioning: "Opinion + hype", weakness: "No benchmarks, no depth" },
        ]),
        audienceInsights: jstr([
          "Want decision frameworks, not syntax",
          "Skeptical of vendor marketing",
          "Latency & cost are the real questions",
        ]),
        news: jstr([
          { title: "Pinecone raises $100M Series D", source: "TechCrunch", date: "2024-03-12", relevance: "Drives search interest" },
          { title: "Qdrant hits 1.8M downloads", source: "GitHub", date: "2024-04-02", relevance: "Adoption signal" },
        ]),
        references: jstr([
          { title: "ANN benchmarks", url: "https://ann-benchmarks.com", note: "Latency/recall trade-off source" },
          { title: "Vector DB comparison 2024", url: "https://qdrant.tech/benchmarks", note: "Cross-vendor latency data" },
        ]),
        knowledgeGaps: jstr([
          "No creator shows the cost of bad embeddings",
          "No comparison of HNSW vs IVF in production",
        ]),
      },
    });

    await db.creatorInterview.create({
      data: {
        projectId: project.id,
        question: "What's the single biggest mistake teams make with vector DBs?",
        answer:
          "They treat the vector DB as the solution, when it's just an index. I've seen teams dump embeddings into Pinecone and wonder why recall is terrible — the problem was their embedding model was mismatched to their query distribution. The database was fine. Nobody talks about this.",
        themeTag: "core_insight",
      },
    });
    await db.creatorInterview.create({
      data: {
        projectId: project.id,
        question: "Give me a concrete war story.",
        answer:
          "A fintech client spent six weeks integrating a vector DB for semantic search. Latency was 400ms p99. We ripped it out, used a well-tuned BM25 + a tiny reranker, got to 60ms p99 with better relevance. The vector DB was solving a problem they didn't have.",
        themeTag: "war_story",
      },
    });

    await db.script.create({
      data: {
        projectId: project.id,
        stage: "outline",
        version: 1,
        content:
          "# Outline — Vector Databases Are Not What You Think\n\n1. HOOK (0:00-0:30): \"Everyone is reaching for a vector database. Most of them shouldn't. Here's why.\"\n2. THE CLAIM (0:30-1:30): A vector DB is an index, not a solution. The problem is usually upstream.\n3. COUNTER-EXAMPLE (1:30-4:00): The fintech war story — 400ms p99 → 60ms with BM25 + reranker.\n4. WHEN VECTORS WIN (4:00-7:00): Semantic similarity at scale, multilingual, multimodal. Real cases.\n5. WHEN THEY HURT (7:00-10:00): Mismatched embeddings, cold-start cost, ops overhead.\n6. THE DECISION FRAMEWORK (10:00-13:00): A 4-question checklist viewers can apply.\n7. CLOSE (13:00-14:00): The takeaway + the contrarian close.",
        notes: "Anchored on creator's fintech war story. Counter-example first per editorial rule.",
      },
    });

    await db.approvalGate.create({
      data: {
        projectId: project.id,
        stage: "outline",
        agentType: "story_architect",
        payload: jstr({
          title: "Approve narrative outline",
          summary:
            "Story Architect (Verity) has structured the script around your fintech war story, leading with the counter-example per your editorial rule.",
          highlights: [
            "Hook: contrarian open (your signature)",
            "Counter-example before solution (editorial rule)",
            "Decision framework as the deliverable",
            "14-min target (retention sweet spot)",
          ],
          artifacts: [
            { label: "Stage", value: "Outline → Expanded Outline" },
            { label: "Target length", value: "14 min" },
          ],
        }),
        status: "pending",
      },
    });

    await db.activityLog.create({
      data: {
        projectId: project.id,
        type: "agent",
        message: "Story Architect (Verity) generated outline v1",
        meta: jstr({ agent: "story_architect", stage: "outline" }),
      },
    });
    await db.activityLog.create({
      data: {
        projectId: project.id,
        type: "approval",
        message: "Approval gate opened: Approve narrative outline",
        meta: jstr({ stage: "outline" }),
      },
    });
    console.log("seeded demo project + outline + approval gate");
  }

  // ── Published video with metrics (for analytics) ─────────────────────────
  const liveProject = await db.project.findFirst({ where: { status: "live" } });
  if (!liveProject) {
    const lp = await db.project.create({
      data: {
        title: "Why Your LLM App Is Slow",
        niche: "AI infrastructure",
        status: "live",
        stage: "published",
        brief: "Latency-first breakdown of LLM app bottlenecks.",
      },
    });
    await db.performanceMetric.create({
      data: {
        projectId: lp.id,
        ctr: 9.2,
        retention: 48,
        avgViewDuration: 6.7,
        impressions: 3_690_000,
        views: 339_000,
        trafficSources: jstr([
          { source: "Browse", share: 41 },
          { source: "Suggested", share: 28 },
          { source: "Search", share: 19 },
          { source: "External", share: 8 },
          { source: "Direct", share: 4 },
        ]),
        revenue: 2840,
        engagement: 6.1,
        lessons: jstr([
          "Latency-framed titles outperform benefit-framed (+1.4x CTR)",
          "Counter-example at 1:30 lifted retention curve +9pts",
          "Decision framework section drove most comments",
        ]),
      },
    });
    console.log("seeded live project + performance metrics");
  }

  console.log("seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
