// Seed Phase 9: Creator Venture + Unfair Advantages + Market Opportunities + Outcomes
import { db } from "./src/lib/db";
import { jstr } from "./src/lib/json";

async function main() {
  // ── Creator Venture ────────────────────────────────────────────────────
  const vCount = await db.creatorVenture.count();
  if (vCount === 0) {
    await db.creatorVenture.create({
      data: {
        stage: "early",
        vision: "Become the most trusted voice for technical trade-offs in ML/AI infrastructure, then build a portfolio of educational products (courses, books, consulting) that monetize that trust.",
        projectedValue: 480000, // annual revenue potential
        revenueStreams: jstr([
          { type: "YouTube ad revenue", currentMonthly: 2400, potentialMonthly: 8000 },
          { type: "Sponsorships", currentMonthly: 1500, potentialMonthly: 6000 },
          { type: "Consulting", currentMonthly: 3000, potentialMonthly: 12000 },
          { type: "Course (future)", currentMonthly: 0, potentialMonthly: 15000 },
          { type: "Affiliate", currentMonthly: 200, potentialMonthly: 1500 },
        ]),
        growthStrategy: jstr([
          { lever: "Content cadence", description: "Increase from 1 to 2 videos/week with retained quality", impact: "high" },
          { lever: "Product launch", description: "Launch ML systems course in Q3", impact: "critical" },
          { lever: "Audience expansion", description: "Expand from engineers to founders/CTOs", impact: "high" },
          { lever: "Trust compounding", description: "Every video strengthens the trust moat", impact: "high" },
        ]),
        executionCapacity: jstr({ hoursPerWeek: 25, budget: "self-funded", equipment: "good (4K camera, mic, editing)", editingSkills: "intermediate", consistency: "high", energy: "medium-high" }),
        roadmap: jstr([
          { quarter: "Q1", milestones: ["Reach 40k subscribers", "Establish 2x/week cadence", "Launch newsletter"] },
          { quarter: "Q2", milestones: ["Reach 60k subscribers", "First $5k sponsorship deal", "Course curriculum designed"] },
          { quarter: "Q3", milestones: ["Launch ML systems course", "Reach 80k subscribers", "First $10k consulting month"] },
          { quarter: "Q4", milestones: ["Reach 100k subscribers", "$20k/month combined revenue", "Book deal inquiry"] },
        ]),
      },
    });
    console.log("seeded creator venture");
  }

  // ── Unfair Advantages ──────────────────────────────────────────────────
  const uaCount = await db.unfairAdvantage.count();
  if (uaCount === 0) {
    const advantages = [
      {
        title: "ML engineer who can teach and has shipped production systems",
        description: "Most ML educators haven't shipped production systems. Most ML engineers can't teach. This creator does both, with real war stories (fintech vector DB, latency optimization).",
        components: jstr([
          { type: "skill", value: "Machine learning (8 years)" },
          { type: "skill", value: "Teaching/explaining" },
          { type: "experience", value: "Shipped production ML systems" },
          { type: "experience", value: "Built fintech infrastructure" },
          { type: "personality", value: "Patient, analytical, dry humor" },
        ]),
        rarity: 0.88,
        defensibility: 0.82,
        monetization: 0.85,
        evidence: jstr(["8 years ML experience", "Multiple production systems shipped", "Teaching ability proven across 20+ videos"]),
      },
      {
        title: "First-principles thinker with distributed systems depth",
        description: "Can explain complex distributed systems from first principles — a combination of deep technical knowledge and the ability to simplify without dumbing down. Rare among content creators.",
        components: jstr([
          { type: "skill", value: "Distributed systems design" },
          { type: "skill", value: "First-principles reasoning" },
          { type: "personality", value: "Curious, rigorous" },
          { type: "interest", value: "System design" },
        ]),
        rarity: 0.82,
        defensibility: 0.78,
        monetization: 0.75,
        evidence: jstr(["Frameworks: trade-off mapping, second-order thinking", "Consistent first-principles approach across content"]),
      },
      {
        title: "Network across CTOs, developers, and recruiters",
        description: "Direct network with engineering leaders who make build/buy decisions — valuable for consulting, sponsorships, and course sales. Most creators have audience but not decision-maker access.",
        components: jstr([
          { type: "network", value: "CTOs and VPs of Engineering" },
          { type: "network", value: "Senior IC engineers" },
          { type: "network", value: "Recruiters and hiring managers" },
          { type: "experience", value: "Managed engineering teams" },
        ]),
        rarity: 0.72,
        defensibility: 0.80,
        monetization: 0.90,
        evidence: jstr(["Consulting pipeline already generating leads", "Sponsorship interest from dev tooling companies"]),
      },
    ];
    for (const a of advantages) {
      await db.unfairAdvantage.create({ data: a });
    }
    console.log(`seeded ${advantages.length} unfair advantages`);
  }

  // ── Market Opportunities ───────────────────────────────────────────────
  const moCount = await db.marketOpportunity.count();
  if (moCount === 0) {
    const opportunities = [
      { niche: "ML infrastructure & MLOps", audience: "Senior ML engineers + CTOs", marketSize: "large", competition: "medium", difficulty: "hard", growthRate: "exploding", monetization: "very_high", trustPotential: 0.9, longevity: 0.85, personalFit: 0.92, expectedROI: 0.88, creatorMarketFit: 0 },
      { niche: "Vector databases & search", audience: "Backend engineers", marketSize: "medium", competition: "medium", difficulty: "medium", growthRate: "growing", monetization: "high", trustPotential: 0.85, longevity: 0.7, personalFit: 0.88, expectedROI: 0.82, creatorMarketFit: 0 },
      { niche: "Career growth for engineers", audience: "Intermediate engineers", marketSize: "large", competition: "high", difficulty: "medium", growthRate: "stable", monetization: "high", trustPotential: 0.75, longevity: 0.8, personalFit: 0.72, expectedROI: 0.68, creatorMarketFit: 0 },
      { niche: "Distributed systems design", audience: "Senior engineers + architects", marketSize: "medium", competition: "low", difficulty: "hard", growthRate: "stable", monetization: "medium", trustPotential: 0.88, longevity: 0.9, personalFit: 0.82, expectedROI: 0.75, creatorMarketFit: 0 },
      { niche: "AI for product managers", audience: "Product managers", marketSize: "large", competition: "medium", difficulty: "medium", growthRate: "growing", monetization: "high", trustPotential: 0.7, longevity: 0.75, personalFit: 0.65, expectedROI: 0.72, creatorMarketFit: 0 },
    ];
    for (const o of opportunities) {
      await db.marketOpportunity.create({ data: o });
    }
    console.log(`seeded ${opportunities.length} market opportunities`);
  }

  // ── Outcomes ───────────────────────────────────────────────────────────
  const oCount = await db.outcome.count();
  if (oCount === 0) {
    const outcomes = [
      { title: "Reach 100k YouTube subscribers", category: "audience", target: "100000 subscribers", deadline: "12 months", priority: "critical", progress: 0.34, milestones: jstr([{ title: "Reach 40k", done: true }, { title: "Reach 60k", done: false }, { title: "Reach 80k", done: false }, { title: "Reach 100k", done: false }]) },
      { title: "Launch ML systems course", category: "product", target: "Course live with 100+ students", deadline: "Q3", priority: "critical", progress: 0.15, milestones: jstr([{ title: "Curriculum designed", done: false }, { title: "First module recorded", done: false }, { title: "Landing page live", done: false }, { title: "Course launched", done: false }]) },
      { title: "$20k/month combined revenue", category: "revenue", target: "$20000/month", deadline: "12 months", priority: "high", progress: 0.36, milestones: jstr([{ title: "$7k/month", done: true }, { title: "$12k/month", done: false }, { title: "$20k/month", done: false }]) },
      { title: "Become known for ML trade-offs", category: "authority", target: "Top-of-mind for ML infrastructure decisions", deadline: "ongoing", priority: "high", progress: 0.72, milestones: jstr([{ title: "Recognized in comments", done: true }, { title: "Cited by other creators", done: true }, { title: "Speaking invites", done: false }]) },
      { title: "Build consulting pipeline", category: "revenue", target: "5+ qualified leads/month", deadline: "6 months", priority: "medium", progress: 0.6, milestones: jstr([{ title: "3 leads/month", done: true }, { title: "5 leads/month", done: false }]) },
    ];
    for (const o of outcomes) {
      await db.outcome.create({ data: o });
    }
    console.log(`seeded ${outcomes.length} outcomes`);
  }

  console.log("Phase 9 seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
