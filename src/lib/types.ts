// Maestro — shared domain types

export type AgentType =
  | "chief_director"
  | "opportunity_hunter"
  | "research_analyst"
  | "story_architect"
  | "hook_engineer"
  | "thumbnail_director"
  | "script_writer"
  | "fact_checker"
  | "seo_specialist"
  | "publishing_manager"
  | "analytics_scientist"
  | "knowledge_curator";

export interface AgentMeta {
  type: AgentType;
  name: string;
  role: string;
  icon: string; // lucide icon name
  color: string; // tailwind text color class
  capabilities: string[];
  stage: string; // pipeline stage it operates in
}

export interface AgentRunRecord {
  id: string;
  agentType: AgentType;
  projectId: string | null;
  status: "running" | "succeeded" | "failed";
  input: unknown;
  output: unknown;
  tokens: number;
  durationMs: number;
  error?: string | null;
  createdAt: string;
}

export type ProjectStage =
  | "opportunity"
  | "dossier"
  | "interview"
  | "outline"
  | "expanded"
  | "draft"
  | "factcheck"
  | "final"
  | "trifecta"
  | "blueprint"
  | "assets"
  | "metadata"
  | "scheduled"
  | "published";

export type ProjectStatus =
  | "discovery"
  | "research"
  | "scripting"
  | "packaging"
  | "production"
  | "publish"
  | "live"
  | "archived";

export interface PipelineStageInfo {
  key: ProjectStage;
  label: string;
  agent: AgentType;
  requiresApproval: boolean;
  description: string;
}

export interface ApprovalGateRecord {
  id: string;
  projectId: string;
  stage: string;
  agentType: AgentType;
  payload: ApprovalPayload;
  status: "pending" | "approved" | "rejected" | "revised";
  feedback?: string | null;
  decidedAt?: string | null;
  createdAt: string;
}

export interface ApprovalPayload {
  title: string;
  summary: string;
  highlights: string[];
  artifacts?: { label: string; value: string }[];
}

export interface OpportunityScoreBreakdown {
  searchDemand: number;
  competition: number;
  freshness: number;
  audienceFit: number;
  monetization: number;
  knowledgeGap: number;
}

export interface OpportunityRecord {
  id: string;
  projectId: string;
  title: string;
  niche: string;
  angle: string;
  opportunityScore: number;
  scoreBreakdown: OpportunityScoreBreakdown;
  sources: { name: string; type: string; signal: string }[];
  competitors: { channel: string; subs: string; gap: string }[];
  audienceSignals: string[];
  trends: { source: string; signal: string; momentum: string }[];
  confidence: "low" | "medium" | "high";
  status: "new" | "accepted" | "rejected" | "archived";
  createdAt: string;
}

export interface DossierRecord {
  id: string;
  projectId: string;
  summary: string;
  marketData: { label: string; value: string }[];
  competitors: { channel: string; positioning: string; weakness: string }[];
  audienceInsights: string[];
  news: { title: string; source: string; date: string; relevance: string }[];
  references: { title: string; url: string; note: string }[];
  knowledgeGaps: string[];
}

export interface ScriptRecord {
  id: string;
  projectId: string;
  stage: "outline" | "expanded_outline" | "draft" | "final";
  content: string;
  version: number;
  notes?: string | null;
  createdAt: string;
}

export interface TrifectaRecord {
  id: string;
  projectId: string;
  title: string;
  thumbnailStrategy: {
    concept: string;
    textOverlay: string;
    focalSubject: string;
    colorMood: string;
    emotion: string;
  };
  openingHook: string;
  rationale: string;
  variants: { title: string; hook: string }[];
  expectationMatch: string;
}

export interface BlueprintSegment {
  timecode: string;
  section: string;
  broll: string;
  graphics: string;
  captions: string;
  transitions: string;
  retentionNotes: string;
}

export interface BlueprintRecord {
  id: string;
  projectId: string;
  segments: BlueprintSegment[];
  totalDuration: string;
}

export interface AssetRecord {
  id: string;
  projectId: string;
  type:
    | "diagram"
    | "infographic"
    | "social"
    | "repurposed_short"
    | "repurposed_blog"
    | "thumbnail_concept";
  title: string;
  prompt: string;
  status: "pending" | "generating" | "ready" | "failed";
  url?: string | null;
  spec: Record<string, unknown>;
}

export interface PublishMetadataRecord {
  id: string;
  projectId: string;
  description: string;
  chapters: { timecode: string; title: string }[];
  tags: string[];
  pinnedComment?: string | null;
  playlist?: string | null;
  publishAt?: string | null;
  endScreen?: { type: string; target: string }[] | null;
}

export interface PerformanceRecord {
  id: string;
  projectId: string;
  ctr: number;
  retention: number;
  avgViewDuration: number;
  impressions: number;
  views: number;
  trafficSources: { source: string; share: number }[];
  revenue: number;
  engagement: number;
  lessons: string[];
  recordedAt: string;
}

export interface KnowledgeNodeRecord {
  id: string;
  type:
    | "audience_insight"
    | "creator_voice"
    | "research"
    | "editorial"
    | "history"
    | "pattern"
    | "competitor";
  label: string;
  content: string;
  weight: number;
  projectId?: string | null;
  createdAt: string;
  connections?: number;
}

export interface KnowledgeEdgeRecord {
  sourceId: string;
  targetId: string;
  relation: string;
  weight: number;
}

export interface CreatorProfileRecord {
  id: string;
  voiceProfile: {
    tone: string;
    pacing: string;
    vocabulary: string;
    signatures: string[];
  };
  styleGuidelines: string[];
  expertise: { area: string; depth: string }[];
  recurringThemes: string[];
  toneSamples: string[];
  distinctivenessScore: number;
}

export interface ActivityRecord {
  id: string;
  projectId?: string | null;
  type: "agent" | "approval" | "system" | "creator";
  message: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface RunAgentRequest {
  agentType: AgentType;
  projectId?: string;
  input?: Record<string, unknown>;
}

export interface RunAgentResponse {
  runId: string;
  agentType: AgentType;
  status: "succeeded" | "failed";
  output: unknown;
  durationMs: number;
  error?: string;
}
