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
};
