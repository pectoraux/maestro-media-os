// Seed the AI Media Operating System:
// - 18 builtin capabilities (everything the OS can do)
// - 5 extensions (3 builtin installed, 2 marketplace available)
// - 8 output channels (YouTube connected, 7 installable)
// - 1 creator identity (aggregated from existing voice DNA + profile)
import { db } from "./src/lib/db";
import { jstr } from "./src/lib/json";

async function main() {
  // ── Capabilities ──────────────────────────────────────────────────────
  const capCount = await db.capability.count();
  if (capCount === 0) {
    const caps = [
      // Intelligence
      { key: "intelligence.signals", name: "Signal Gathering", description: "Gather live signals from YouTube, Google Trends, Reddit, news", category: "intelligence", inputs: jstr({ niche: "string" }), outputs: jstr({ signals: "TrendSignal[]", score: "AdvancedScoreBreakdown" }), cost: "medium", latency: "slow", quality: "high", agentType: "opportunity_hunter" },
      { key: "intelligence.competitors", name: "Competitor Analysis", description: "Deep video-by-video analysis with VLM thumbnail decoding", category: "intelligence", inputs: jstr({ niche: "string" }), outputs: jstr({ competitors: "CompetitorVideo[]", patterns: "WinningPattern[]" }), cost: "medium", latency: "slow", quality: "high", agentType: "competitor_intelligence" },
      { key: "intelligence.research", name: "Research Dossier", description: "Assemble a comprehensive research dossier", category: "intelligence", inputs: jstr({ niche: "string", signals: "TrendSignal[]" }), outputs: jstr({ dossier: "ResearchDossier" }), cost: "low", latency: "medium", quality: "high", agentType: "research_analyst" },
      // Creative
      { key: "creative.interview", name: "Creator Interview", description: "Conversational interview extracting original expertise", category: "creative", inputs: jstr({ projectId: "string" }), outputs: jstr({ extractions: "Extraction[]", session: "InterviewSession" }), cost: "low", latency: "medium", quality: "high", agentType: "chief_director" },
      { key: "creative.voice_dna", name: "Voice DNA Modeling", description: "7-dimension voice profile extraction", category: "creative", inputs: jstr({ samples: "VoiceSample[]" }), outputs: jstr({ voiceDNA: "VoiceDNA" }), cost: "low", latency: "medium", quality: "high", agentType: "voice_dna" },
      { key: "creative.script_writing", name: "Script Writing", description: "Draft scripts in the creator's learned voice", category: "creative", inputs: jstr({ outline: "string", voiceDNA: "VoiceDNA", identity: "CreatorIdentity" }), outputs: jstr({ script: "Script" }), cost: "low", latency: "medium", quality: "high", agentType: "script_writer" },
      { key: "creative.story_architecture", name: "Story Architecture", description: "Narrative structure design + retention-curve planning", category: "creative", inputs: jstr({ dossier: "ResearchDossier", interviews: "Interview[]" }), outputs: jstr({ outline: "Script" }), cost: "low", latency: "medium", quality: "high", agentType: "story_architect" },
      { key: "creative.hook_engineering", name: "Hook Engineering", description: "Opening hook + curiosity gap calibration", category: "creative", inputs: jstr({ script: "Script", voiceDNA: "VoiceDNA" }), outputs: jstr({ trifecta: "HolyTrifecta" }), cost: "low", latency: "medium", quality: "high", agentType: "hook_engineer" },
      { key: "creative.thumbnail_brief", name: "Thumbnail Briefing", description: "Detailed thumbnail briefs with mobile readability + AI prompts", category: "creative", inputs: jstr({ trifecta: "HolyTrifecta" }), outputs: jstr({ brief: "ThumbnailBrief" }), cost: "low", latency: "medium", quality: "high", agentType: "thumbnail_director" },
      { key: "creative.thumbnail_generation", name: "Thumbnail Generation", description: "AI image generation from thumbnail briefs", category: "creative", inputs: jstr({ prompt: "string" }), outputs: jstr({ imageUrl: "string" }), cost: "medium", latency: "medium", quality: "production" },
      // Production
      { key: "production.scene_design", name: "Scene Design", description: "Scene-by-scene editor instructions + B-roll + motion graphics", category: "production", inputs: jstr({ script: "Script", trifecta: "HolyTrifecta" }), outputs: jstr({ scenes: "ProductionScene[]" }), cost: "low", latency: "medium", quality: "high", agentType: "production_designer" },
      { key: "production.video_generation", name: "Video Generation", description: "AI video generation (extension: Realistic Video Studio)", category: "production", inputs: jstr({ scene: "ProductionScene", script: "Script" }), outputs: jstr({ videoUrl: "string" }), cost: "high", latency: "slow", quality: "draft", source: "extension:realistic-video" },
      { key: "production.voice_cloning", name: "Voice Cloning", description: "AI voice synthesis (extension: Voice Studio)", category: "production", inputs: jstr({ script: "Script", voiceDNA: "VoiceDNA" }), outputs: jstr({ audioUrl: "string" }), cost: "high", latency: "slow", quality: "production", source: "extension:voice-studio" },
      { key: "production.editing", name: "Editing", description: "AI-assisted video editing (extension: Runway)", category: "production", inputs: jstr({ scenes: "ProductionScene[]", assets: "Asset[]" }), outputs: jstr({ editUrl: "string" }), cost: "high", latency: "slow", quality: "production", source: "extension:editing-suite" },
      // Distribution
      { key: "distribution.seo", name: "SEO & Metadata", description: "Title/description/chapters/tags optimization", category: "distribution", inputs: jstr({ trifecta: "HolyTrifecta", script: "Script" }), outputs: jstr({ metadata: "PublishMetadata" }), cost: "low", latency: "fast", quality: "high", agentType: "seo_specialist" },
      { key: "distribution.publishing", name: "Publishing", description: "Package + publish to output channels", category: "distribution", inputs: jstr({ projectId: "string", channel: "string" }), outputs: jstr({ published: "boolean", scheduledAt: "string" }), cost: "low", latency: "fast", quality: "production", agentType: "publishing_manager" },
      { key: "distribution.multi_channel", name: "Multi-Channel Repurposing", description: "Produce simultaneously for YouTube, Shorts, TikTok, X, LinkedIn", category: "distribution", inputs: jstr({ script: "Script", scenes: "ProductionScene[]" }), outputs: jstr({ variants: "ChannelVariant[]" }), cost: "medium", latency: "medium", quality: "good" },
      // Learning
      { key: "learning.analytics", name: "Performance Analytics", description: "CTR/retention/revenue analysis + lesson extraction", category: "learning", inputs: jstr({ projectId: "string" }), outputs: jstr({ metrics: "PerformanceMetric", lessons: "string[]" }), cost: "low", latency: "fast", quality: "high", agentType: "analytics_scientist" },
      { key: "learning.knowledge_graph", name: "Knowledge Graph Update", description: "Write patterns, insights, and history back to the graph", category: "learning", inputs: jstr({ lessons: "string[]", project: "Project" }), outputs: jstr({ nodesCreated: "number" }), cost: "low", latency: "fast", quality: "high", agentType: "knowledge_curator" },
    ];
    for (const c of caps) {
      await db.capability.create({ data: c });
    }
    console.log(`seeded ${caps.length} capabilities`);
  }

  // ── Extensions ────────────────────────────────────────────────────────
  const extCount = await db.extension.count();
  if (extCount === 0) {
    const exts = [
      {
        extId: "core-intelligence", name: "Core Intelligence", version: "1.0.0",
        description: "Signal gathering, competitor analysis, and research dossier assembly. The intelligence foundation.",
        publisher: "Maestro", category: "core", status: "installed", installedAt: new Date(),
        capabilities: jstr(["intelligence.signals", "intelligence.competitors", "intelligence.research"]),
        agents: jstr(["Atlas", "Scout", "Sage"]),
        permissions: jstr(["project.read", "knowledge.read", "knowledge.write"]),
        manifest: jstr({ id: "core-intelligence", version: "1.0.0", capabilities: ["intelligence.signals", "intelligence.competitors", "intelligence.research"], permissions: ["project.read", "knowledge.read", "knowledge.write"], agents: ["Atlas", "Scout", "Sage"] }),
      },
      {
        extId: "creative-studio", name: "Creative Studio", version: "1.0.0",
        description: "Interview engine, Voice DNA, story architecture, script writing, Holy Trifecta, thumbnail briefing.",
        publisher: "Maestro", category: "core", status: "installed", installedAt: new Date(),
        capabilities: jstr(["creative.interview", "creative.voice_dna", "creative.story_architecture", "creative.script_writing", "creative.hook_engineering", "creative.thumbnail_brief"]),
        agents: jstr(["Echo", "Verity", "Quill", "Spark", "Canvas"]),
        permissions: jstr(["project.read", "project.write", "voice.read", "voice.write"]),
        manifest: jstr({ id: "creative-studio", version: "1.0.0", capabilities: ["creative.interview", "creative.voice_dna", "creative.story_architecture", "creative.script_writing", "creative.hook_engineering", "creative.thumbnail_brief"], permissions: ["project.read", "project.write", "voice.read", "voice.write"], agents: ["Echo", "Verity", "Quill", "Spark", "Canvas"] }),
      },
      {
        extId: "production-suite", name: "Production Suite", version: "1.0.0",
        description: "Scene design, SEO, publishing, analytics, and knowledge graph learning. The production + learning core.",
        publisher: "Maestro", category: "core", status: "installed", installedAt: new Date(),
        capabilities: jstr(["production.scene_design", "distribution.seo", "distribution.publishing", "learning.analytics", "learning.knowledge_graph"]),
        agents: jstr(["Forge", "Beacon", "Caster", "Prism", "Mnemos"]),
        permissions: jstr(["project.read", "project.write", "publish.execute", "knowledge.write"]),
        manifest: jstr({ id: "production-suite", version: "1.0.0", capabilities: ["production.scene_design", "distribution.seo", "distribution.publishing", "learning.analytics", "learning.knowledge_graph"], permissions: ["project.read", "project.write", "publish.execute", "knowledge.write"], agents: ["Forge", "Beacon", "Caster", "Prism", "Mnemos"] }),
      },
      {
        extId: "voice-studio", name: "Voice Studio", version: "2.1.0",
        description: "AI voice cloning with accent control, emotion, breathing, pacing, and whisper. Generates studio-quality voiceovers in the creator's voice.",
        publisher: "Maestro Marketplace", category: "studio", status: "available",
        capabilities: jstr(["production.voice_cloning"]),
        agents: jstr(["Voice Director"]),
        permissions: jstr(["voice.read", "voice.synthesize"]),
        manifest: jstr({ id: "voice-studio", version: "2.1.0", capabilities: ["production.voice_cloning"], permissions: ["voice.read", "voice.synthesize"], agents: ["Voice Director"], requirements: { voice_dna: true } }),
      },
      {
        extId: "realistic-video", name: "Realistic Video Studio", version: "2.1.0",
        description: "Generate talking-head video, B-roll, lip sync, emotion control, shot planning, and camera motion. Full AI video production.",
        publisher: "Maestro Marketplace", category: "studio", status: "available",
        capabilities: jstr(["production.video_generation"]),
        agents: jstr(["Video Director"]),
        permissions: jstr(["project.read", "video.generate", "asset.write"]),
        manifest: jstr({ id: "realistic-video", version: "2.1.0", capabilities: ["production.video_generation"], permissions: ["project.read", "video.generate", "asset.write"], agents: ["Video Director"], requirements: { script: true, scenes: true } }),
      },
      {
        extId: "editing-suite", name: "AI Editing Suite", version: "1.5.0",
        description: "AI-assisted video editing with auto-cut, motion graphics, color grading, and music sync.",
        publisher: "Maestro Marketplace", category: "studio", status: "available",
        capabilities: jstr(["production.editing"]),
        agents: jstr(["Editor"]),
        permissions: jstr(["project.read", "asset.read", "asset.write"]),
        manifest: jstr({ id: "editing-suite", version: "1.5.0", capabilities: ["production.editing"], permissions: ["project.read", "asset.read", "asset.write"], agents: ["Editor"] }),
      },
      {
        extId: "podcast-toolkit", name: "Podcast Toolkit", version: "1.0.0",
        description: "Conversation planning, speaker switching, audio cleanup, show notes, and RSS publishing. Turn scripts into podcasts.",
        publisher: "Maestro Marketplace", category: "pack", status: "available",
        capabilities: jstr(["distribution.multi_channel"]),
        agents: jstr(["Podcast Director"]),
        permissions: jstr(["project.read", "audio.publish"]),
        manifest: jstr({ id: "podcast-toolkit", version: "1.0.0", capabilities: ["distribution.multi_channel"], permissions: ["project.read", "audio.publish"], agents: ["Podcast Director"] }),
      },
    ];
    for (const e of exts) {
      await db.extension.create({ data: e });
    }
    console.log(`seeded ${exts.length} extensions`);
  }

  // ── Output Channels ───────────────────────────────────────────────────
  const chanCount = await db.outputChannel.count();
  if (chanCount === 0) {
    const channels = [
      { key: "youtube", name: "YouTube", icon: "Youtube", category: "video", description: "Long-form video. The primary distribution channel.", status: "connected", connectedAt: new Date(), config: jstr({ channelName: "Maestro Demo Channel" }) },
      { key: "shorts", name: "YouTube Shorts", icon: "Smartphone", category: "short", description: "Vertical short-form video repurposed from long-form.", status: "available", config: jstr({}) },
      { key: "tiktok", name: "TikTok", icon: "Music2", category: "short", description: "Vertical short-form video for the TikTok algorithm.", status: "available", config: jstr({}) },
      { key: "instagram", name: "Instagram Reels", icon: "Instagram", category: "short", description: "Vertical short-form video for Instagram Reels.", status: "available", config: jstr({}) },
      { key: "x", name: "X (Twitter)", icon: "Twitter", category: "social", description: "Thread + video snippets for X.", status: "available", config: jstr({}) },
      { key: "linkedin", name: "LinkedIn", icon: "Linkedin", category: "social", description: "Professional long-form posts + video.", status: "available", config: jstr({}) },
      { key: "substack", name: "Substack", icon: "Newspaper", category: "text", description: "Newsletter repurposed from script.", status: "available", config: jstr({}) },
      { key: "podcast", name: "Podcast", icon: "Mic", category: "audio", description: "Audio podcast via RSS. Requires Podcast Toolkit extension.", status: "available", config: jstr({}) },
    ];
    for (const c of channels) {
      await db.outputChannel.create({ data: c });
    }
    console.log(`seeded ${channels.length} output channels`);
  }

  // ── Creator Identity ──────────────────────────────────────────────────
  const idCount = await db.creatorIdentity.count();
  if (idCount === 0) {
    await db.creatorIdentity.create({
      data: {
        mission: "Help engineers and builders make better decisions by explaining the trade-offs nobody else explains — with rigor, honesty, and zero hype.",
        beliefs: jstr([
          { belief: "Trade-offs matter more than absolutes", strength: 0.95 },
          { belief: "The boring answer is usually the right one", strength: 0.85 },
          { belief: "Second-order consequences are what separate senior from junior thinkers", strength: 0.9 },
          { belief: "Most tools solve problems teams don't actually have", strength: 0.8 },
        ]),
        experiences: jstr([
          { area: "Applied machine learning", years: 8, notable: "Built and shipped production ML systems at scale" },
          { area: "Developer tooling & DX", years: 6, notable: "Multiple open-source tools with 10k+ stars" },
          { area: "Systems design", years: 7, notable: "Designed distributed systems handling millions of requests" },
        ]),
        stories: jstr([
          { title: "The fintech vector DB war story", summary: "A client spent 6 weeks integrating a vector DB for semantic search. Latency was 400ms p99. We ripped it out, used BM25 + a tiny reranker, got to 60ms p99 with better relevance.", themeTag: "war_story" },
          { title: "The framework that solved nothing", summary: "A team adopted a hot new framework. Six months later, productivity was lower. The framework solved a problem they didn't have.", themeTag: "cautionary_tale" },
        ]),
        frameworks: jstr([
          { name: "Trade-off mapping", description: "Before choosing, map what you gain vs what you lose on each axis" },
          { name: "Second-order thinking", description: "Ask 'and then what?' at least twice before deciding" },
          { name: "The boring-answer test", description: "If the boring answer is feasible, it's probably right" },
        ]),
        analogies: jstr([
          "Using a vector DB when you don't need one is like buying a race car to commute",
          "Most abstractions are toll roads — you pay a tax for every trip",
          "Premature optimization is packing for a trip you'll never take",
        ]),
        humor: jstr({ style: "dry", frequency: "occasional", type: "observation", examples: ["Everyone is optimizing for the wrong metric — and it's costing them."] }),
        values: jstr(["Rigor over hype", "Honesty over clickability", "Respect the viewer's time", "Show the counter-example first"]),
        vocabulary: jstr({
          signaturePhrases: ["Here's what nobody tells you", "The boring answer is usually the right one", "Let me prove it"],
          favoriteWords: ["rigor", "trade-off", "consequence", "second-order", "boring"],
          avoidedTerms: ["game-changer", "revolutionary", "10x", "disruptive"],
        }),
        audienceExpectations: jstr({
          whatTheyComeFor: "Rigorous analysis they can't get from hype channels",
          whatTheyTrust: "Every claim has evidence; every recommendation has a trade-off",
          whatTheyReject: "Hype, vendor shilling, and generic advice",
        }),
        authenticityScore: 0.82,
      },
    });
    console.log("seeded creator identity");
  }

  console.log("Media OS seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
