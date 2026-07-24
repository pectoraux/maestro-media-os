// Frontend API helpers. All use relative paths (gateway-safe).

import type {
  AgentRunRecord,
  ApprovalGateRecord,
  ActivityRecord,
  AssetRecord,
  BlueprintRecord,
  CreatorProfileRecord,
  DossierRecord,
  KnowledgeEdgeRecord,
  KnowledgeNodeRecord,
  OpportunityRecord,
  PerformanceRecord,
  ProjectStage,
  ProjectStatus,
  PublishMetadataRecord,
  RunAgentRequest,
  RunAgentResponse,
  ScriptRecord,
  TrifectaRecord,
  TrendSignalRecord,
  CompetitorVideoRecord,
  VoiceDNARecord,
  InterviewSessionRecord,
  ThumbnailBriefRecord,
  ProductionSceneRecord,
  YouTubeConnectionRecord,
  AdvancedScoreBreakdown,
  TrifectaCandidate,
  CapabilityRecord,
  ExtensionRecord,
  CreatorIdentityRecord,
  OutputChannelRecord,
  CompiledPlan,
  ProductionPlanRecord,
} from "./types";

export interface ProjectListItem {
  id: string;
  title: string;
  niche: string;
  status: ProjectStatus;
  stage: ProjectStage;
  brief: string | null;
  createdAt: string;
  pendingApprovalStage?: string | null;
  opportunityScore?: number | null;
}

export interface ProjectDetail {
  id: string;
  title: string;
  niche: string;
  status: ProjectStatus;
  stage: ProjectStage;
  brief: string | null;
  createdAt: string;
  updatedAt: string;
  opportunity: OpportunityRecord | null;
  dossier: DossierRecord | null;
  interviews: { id: string; question: string; answer: string; themeTag: string | null; createdAt: string }[];
  scripts: ScriptRecord[];
  trifecta: TrifectaRecord | null;
  blueprint: BlueprintRecord | null;
  assets: AssetRecord[];
  publishMetadata: PublishMetadataRecord | null;
  metrics: PerformanceRecord | null;
  approvals: ApprovalGateRecord[];
  agentRuns: AgentRunRecord[];
  activities: ActivityRecord[];
  // Phase 2 relations
  competitorVideos: CompetitorVideoRecord[];
  interviewSession: InterviewSessionRecord | null;
  thumbnailBriefs: ThumbnailBriefRecord[];
  productionScenes: ProductionSceneRecord[];
  trendSignals: TrendSignalRecord[];
}

export interface AgentRosterItem {
  type: string;
  name: string;
  role: string;
  icon: string;
  color: string;
  capabilities: string[];
  stage: string;
  status: "succeeded" | "running" | "failed" | "idle";
  lastRunAt: string | null;
  runCount: number;
}

export interface DashboardData {
  projectCount: number;
  projectCountsByStatus: Record<string, number>;
  pendingApprovals: number;
  knowledgeNodeCount: number;
  totalViews: number;
  avgCTR: number;
  agentActivity: AgentRunRecord[];
  recentOpportunities: (OpportunityRecord & { projectTitle?: string })[];
}

export interface KnowledgeGraphData {
  nodes: KnowledgeNodeRecord[];
  edges: KnowledgeEdgeRecord[];
  counts: Record<string, number>;
}

export interface AnalyticsData {
  metrics: (PerformanceRecord & { projectTitle?: string })[];
  aggregates: {
    avgCTR: number;
    avgRetention: number;
    totalViews: number;
    totalRevenue: number;
    bestProject?: { id: string; title: string; ctr: number } | null;
  };
  lessons: string[];
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      msg = body.error || body.message || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export const api = {
  // ── Dashboard ───────────────────────────────────────────────────────────
  dashboard: () =>
    fetch("/api/dashboard", { cache: "no-store" }).then((r) => jsonOrThrow<DashboardData>(r)),

  // ── Projects ────────────────────────────────────────────────────────────
  listProjects: () =>
    fetch("/api/projects", { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ projects: ProjectListItem[] }>(r),
    ),
  getProject: (id: string) =>
    fetch(`/api/projects/${id}`, { cache: "no-store" }).then((r) => jsonOrThrow<ProjectDetail>(r)),
  createProject: (body: { title: string; niche: string; brief?: string }) =>
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => jsonOrThrow<ProjectListItem>(r)),

