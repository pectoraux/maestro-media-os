import type { AgentMeta, PipelineStageInfo } from "./types";

// The roster of specialized AI agents + the Chief Creative Director orchestrator.
export const AGENTS: AgentMeta[] = [
  {
    type: "chief_director",
    name: "Maestro",
    role: "Chief Creative Director",
    icon: "Orchestra",
    color: "text-emerald-400",
    capabilities: ["Orchestrates the full pipeline", "Routes work between agents", "Enforces approval gates", "Maintains editorial coherence"],
    stage: "orchestration",
  },
  {
    type: "opportunity_hunter",
    name: "Atlas",
    role: "Opportunity Hunter",
    icon: "Radar",
    color: "text-emerald-400",
    capabilities: ["Scans YouTube, Google Trends, Reddit", "Search demand & competitor gap analysis", "Weighted Opportunity Score", "High-confidence opportunity surfacing"],
    stage: "opportunity",
  },
  {
    type: "research_analyst",
    name: "Sage",
    role: "Research Analyst",
    icon: "Microscope",
    color: "text-amber-400",
    capabilities: ["Assembles research dossier", "Market & competitor deep dive", "Audience insight synthesis", "Source verification & citation"],
    stage: "dossier",
  },
  {
    type: "story_architect",
    name: "Verity",
    role: "Story Architect",
    icon: "Building2",
    color: "text-rose-400",
    capabilities: ["Narrative structure design", "Outline → expanded outline", "Retention curve planning", "Originality scaffolding"],
    stage: "outline",
  },
  {
    type: "hook_engineer",
    name: "Spark",
    role: "Hook Engineer",
    icon: "Zap",
    color: "text-amber-400",
    capabilities: ["Opening hook engineering", "Expectation matching", "Curiosity gap calibration", "Retention-first first 30s"],
    stage: "trifecta",
  },
  {
    type: "thumbnail_director",
    name: "Canvas",
    role: "Thumbnail Director",
    icon: "Image",
    color: "text-rose-400",
    capabilities: ["Thumbnail concept & composition", "Text overlay strategy", "Emotion & focal direction", "CTR-optimized variants"],
    stage: "trifecta",
  },
  {
    type: "script_writer",
    name: "Quill",
    role: "Script Writer",
    icon: "PenLine",
    color: "text-emerald-400",
    capabilities: ["Draft script in creator voice", "Iterative refinement", "Dialogue & pacing", "Authenticity preservation"],
    stage: "draft",
  },
  {
    type: "fact_checker",
    name: "Lex",
    role: "Fact Checker",
    icon: "ShieldCheck",
    color: "text-amber-400",
    capabilities: ["Claim verification", "Source cross-checking", "Risk & accuracy flags", "Citation audit"],
    stage: "factcheck",
  },
  {
    type: "seo_specialist",
    name: "Beacon",
    role: "SEO Specialist",
    icon: "Search",
    color: "text-emerald-400",
    capabilities: ["Title/thumbnail/description SEO", "Chapters & tags", "Pinned comment & playlists", "Discovery optimization"],
    stage: "metadata",
  },
  {
    type: "publishing_manager",
    name: "Caster",
    role: "Publishing Manager",
    icon: "Send",
    color: "text-rose-400",
    capabilities: ["Upload metadata packaging", "Publish scheduling", "End-screen & cards", "Playlist placement"],
    stage: "metadata",
  },
  {
    type: "analytics_scientist",
    name: "Prism",
    role: "Analytics Scientist",
    icon: "LineChart",
    color: "text-amber-400",
    capabilities: ["CTR & retention analysis", "Traffic source breakdown", "Revenue attribution", "Learning loop feedback"],
    stage: "published",
  },
  {
    type: "knowledge_curator",
    name: "Mnemos",
    role: "Knowledge Curator",
    icon: "BrainCircuit",
    color: "text-emerald-400",
    capabilities: ["Updates knowledge graph", "Captures creator voice", "Pattern extraction", "Cross-project learning"],
    stage: "orchestration",
  },
];

export const AGENT_MAP: Record<string, AgentMeta> = Object.fromEntries(
  AGENTS.map((a) => [a.type, a]),
);

export function getAgent(type: string): AgentMeta | undefined {
  return AGENT_MAP[type];
}

// The production pipeline. Every stage with requiresApproval=true blocks until
// the creator approves the gate — preserving human-in-the-loop control.
export const PIPELINE: PipelineStageInfo[] = [
  { key: "opportunity", label: "Opportunity", agent: "opportunity_hunter", requiresApproval: true, description: "Discover & score a high-confidence content opportunity." },
  { key: "dossier", label: "Research Dossier", agent: "research_analyst", requiresApproval: true, description: "Assemble a full research dossier across markets, competitors & audience." },
  { key: "interview", label: "Creator Interview", agent: "chief_director", requiresApproval: true, description: "Interview the creator to capture original expertise, opinions & stories." },
  { key: "outline", label: "Outline", agent: "story_architect", requiresApproval: true, description: "Generate the narrative outline from research + creator input." },
  { key: "expanded", label: "Expanded Outline", agent: "story_architect", requiresApproval: true, description: "Expand the outline with beats, retention hooks & section detail." },
  { key: "draft", label: "Script Draft", agent: "script_writer", requiresApproval: true, description: "Draft the full script in the creator's learned voice." },
  { key: "factcheck", label: "Fact Check", agent: "fact_checker", requiresApproval: true, description: "Verify every claim; flag risks & missing citations." },
  { key: "final", label: "Final Script", agent: "script_writer", requiresApproval: true, description: "Apply fact-check revisions into the final script." },
  { key: "trifecta", label: "Holy Trifecta", agent: "hook_engineer", requiresApproval: true, description: "Generate title + thumbnail strategy + opening hook as one unit." },
  { key: "blueprint", label: "Editor Blueprint", agent: "thumbnail_director", requiresApproval: true, description: "Timestamped B-roll, graphics, captions, transitions & retention notes." },
  { key: "assets", label: "Supporting Assets", agent: "knowledge_curator", requiresApproval: false, description: "Diagrams, infographics, social & repurposed formats." },
  { key: "metadata", label: "Upload Metadata", agent: "seo_specialist", requiresApproval: true, description: "Description, chapters, tags, pinned comment, playlist & schedule." },
  { key: "scheduled", label: "Publish Schedule", agent: "publishing_manager", requiresApproval: true, description: "Confirm publish time & packaging." },
  { key: "published", label: "Live & Learn", agent: "analytics_scientist", requiresApproval: false, description: "Analyze performance & feed lessons back into the knowledge graph." },
];

export const STAGE_INDEX: Record<string, number> = Object.fromEntries(
  PIPELINE.map((s, i) => [s.key, i]),
);
