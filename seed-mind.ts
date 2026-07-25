// Seed Phase 8: Goals + Audiences + Knowledge Graph typed edges
import { db } from "./src/lib/db";
import { jstr } from "./src/lib/json";

async function main() {
  // ── Goals ──────────────────────────────────────────────────────────────
  const goalCount = await db.goal.count();
  if (goalCount === 0) {
    const goals = [
      { title: "Grow to 100k subscribers", description: "Reach 100k YouTube subscribers through consistent, high-quality technical content", category: "growth", priority: "high", targetMetric: "100000 subscribers", progress: 0.34 },
      { title: "Launch ML systems course", description: "Launch a paid course on production ML systems based on accumulated content", category: "product", priority: "high", targetMetric: "Course launched", progress: 0.15 },
      { title: "Increase average retention to 50%", description: "Improve average view retention from 46% to 50% via better hooks and pacing", category: "retention", priority: "medium", targetMetric: "50% avg retention", progress: 0.4 },
      { title: "Build consulting pipeline", description: "Generate 5+ qualified consulting leads per month from content", category: "revenue", priority: "medium", targetMetric: "5 leads/month", progress: 0.6 },
      { title: "Establish trust authority", description: "Become the trusted voice for technical trade-offs in the ML/AI space", category: "trust", priority: "high", targetMetric: "Audience trust score > 90%", progress: 0.72 },
      { title: "Teach beginners without dumbing down", description: "Make content accessible to intermediate engineers without alienating experts", category: "teaching", priority: "medium", targetMetric: "Beginner comprehension rate", progress: 0.5 },
    ];
    for (const g of goals) {
      await db.goal.create({ data: g });
    }
    console.log(`seeded ${goals.length} goals`);
  }

  // ── Audiences ──────────────────────────────────────────────────────────
  const audCount = await db.audience.count();
  if (audCount === 0) {
    const audiences = [
      {
        name: "Senior engineers",
        description: "25-40, senior IC engineers who value depth over hype. They finish videos >12min when the first 90s proves rigor.",
        vocabulary: jstr(["p99", "trade-off", "second-order", "backpressure", "idempotent"]),
        misconceptions: jstr(["think vector DBs are always faster", "conflate latency with throughput"]),
        interests: jstr(["distributed systems", "ML infrastructure", "performance", "DX"]),
        objections: jstr(["'this is too basic'", "'where's the benchmark?'"]),
        trustSignals: jstr(["visual proof", "real war stories", "acknowledged trade-offs"]),
        preferredExamples: jstr(["production incidents", "architecture decisions"]),
        attentionSpan: "long", expertiseLevel: "expert",
      },
      {
        name: "Intermediate engineers",
        description: "2-5 years experience, building their mental models. They want frameworks, not just answers.",
        vocabulary: jstr(["API", "latency", "scale", "microservices"]),
        misconceptions: jstr(["think more tools = better", "over-engineer early"]),
        interests: jstr(["best practices", "career growth", "system design"]),
        objections: jstr(["'this is too advanced'", "'how do I apply this?'"]),
        trustSignals: jstr(["clear explanations", "step-by-step reasoning", "acknowledged complexity"]),
        preferredExamples: jstr(["simplified analogies", "before/after comparisons"]),
        attentionSpan: "medium", expertiseLevel: "intermediate",
      },
      {
        name: "Startup founders",
        description: "Technical founders making build/buy decisions. Time-poor, decision-oriented.",
        vocabulary: jstr(["ROI", "time-to-market", "MVP", "technical debt"]),
        misconceptions: jstr(["think AI solves all problems", "underestimate ops cost"]),
        interests: jstr(["speed", "cost", "team scaling", "vendor selection"]),
        objections: jstr(["'is this worth the complexity?'", "'what's the real cost?'"]),
        trustSignals: jstr(["honest cost analysis", "failure stories", "vendor-agnostic"]),
        preferredExamples: jstr(["cost breakdowns", "case studies"]),
        attentionSpan: "short", expertiseLevel: "intermediate",
      },
      {
        name: "CTOs / VPs",
        description: "Engineering leaders making strategic decisions. They care about team impact, not implementation.",
        vocabulary: jstr(["team velocity", "risk", "compliance", "headcount"]),
        misconceptions: jstr(["think AI = cost reduction only", "underestimate change management"]),
        interests: jstr(["strategy", "team scaling", "risk mitigation", "vendor evaluation"]),
        objections: jstr(["'how does this affect my team?'", "'what's the risk?'"]),
        trustSignals: jstr(["data-backed claims", "industry context", "honest risk assessment"]),
        preferredExamples: jstr(["industry trends", "organizational impact"]),
        attentionSpan: "short", expertiseLevel: "advanced",
      },
    ];
    for (const a of audiences) {
      await db.audience.create({ data: a });
    }
    console.log(`seeded ${audiences.length} audiences`);
  }

  // ── Knowledge Graph typed edges ─────────────────────────────────────────
  const edgeCount = await db.knowledgeEdge.count();
  if (edgeCount === 0) {
    // Get existing nodes by label to create typed relationships
    const nodes = await db.knowledgeNode.findMany();
    const byLabel: Record<string, string> = {};
    for (const n of nodes) byLabel[n.label] = n.id;

    const edges: { from: string; to: string; relation: string; weight: number }[] = [
      { from: "Pattern: 'X is broken' titles outperform", to: "Video: 'Why your LLM app is slow'", relation: "evidence", weight: 0.85 },
      { from: "Pattern: 'X is broken' titles outperform", to: "Pattern: 'Why' titles outperform list titles", relation: "extends", weight: 0.8 },
      { from: "Pattern: 14-18min is the sweet spot", to: "Video: 'Why your LLM app is slow'", relation: "evidence", weight: 0.78 },
      { from: "Rule: show counter-example first", to: "Video: 'Why your LLM app is slow'", relation: "applied_in", weight: 0.7 },
      { from: "Rule: visual proof for numbers", to: "Video: 'Why your LLM app is slow'", relation: "applied_in", weight: 0.7 },
      { from: "Signature: contrarian open", to: "Pattern: 'X is broken' titles outperform", relation: "reinforces", weight: 0.75 },
      { from: "Core audience: senior engineers", to: "Pattern: 14-18min is the sweet spot", relation: "explains", weight: 0.7 },
      { from: "Research: vector DB adoption", to: "Competitor: TechLead", relation: "competitor_gap", weight: 0.55 },
      { from: "Pain: tool fatigue", to: "Rule: show counter-example first", relation: "addresses", weight: 0.68 },
      { from: "Pattern: 'Why' titles outperform list titles", to: "Contrarian opens lift retention ~9pts", relation: "supports", weight: 0.82 },
    ];
    let created = 0;
    for (const e of edges) {
      const sourceId = byLabel[e.from];
      const targetId = byLabel[e.to];
      if (sourceId && targetId) {
        await db.knowledgeEdge.create({ data: { sourceId, targetId, relation: e.relation, weight: e.weight } });
        created++;
      }
    }
    console.log(`seeded ${created} knowledge graph edges`);
  }

  console.log("Phase 8 seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
