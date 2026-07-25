// Maestro — shared domain types

export type AgentType =
  | "chief_director"
  | "opportunity_hunter"
  | "research_analyst"
  | "competitor_intelligence"
  | "story_architect"
  | "hook_engineer"
  | "thumbnail_director"
  | "script_writer"
  | "fact_checker"
  | "seo_specialist"
  | "publishing_manager"
  | "analytics_scientist"
  | "knowledge_curator"
  | "voice_dna"
  | "production_designer";

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

// ════════════════════════════════════════════════════════════════════════════
// PHASE 2 — Real intelligence, production & publishing record types
// ════════════════════════════════════════════════════════════════════════════

export interface AdvancedScoreBreakdown {
  viralVelocity: number;      // rate of view growth on related videos
  searchDemand: number;       // YouTube + Google search volume signals
  competitionGap: number;     // how underserved the topic is (inverse of saturation)
  monetizationPotential: number; // sponsor fit, audience value
  expertiseAlignment: number; // match to creator's stored expertise
  trendMomentum: number;      // acceleration of interest
}

export interface TrendSignalRecord {
  id: string;
  projectId?: string | null;
  niche: string;
  source: "youtube" | "google_trends" | "reddit" | "news" | "search" | "competitor";
  title: string;
  url: string;
  snippet: string;
  metric?: string | null;
  metricValue?: number | null;
  momentum?: "rising" | "peaking" | "stable" | "declining" | null;
  capturedAt: string;
}

export interface CompetitorVideoRecord {
  id: string;
  projectId?: string | null;
  niche: string;
  url: string;
  channel: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt?: string | null;
  durationSec: number;
  titleAnalysis: {
    pattern: string;
    hooks: string[];
    curiosityTriggers: string[];
    length: number;
    sentiment: string;
  };
  thumbnailAnalysis: {
    composition: string;
    focal: string;
    textOverlay: string;
    emotion: string;
    colorMood: string;
    readability: number;
  };
  transcriptSummary: {
    structure: string;
    keyPoints: string[];
    retentionPattern: string;
    callsToAction: string[];
  };
  commentInsights: {
    topQuestions: string[];
    painPoints: string[];
    praises: string[];
    objections: string[];
    audienceQuestions: string[];
  };
  winningPatterns: { pattern: string; whyItWorked: string; applicability: string }[];
  performanceScore: number;
  capturedAt: string;
}

export interface VoiceDNARecord {
  id: string;
  writingStyle: {
    avgSentenceLength: string;
    structure: string;
    complexity: string;
    register: string;
  };
  vocabulary: {
    signaturePhrases: string[];
    favoriteWords: string[];
    jargon: string[];
    avoidedTerms: string[];
  };
  storytellingPatterns: {
    openings: string[];
    callbacks: string[];
    frameworks: string[];
    transitions: string[];
  };
  humor: {
    style: string;
    frequency: string;
    type: string;
    examples: string[];
  };
  pacing: {
    wordsPerMinute: string;
    pausePattern: string;
    sectionLength: string;
    rhythm: string;
  };
  contentPreferences: {
    preferredFormats: string[];
    idealLength: string;
    structurePreference: string;
    depthLevel: string;
  };
  emotionalTone: {
    defaultTone: string;
    range: string;
    shifts: string;
    intensity: string;
  };
  uniquenessScore: number;
  sourceSamples: { from: string; excerpt: string }[];
  sampleCount: number;
  createdAt: string;
}

export interface InterviewSessionRecord {
  id: string;
  projectId: string;
  status: "active" | "completed";
  topicsCovered: { topic: string; covered: boolean; depth: number }[];
  questions: { id: string; question: string; intent: string; topic: string; asked: boolean }[];
  extracted: {
    type: "story" | "opinion" | "framework" | "example" | "expertise";
    content: string;
    themeTag: string;
  }[];
  turnCount: number;
  startedAt: string;
  updatedAt: string;
}