  // ── Opportunities ───────────────────────────────────────────────────────
  listOpportunities: () =>
    fetch("/api/opportunities", { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ opportunities: (OpportunityRecord & { projectTitle?: string; projectStatus?: string })[] }>(r),
    ),
  discoverOpportunity: (niche?: string) =>
    fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche }),
    }).then((r) => jsonOrThrow<OpportunityRecord>(r)),
  acceptOpportunity: (id: string) =>
    fetch(`/api/opportunities/${id}/accept`, { method: "POST" }).then((r) =>
      jsonOrThrow<{ id: string; status: string }>(r),
    ),
  rejectOpportunity: (id: string) =>
    fetch(`/api/opportunities/${id}/reject`, { method: "POST" }).then((r) =>
      jsonOrThrow<{ id: string; status: string }>(r),
    ),

  // ── Agents ──────────────────────────────────────────────────────────────
  agentRoster: () =>
    fetch("/api/agents", { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ agents: AgentRosterItem[] }>(r),
    ),
  runAgent: (body: RunAgentRequest) =>
    fetch("/api/agents/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => jsonOrThrow<RunAgentResponse>(r)),

  // ── Approvals ───────────────────────────────────────────────────────────
  listApprovals: (status?: "pending" | "approved" | "rejected" | "revised") =>
    fetch(`/api/approvals${status ? `?status=${status}` : ""}`, { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ approvals: (ApprovalGateRecord & { projectTitle?: string })[] }>(r),
    ),
  decideApproval: (id: string, decision: "approved" | "rejected" | "revised", feedback?: string) =>
    fetch(`/api/approvals/${id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, feedback }),
    }).then((r) =>
      jsonOrThrow<{ id: string; status: string; newStage?: string }>(r),
    ),

  // ── Interview ───────────────────────────────────────────────────────────
  listInterviews: (projectId: string) =>
    fetch(`/api/interview?projectId=${projectId}`, { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ interviews: { id: string; question: string; answer: string; themeTag: string | null; createdAt: string }[] }>(r),
    ),
  submitInterview: (body: { projectId: string; question: string; answer: string; themeTag?: string }) =>
    fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => jsonOrThrow<{ id: string }>(r)),

  // ── Knowledge ───────────────────────────────────────────────────────────
  knowledge: () =>
    fetch("/api/knowledge", { cache: "no-store" }).then((r) =>
      jsonOrThrow<KnowledgeGraphData>(r),
    ),

  // ── Analytics ───────────────────────────────────────────────────────────
  analytics: () =>
    fetch("/api/analytics", { cache: "no-store" }).then((r) =>
      jsonOrThrow<AnalyticsData>(r),
    ),

  // ── Activity ────────────────────────────────────────────────────────────
  activity: (projectId?: string) =>
    fetch(`/api/activity${projectId ? `?projectId=${projectId}` : ""}`, { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ activities: (ActivityRecord & { projectTitle?: string })[] }>(r),
    ),

  // ── Creator ─────────────────────────────────────────────────────────────
  creator: () =>
    fetch("/api/creator", { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ profile: CreatorProfileRecord | null }>(r),
    ),

  // ── Phase 2: Intelligence Engine ────────────────────────────────────────
  scanIntelligence: (niche: string) =>
    fetch("/api/intelligence/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche }),
    }).then((r) =>
      jsonOrThrow<{
        niche: string;
        signals: TrendSignalRecord[];
        advancedScore: AdvancedScoreBreakdown;
        overallScore: number;
        momentum: string;
        summary: string;
        dataSources: { source: string; count: number; freshness: string }[];
      }>(r),
    ),

  // ── Phase 2: Competitor Intelligence ────────────────────────────────────
  listCompetitors: (niche?: string, projectId?: string) => {
    const params = new URLSearchParams();
    if (niche) params.set("niche", niche);
    if (projectId) params.set("projectId", projectId);
    return fetch(`/api/competitors?${params}`, { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ competitors: CompetitorVideoRecord[] }>(r),
    );
  },
  analyzeCompetitors: (body: { niche: string; projectId?: string; limit?: number }) =>
    fetch("/api/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => jsonOrThrow<{ competitors: CompetitorVideoRecord[] }>(r)),

  // ── Phase 2: Conversational Interview ───────────────────────────────────
  getInterview: (projectId: string) =>
    fetch(`/api/interview/${projectId}`, { cache: "no-store" }).then((r) =>
      jsonOrThrow<{
        session: InterviewSessionRecord | null;
        nextQuestion: { question: string; intent: string; topic: string; isFollowUp: boolean; sessionId: string } | null;
      }>(r),
    ),
  interviewAction: (projectId: string, body: { action: "start" | "answer" | "complete"; question?: string; answer?: string; topic?: string }) =>
    fetch(`/api/interview/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) =>
      jsonOrThrow<{
        session: InterviewSessionRecord;
        extracted?: { type: string; content: string; themeTag: string }[];
        nextQuestion?: { question: string; intent: string; topic: string; isFollowUp: boolean; sessionId: string } | null;
      }>(r),
    ),

  // ── Phase 2: Voice DNA ──────────────────────────────────────────────────
  getVoiceDNA: () =>
    fetch("/api/voice-dna", { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ voiceDNA: VoiceDNARecord | null }>(r),
    ),
  extractVoiceDNA: () =>
    fetch("/api/voice-dna", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).then((r) => jsonOrThrow<{ voiceDNA: VoiceDNARecord }>(r)),

  // ── Phase 2: Production Scenes ──────────────────────────────────────────
  getProductionScenes: (projectId: string) =>
    fetch(`/api/production/${projectId}`, { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ scenes: ProductionSceneRecord[] }>(r),
    ),
  generateProductionScenes: (projectId: string, targetDurationMin?: number) =>
    fetch(`/api/production/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetDurationMin }),
    }).then((r) => jsonOrThrow<{ scenes: ProductionSceneRecord[] }>(r)),

  // ── Phase 2: Thumbnail Briefs ────────────────────────────────────────────
  listThumbnails: (projectId: string) =>
    fetch(`/api/thumbnails?projectId=${projectId}`, { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ briefs: ThumbnailBriefRecord[] }>(r),
    ),
  generateThumbnailBrief: (projectId: string) =>
    fetch("/api/thumbnails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    }).then((r) => jsonOrThrow<{ brief: ThumbnailBriefRecord }>(r)),
  generateThumbnailImage: (briefId: string) =>
    fetch(`/api/thumbnails/${briefId}/generate`, { method: "POST" }).then((r) =>
      jsonOrThrow<{ brief: ThumbnailBriefRecord; imageUrl: string }>(r),
    ),

  // ── Phase 2: Holy Trifecta optimizer ────────────────────────────────────
  getTrifecta: (projectId: string) =>
    fetch(`/api/trifecta/${projectId}`, { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ trifecta: TrifectaRecord | null }>(r),
    ),
  optimizeTrifecta: (projectId: string) =>
    fetch(`/api/trifecta/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).then((r) =>
      jsonOrThrow<{ winner: TrifectaCandidate; candidates: TrifectaCandidate[]; voiceDNAUsed: boolean }>(r),
    ),

  // ── Phase 2: YouTube connection + publish ───────────────────────────────
  getYouTubeConnection: () =>
    fetch("/api/youtube", { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ connection: YouTubeConnectionRecord | null }>(r),
    ),
  connectYouTube: (channelName: string) =>
    fetch("/api/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "connect", channelName }),
    }).then((r) => jsonOrThrow<{ connection: YouTubeConnectionRecord }>(r)),
  disconnectYouTube: () =>
    fetch("/api/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disconnect" }),
    }).then((r) => jsonOrThrow<{ connection: YouTubeConnectionRecord }>(r)),
  publishToYouTube: (projectId: string) =>
    fetch("/api/youtube/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    }).then((r) =>
      jsonOrThrow<{ published: boolean; scheduledAt: string | null; note: string; payload: unknown }>(r),
    ),

  // ── Phase 3: Media OS ────────────────────────────────────────────────────
  getOSOverview: () =>
    fetch("/api/os/overview", { cache: "no-store" }).then((r) => jsonOrThrow<any>(r)),
  listCapabilities: (category?: string) =>
    fetch(`/api/os/capabilities${category ? `?category=${category}` : ""}`, { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ capabilities: CapabilityRecord[] }>(r),
    ),
  listExtensions: (status?: string) =>
    fetch(`/api/os/extensions${status ? `?status=${status}` : ""}`, { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ extensions: ExtensionRecord[] }>(r),
    ),
  installExtension: (extId: string) =>
    fetch("/api/os/extensions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "install", extId }),
    }).then((r) => jsonOrThrow<{ extension: ExtensionRecord }>(r)),
  disableExtension: (extId: string) =>
    fetch("/api/os/extensions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disable", extId }),
    }).then((r) => jsonOrThrow<{ extension: ExtensionRecord }>(r)),
  getIdentity: () =>
    fetch("/api/os/identity", { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ identity: CreatorIdentityRecord | null }>(r),
    ),
  updateIdentity: (patch: Partial<CreatorIdentityRecord>) =>
    fetch("/api/os/identity", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then((r) => jsonOrThrow<{ identity: CreatorIdentityRecord }>(r)),
  listChannels: (status?: string) =>
    fetch(`/api/os/connectors${status ? `?status=${status}` : ""}`, { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ channels: OutputChannelRecord[] }>(r),
    ),
  connectChannel: (key: string, config?: Record<string, unknown>) =>
    fetch("/api/os/connectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "connect", key, config }),
    }).then((r) => jsonOrThrow<{ channel: OutputChannelRecord }>(r)),
  disconnectChannel: (key: string) =>
    fetch("/api/os/connectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disconnect", key }),
    }).then((r) => jsonOrThrow<{ channel: OutputChannelRecord }>(r)),
  compilePlan: (body: { intent: string; targetChannel?: string; projectId?: string; preferences?: Record<string, unknown> }) =>
    fetch("/api/os/director/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => jsonOrThrow<{ plan: CompiledPlan; savedPlan: ProductionPlanRecord }>(r)),
  listPlans: (projectId?: string) =>
    fetch(`/api/os/director/plans${projectId ? `?projectId=${projectId}` : ""}`, { cache: "no-store" }).then((r) =>
      jsonOrThrow<{ plans: ProductionPlanRecord[] }>(r),
    ),
  approvePlan: (id: string) =>
    fetch(`/api/os/director/plans/${id}`, { method: "POST" }).then((r) =>
      jsonOrThrow<{ plan: ProductionPlanRecord }>(r),
    ),
};
