// Seed Phase 5: Media Primitives + enrich existing capabilities with contract data
import { db } from "./src/lib/db";
import { jstr, jparseArr } from "./src/lib/json";

async function main() {
  // ── Enrich capabilities with contract fields (authenticitySupport, improvesDNA, provider, etc.) ──
  const caps = await db.capability.findMany();
  const contractMap: Record<string, { authenticitySupport: string[]; improvesDNA: string[]; requires: string[]; provider: string; latencySec: number; qualityScore: number; costUsd: number }> = {
    "intelligence.signals": { authenticitySupport: ["reasoning"], improvesDNA: ["reasoning"], requires: ["project.read"], provider: "Atlas", latencySec: 25, qualityScore: 0.85, costUsd: 0.05 },
    "intelligence.competitors": { authenticitySupport: ["reasoning"], improvesDNA: ["reasoning", "story"], requires: ["project.read"], provider: "Scout", latencySec: 45, qualityScore: 0.88, costUsd: 0.15 },
    "intelligence.research": { authenticitySupport: ["reasoning"], improvesDNA: ["reasoning"], requires: ["project.read", "knowledge.write"], provider: "Sage", latencySec: 20, qualityScore: 0.85, costUsd: 0.08 },
    "creative.interview": { authenticitySupport: ["voice", "reasoning", "story"], improvesDNA: ["voice", "story", "reasoning"], requires: ["project.read", "project.write"], provider: "Maestro", latencySec: 15, qualityScore: 0.9, costUsd: 0.03 },
    "creative.voice_dna": { authenticitySupport: ["voice"], improvesDNA: ["voice"], requires: ["voice.read"], provider: "Echo", latencySec: 12, qualityScore: 0.88, costUsd: 0.02 },
    "creative.script_writing": { authenticitySupport: ["voice", "writing", "reasoning", "humor", "story"], improvesDNA: ["writing"], requires: ["project.read", "project.write"], provider: "Quill", latencySec: 18, qualityScore: 0.85, costUsd: 0.05 },
    "creative.story_architecture": { authenticitySupport: ["story", "reasoning"], improvesDNA: ["story"], requires: ["project.read"], provider: "Verity", latencySec: 15, qualityScore: 0.85, costUsd: 0.04 },
    "creative.hook_engineering": { authenticitySupport: ["voice", "story", "brand"], improvesDNA: ["story", "brand"], requires: ["project.read"], provider: "Spark", latencySec: 12, qualityScore: 0.85, costUsd: 0.03 },
    "creative.thumbnail_brief": { authenticitySupport: ["visual"], improvesDNA: ["visual", "brand"], requires: ["project.read"], provider: "Canvas", latencySec: 14, qualityScore: 0.85, costUsd: 0.03 },
    "creative.thumbnail_generation": { authenticitySupport: ["visual"], improvesDNA: ["visual"], requires: ["asset.write"], provider: "Image Gen", latencySec: 20, qualityScore: 0.75, costUsd: 0.08 },
    "production.scene_design": { authenticitySupport: ["editing", "story", "visual"], improvesDNA: ["editing"], requires: ["project.read"], provider: "Forge", latencySec: 18, qualityScore: 0.85, costUsd: 0.04 },
    "production.video_generation": { authenticitySupport: ["visual", "editing"], improvesDNA: ["visual", "editing"], requires: ["video.generate", "asset.write"], provider: "Realistic Video Studio", latencySec: 120, qualityScore: 0.8, costUsd: 0.5 },
    "production.voice_cloning": { authenticitySupport: ["voice"], improvesDNA: ["voice"], requires: ["voice.read", "voice.synthesize"], provider: "Voice Studio", latencySec: 30, qualityScore: 0.9, costUsd: 0.22 },
    "production.editing": { authenticitySupport: ["editing", "visual"], improvesDNA: ["editing"], requires: ["asset.read", "asset.write"], provider: "AI Editing Suite", latencySec: 90, qualityScore: 0.85, costUsd: 0.3 },
    "distribution.seo": { authenticitySupport: ["brand"], improvesDNA: ["brand"], requires: ["project.read"], provider: "Beacon", latencySec: 8, qualityScore: 0.85, costUsd: 0.02 },
    "distribution.publishing": { authenticitySupport: ["brand", "audience_expectation" as any], improvesDNA: [], requires: ["publish.execute"], provider: "Caster", latencySec: 5, qualityScore: 0.95, costUsd: 0.0 },
    "distribution.multi_channel": { authenticitySupport: ["brand"], improvesDNA: [], requires: ["project.read"], provider: "Maestro", latencySec: 20, qualityScore: 0.8, costUsd: 0.05 },
    "learning.analytics": { authenticitySupport: [], improvesDNA: ["reasoning"], requires: ["project.read", "knowledge.write"], provider: "Prism", latencySec: 10, qualityScore: 0.9, costUsd: 0.01 },
    "learning.knowledge_graph": { authenticitySupport: [], improvesDNA: [], requires: ["knowledge.write"], provider: "Mnemos", latencySec: 5, qualityScore: 0.9, costUsd: 0.0 },
  };
  let enriched = 0;
  for (const cap of caps) {
    const contract = contractMap[cap.key];
    if (contract) {
      await db.capability.update({
        where: { id: cap.id },
        data: {
          authenticitySupport: jstr(contract.authenticitySupport),
          improvesDNA: jstr(contract.improvesDNA),
          requires: jstr(contract.requires),
          provider: contract.provider,
          latencySec: contract.latencySec,
          qualityScore: contract.qualityScore,
          costUsd: contract.costUsd,
        },
      });
      enriched++;
    }
  }
  console.log(`enriched ${enriched} capabilities with contract data`);

  // ── Seed Media Primitives ──────────────────────────────────────────────
  const primCount = await db.mediaPrimitive.count();
  if (primCount === 0) {
    const prims = [
      // Idea
      { type: "idea", title: "Vector databases are not what you think", content: "Most teams misuse vector DBs. The real differentiator is the indexing strategy and embedding quality, not the database. A contrarian, trade-off-framed explainer.", format: "text", source: "creator", tags: ["contrarian", "infrastructure", "vector-db"], status: "ready" },
      { type: "idea", title: "Why your LLM app is slow", content: "Latency-first breakdown of LLM app bottlenecks. The problem is rarely the model — it's the pipeline.", format: "text", source: "creator", tags: ["latency", "llm", "performance"], status: "ready" },
      // Claim
      { type: "claim", title: "BM25 + a tiny reranker often beats a vector DB for semantic search", content: "A well-tuned BM25 + reranker achieved 60ms p99 vs 400ms p99 for a vector DB, with better relevance, in a fintech production system.", format: "text", source: "creator", tags: ["evidence", "search"], status: "ready" },
      { type: "claim", title: "Contrarian opens lift retention by ~9 points", content: "Across 6 videos, contrarian-question opens averaged 48% retention vs 39% for neutral opens.", format: "text", source: "agent:analytics_scientist", tags: ["retention", "pattern"], status: "ready" },
      // Story
      { type: "story", title: "The fintech vector DB war story", content: "A fintech client spent 6 weeks integrating Pinecone for semantic search. Latency was 400ms p99. We ripped it out, used BM25 + a tiny reranker, got to 60ms p99 with better relevance. The vector DB was solving a problem they didn't have.", format: "text", source: "creator", tags: ["war-story", "vector-db", "fintech"], status: "ready" },
      // Evidence
      { type: "evidence", title: "ANN benchmarks — latency/recall trade-off", content: "ANN benchmarks show HNSW achieves 95% recall at 5ms latency on 1M vectors, but real-world query distribution often degrades this significantly.", format: "text", source: "research", sourceRef: "https://ann-benchmarks.com", tags: ["benchmark", "latency"], status: "ready" },
      { type: "evidence", title: "Qdrant hits 1.8M downloads", content: "Qdrant vector DB hit 1.8M downloads, signaling rapid adoption but also hype-driven usage.", format: "text", source: "research", sourceRef: "https://github.com/qdrant", tags: ["adoption", "market"], status: "ready" },
      // Scene
      { type: "scene", title: "Cold open: the 400ms reveal", content: "Open on a code terminal showing a 400ms p99 latency spike. Cut to creator: 'This is what most teams ship. Here's why they shouldn't.'", format: "text", source: "agent:production_designer", tags: ["cold-open", "visual-proof"], status: "ready" },
      // Audience Reaction
      { type: "audience_reaction", title: "'Do I even need a vector DB?'", content: "Recurring question in comments: 'Do I even need a vector DB for my use case?' — signals the explainer gap.", format: "text", source: "agent:competitor_intelligence", tags: ["audience-question", "gap"], status: "ready" },
      { type: "audience_reaction", title: "Audience rejects hype-framed titles", content: "When the creator tested a hype-framed title, comments called it 'clickbait' and engagement dropped. The audience expects rigor, not hype.", format: "text", source: "agent:analytics_scientist", tags: ["audience", "trust"], status: "ready" },
      // Knowledge Asset
      { type: "knowledge_asset", title: "The trade-off mapping framework", content: "Before choosing any technology, map what you gain vs what you lose on each axis (latency, cost, complexity, ops overhead). The boring answer that survives the map is usually right.", format: "markdown", source: "creator", tags: ["framework", "evergreen"], status: "ready" },
      { type: "knowledge_asset", title: "The boring-answer test", content: "If the boring answer is feasible, it's probably right. Test it first before reaching for the exciting one.", format: "text", source: "creator", tags: ["framework", "evergreen"], status: "ready" },
    ];
    for (const p of prims) {
      await db.mediaPrimitive.create({ data: { ...p, tags: jstr(p.tags) } });
    }
    console.log(`seeded ${prims.length} media primitives`);
  }

  console.log("Phase 5 seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