export interface ThumbnailBriefRecord {
  id: string;
  projectId: string;
  concept: string;
  visualLayout: {
    composition: string;
    focalSubject: string;
    background: string;
    depth: string;
    ruleOfThirds: string;
  };
  textOverlay: {
    text: string;
    font: string;
    size: string;
    position: string;
    contrast: string;
  };
  emotionalTriggers: { trigger: string; how: string }[];
  colorMood: { palette: string[]; mood: string; contrast: string };
  mobileReadability: number;
  readabilityNotes: string;
  aiPrompts: { variant: string; prompt: string; size: string; styleNotes: string }[];
  generatedImageUrl?: string | null;
  status: "brief" | "generating" | "generated" | "failed";
  createdAt: string;
}

export interface ProductionSceneRecord {
  id: string;
  projectId: string;
  sceneNumber: number;
  timecode: string;
  section: string;
  visualDescription: string;
  brollSuggestions: { description: string; source: string; duration: string }[];
  motionGraphics: { type: string; description: string; trigger: string }[];
  editorInstructions: string;
  captions: { text: string; timing: string; style: string }[];
  transitions: { from: string; to: string; type: string }[];
  assetRequirements: { type: string; description: string; priority: string }[];
  retentionNotes: string;
  createdAt: string;
}

export interface YouTubeConnectionRecord {
  id: string;
  channelName?: string | null;
  channelId?: string | null;
  status: "disconnected" | "connected" | "expired" | "error";
  connectedAt?: string | null;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Intelligence scan result — the full output of a real opportunity scan
export interface IntelligenceScanResult {
  niche: string;
  signals: TrendSignalRecord[];
  competitorVideos: CompetitorVideoRecord[];
  advancedScore: AdvancedScoreBreakdown;
  overallScore: number;
  momentum: "rising" | "peaking" | "stable" | "declining";
  summary: string;
  dataSources: { source: string; count: number; freshness: string }[];
}

// Holy Trifecta optimization candidate
export interface TrifectaCandidate {
  title: string;
  thumbnailConcept: string;
  openingHook: string;
  expectationMatch: number; // 0-100 — how aligned title/thumbnail/hook are
  curiosityGap: number; // 0-100
  retentionPrediction: number; // 0-100
  ctrPrediction: number; // 0-100
  compositeScore: number;
  rationale: string;
}


// ════════════════════════════════════════════════════════════════════════════
// PHASE 3 — AI Media Operating System types
// ════════════════════════════════════════════════════════════════════════════

export interface CapabilityRecord {
  id: string;
  key: string;
  name: string;
  description: string;
  category: "intelligence" | "creative" | "production" | "distribution" | "learning" | "identity" | "safety";
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  cost: "low" | "medium" | "high";
  latency: "fast" | "medium" | "slow";
  quality: "draft" | "good" | "high" | "production";
  source: string; // builtin | extension:<extId>
  extensionId?: string | null;
  agentType?: string | null;
  status: "active" | "disabled";
  // Capability Contract
  authenticitySupport?: MediaDNAType[];
  improvesDNA?: MediaDNAType[];
  requires?: string[];
  provider?: string | null;
  createdAt: string;
}

export interface ExtensionRecord {
  id: string;
  extId: string;
  name: string;
  version: string;
  description: string;
  publisher: string;
  capabilities: string[];
  agents: string[];
  permissions: string[];
  category: "core" | "studio" | "connector" | "pack";
  status: "available" | "installed" | "disabled";
  installedAt?: string | null;
  manifest: Record<string, unknown>;
  createdAt: string;
}

export interface CreatorIdentityRecord {
  id: string;
  mission?: string | null;
  beliefs: { belief: string; strength: number }[];
  experiences: { area: string; years: number; notable: string }[];
  stories: { title: string; summary: string; themeTag: string }[];
  frameworks: { name: string; description: string }[];
  analogies: string[];
  humor: { style: string; frequency: string; examples: string[] };
  values: string[];
  vocabulary: { signaturePhrases: string[]; favoriteWords: string[]; avoidedTerms: string[] };
  audienceExpectations: { whatTheyComeFor: string; whatTheyTrust: string; whatTheyReject: string };
  voiceDNAId?: string | null;
  authenticityScore: number;
  updatedAt: string;
  createdAt: string;
}

export interface OutputChannelRecord {
  id: string;
  key: string;
  name: string;
  icon: string;
  category: "video" | "short" | "social" | "text" | "audio";
  description: string;
  status: "available" | "connected" | "error";
  config: Record<string, unknown>;
  connectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionPlanStep {
  stepKey: string;
  stepLabel: string;
  capabilityKey: string;
  capabilityName: string;
  agentType?: string | null;
  inputs: string[];
  outputs: string[];
  rationale: string;
  requiresApproval: boolean;
  status: "pending" | "running" | "completed" | "skipped";
}

export interface ProductionPlanRecord {
  id: string;
  projectId?: string | null;
  intent: string;
  targetChannel?: string | null;
  steps: ProductionPlanStep[];
  rationale: string;
  capabilitiesUsed: string[];
  status: "draft" | "approved" | "running" | "completed";
  createdAt: string;
  updatedAt: string;
}

// The Director's compiled plan (before persistence)
export interface CompiledPlan {
  intent: string;
  targetChannel: string;
  steps: ProductionPlanStep[];
  rationale: string;
  capabilitiesUsed: string[];
  capabilitiesConsidered: { key: string; name: string; used: boolean; reason: string }[];
  identityGrounded: boolean;
  extensionsRequired: string[];
}

// Media OS overview (for the kernel dashboard)
export interface MediaOSOverview {
  layers: { name: string; description: string; count: number; status: string }[];
  capabilityCount: number;
  extensionCount: number;
  installedExtensionCount: number;
  channelCount: number;
  connectedChannelCount: number;
  identityAuthenticity: number;
  capabilitiesByCategory: { category: string; count: number }[];
  activePlans: number;
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE 4 — Authenticity Engine + Media DNA + Semantic Memory + Developer SDK
// ════════════════════════════════════════════════════════════════════════════

export type MediaDNAType = "voice" | "visual" | "writing" | "editing" | "story" | "reasoning" | "brand" | "teaching";

export interface MediaDNARecord {
  id: string;
  type: MediaDNAType;
  content: Record<string, unknown>;
  source: string;
  sourceRef?: string | null;
  confidence: number;
  updatedAt: string;
  createdAt: string;
}

export interface AuthenticityDimensionScore {
  voice: number;
  reasoning: number;
  humor: number;
  vocabulary: number;
  editing: number;
  visualIdentity: number;
  audienceExpectation: number;
}

export interface AuthenticityScoreRecord {
  id: string;
  projectId?: string | null;
  artifactType: "script" | "trifecta" | "thumbnail" | "scene" | "full_production";
  artifactRef?: string | null;
  overall: number;
  dimensions: AuthenticityDimensionScore;
  passed: boolean;
  blockingReason?: string | null;
  threshold: number;
  rationale?: string | null;
  createdAt: string;
}

export interface AuthenticityCheckResult {
  passed: boolean;
  overall: number;
  dimensions: AuthenticityDimensionScore;
  blockingReason?: string;
  threshold: number;
  rationale: string;
  scoreId: string;
}

export type SemanticMemoryType =
  | "principle" | "lesson" | "pattern" | "mistake" | "experiment"
  | "framework" | "evidence" | "relationship" | "audience_reaction";

export interface SemanticMemoryRecord {
  id: string;
  type: SemanticMemoryType;
  label: string;
  content: string;
  evidence?: string;
  confidence: number;
  weight: number;
  projectId?: string | null;
  createdAt: string;
}

// Developer SDK: defineExtension spec
export interface ExtensionManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  capabilities: { key: string; name: string; description: string; inputs?: string[]; outputs?: string[]; authenticity?: MediaDNAType[]; improvesDNA?: MediaDNAType[]; cost?: number; latencySec?: number; qualityScore?: number }[];
  agents: string[];
  connectors: string[];
  workflows: string[];
  permissions: string[];
  requirements?: Record<string, unknown>;
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE 5 — Media Primitives + Capability Contracts + Pervasive Authenticity
// ════════════════════════════════════════════════════════════════════════════

export type PrimitiveType =
  | "idea" | "claim" | "story" | "evidence" | "scene"
  | "voice_performance" | "visual_asset" | "audience_reaction" | "knowledge_asset";

export interface MediaPrimitiveRecord {
  id: string;
  type: PrimitiveType;
  title: string;
  content: string;
  format: "text" | "json" | "markdown" | "audio_url" | "image_url" | "video_url";
  source: string;
  sourceRef?: string | null;
  projectId?: string | null;
  parentId?: string | null;
  provenance: { step: string; capability: string; timestamp: string }[];
  tags: string[];
  status: "draft" | "ready" | "published" | "archived";
  authenticityScore: number;
  createdAt: string;
  updatedAt: string;
}

// Capability Contract — the enriched capability metadata the Director uses to optimize plans
export interface CapabilityContract {
  key: string;
  name: string;
  description: string;
  category: string;
  inputs: string[];
  outputs: string[];
  cost: "low" | "medium" | "high";
  costUsd: number;
  latency: "fast" | "medium" | "slow";
  latencySec: number;
  quality: "draft" | "good" | "high" | "production";
  qualityScore: number;
  authenticitySupport: MediaDNAType[]; // DNA types this capability can be checked against
  improvesDNA: MediaDNAType[]; // DNA types this capability provides reference data for
  requires: string[]; // permissions
  provider: string;
  source: string;
}

// Pervasive authenticity: check a full pipeline of artifacts at once
export interface PipelineArtifact {
  type: "script" | "trifecta" | "thumbnail" | "scene" | "voice" | "video" | "metadata" | "full_production";
  content: string;
  ref?: string;
}

export interface PipelineAuthenticityResult {
  artifacts: { type: string; overall: number; passed: boolean; dimensions: AuthenticityDimensionScore }[];
  overallPipeline: number;
  allPassed: boolean;
  blockingArtifacts: { type: string; reason: string }[];
  publishAllowed: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE 6 — Creative Constitution + Creative Policies + Provenance
// The "why" layer. Authenticity becomes Constitutional AI.
// ════════════════════════════════════════════════════════════════════════════

export type ConstitutionCategory = "truthfulness" | "teaching" | "tone" | "business" | "audience" | "editing";

export interface ConstitutionPrincipleRecord {
  id: string;
  category: ConstitutionCategory;
  principle: string;
  rationale: string;
  enforcement: "block" | "warn" | "log";
  examples: string[];
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConstitutionViolationRecord {
  id: string;
  principleId?: string | null;
  category: string;
  principle: string;
  artifactType: string;
  artifactRef?: string | null;
  projectId?: string | null;
  severity: "block" | "warn" | "log";
  reason: string;
  context: Record<string, unknown>;
  status: "open" | "resolved" | "overridden";
  resolution?: string | null;
  createdAt: string;
}

export interface ConstitutionCheckResult {
  passed: boolean;
  overallAlignment: number; // 0-100 — how aligned the artifact is with the constitution
  violations: { category: string; principle: string; severity: string; reason: string }[];
  categoryScores: { category: ConstitutionCategory; score: number }[];
  riskLevel: "low" | "medium" | "high";
}

export interface CreativePolicyRecord {
  id: string;
  name: string;
  rule: string;
  scope: "voice" | "video" | "publish" | "research" | "opinion" | "all";
  condition: Record<string, unknown>;
  action: "require_approval" | "block" | "allow" | "log";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  requiresApproval: boolean;
  matchedPolicies: { name: string; rule: string; action: string }[];
  reason: string;
}
