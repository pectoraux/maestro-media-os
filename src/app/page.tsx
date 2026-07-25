"use client";

import { useApp, type ViewKey } from "@/lib/store";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Radar,
  Workflow,
  ClipboardCheck,
  Bot,
  Network,
  BarChart3,
  UserRound,
  Menu,
  Activity,
  CircleDot,
  Satellite,
  Crosshair,
  MessagesSquare,
  Fingerprint,
  Clapperboard,
  Send,
  Boxes,
  Store,
  IdCard,
  Plug,
  Compass,
  Scale,
  ShieldCheck,
  Brain,
  Share2,
  Code2,
} from "lucide-react";
import { DashboardView } from "@/components/views/dashboard-view";
import { OpportunitiesView } from "@/components/views/opportunities-view";
import { WorkspaceView } from "@/components/views/workspace-view";
import { ApprovalsView } from "@/components/views/approvals-view";
import { AgentsView } from "@/components/views/agents-view";
import { KnowledgeView } from "@/components/views/knowledge-view";
import { AnalyticsView } from "@/components/views/analytics-view";
import { CreatorView } from "@/components/views/creator-view";
import { IntelligenceView } from "@/components/views/intelligence-view";
import { CompetitorsView } from "@/components/views/competitors-view";
import { InterviewView } from "@/components/views/interview-view";
import { VoiceDnaView } from "@/components/views/voice-dna-view";
import { ProductionView } from "@/components/views/production-view";
import { PublishView } from "@/components/views/publish-view";
import { MediaOSView } from "@/components/views/media-os-view";
import { MarketplaceView } from "@/components/views/marketplace-view";
import { IdentityView } from "@/components/views/identity-view";
import { ConnectorsView } from "@/components/views/connectors-view";
import { DirectorView } from "@/components/views/director-view";
import { AuthenticityView } from "@/components/views/authenticity-view";
import { DeveloperView } from "@/components/views/developer-view";
import { PrimitivesView } from "@/components/views/primitives-view";
import { ConstitutionView } from "@/components/views/constitution-view";
import { TrustView } from "@/components/views/trust-view";
import { MindView } from "@/components/views/mind-view";
import { KnowledgeGraphView } from "@/components/views/knowledge-graph-view";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const NAV: { key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }>; group: string }[] = [
  { key: "dashboard", label: "Command Center", icon: LayoutDashboard, group: "Overview" },
  { key: "media-os", label: "Media OS", icon: Boxes, group: "Overview" },
  { key: "director", label: "Director AI", icon: Compass, group: "Overview" },
  { key: "intelligence", label: "Intelligence Engine", icon: Satellite, group: "Overview" },
  { key: "opportunities", label: "Opportunity Discovery", icon: Radar, group: "Overview" },
  { key: "approvals", label: "Approval Queue", icon: ClipboardCheck, group: "Overview" },
  { key: "workspace", label: "Project Workspace", icon: Workflow, group: "Production" },
  { key: "interview", label: "Creator Interview", icon: MessagesSquare, group: "Production" },
  { key: "production", label: "Production Blueprint", icon: Clapperboard, group: "Production" },
  { key: "publish", label: "YouTube Publishing", icon: Send, group: "Production" },
  { key: "competitors", label: "Competitor Intelligence", icon: Crosshair, group: "Intelligence" },
  { key: "voice-dna", label: "Voice DNA", icon: Fingerprint, group: "Intelligence" },
  { key: "mind", label: "Creator Mind", icon: Brain, group: "Platform" },
  { key: "knowledge-graph", label: "Knowledge Graph", icon: Share2, group: "Platform" },
  { key: "constitution", label: "Creative Constitution", icon: Scale, group: "Platform" },
  { key: "authenticity", label: "Authenticity Engine", icon: ShieldCheck, group: "Platform" },
  { key: "trust", label: "Trust Engine", icon: ShieldCheck, group: "Platform" },
  { key: "primitives", label: "Media Primitives", icon: Boxes, group: "Platform" },
  { key: "identity", label: "Creator Identity", icon: IdCard, group: "Platform" },
  { key: "marketplace", label: "Capability Marketplace", icon: Store, group: "Platform" },
  { key: "connectors", label: "Output Connectors", icon: Plug, group: "Platform" },
  { key: "developer", label: "Developer SDK", icon: Code2, group: "Platform" },
  { key: "agents", label: "Agent Roster", icon: Bot, group: "Intelligence" },
  { key: "knowledge", label: "Knowledge Graph", icon: Network, group: "Intelligence" },
  { key: "analytics", label: "Performance & Learning", icon: BarChart3, group: "Intelligence" },
  { key: "creator", label: "Creator Profile", icon: UserRound, group: "Intelligence" },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { view, setView } = useApp();
  const groups = Array.from(new Set(NAV.map((n) => n.group)));
  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {groups.map((group) => (
        <div key={group} className="flex flex-col gap-1">
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            {group}
          </p>
          {NAV.filter((n) => n.group === group).map((item) => {
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setView(item.key);
                  onNavigate?.();
                }}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-primary/15 text-primary-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active ? "text-emerald-400" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span className="truncate">{item.label}</span>
                {active && <CircleDot className="ml-auto h-3 w-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-amber-400 shadow-lg shadow-emerald-500/20">
        <Icon name="Orchestra" className="h-5 w-5 text-black" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight">Maestro</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          YouTube Intelligence OS
        </span>
      </div>
    </div>
  );
}

function SystemPulse() {
  const { data } = useQuery({
    queryKey: ["dashboard-mini"],
    queryFn: api.dashboard,
    refetchInterval: 30_000,
  });
  const pending = data?.pendingApprovals ?? 0;
  const nodes = data?.knowledgeNodeCount ?? 0;
  return (
    <div className="mx-3 mb-3 rounded-xl border border-border/60 bg-card/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          System Live
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-background/50 p-2">
          <p className="text-muted-foreground">Pending gates</p>
          <p className="font-mono text-base font-semibold text-amber-300">{pending}</p>
        </div>
        <div className="rounded-lg bg-background/50 p-2">
          <p className="text-muted-foreground">Knowledge nodes</p>
          <p className="font-mono text-base font-semibold text-emerald-300">{nodes}</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { view, sidebarOpen, setSidebarOpen } = useApp();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl lg:flex">
          <Brand />
          <div className="flex-1 overflow-y-auto scroll-thin">
            <NavList />
          </div>
          <SystemPulse />
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Brand />
            <div className="flex-1 overflow-y-auto scroll-thin">
              <NavList onNavigate={() => setSidebarOpen(false)} />
            </div>
            <SystemPulse />
          </SheetContent>
        </Sheet>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl lg:px-8">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span className="hidden sm:inline">Maestro is orchestrating</span>
              <span className="sm:hidden">Maestro</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Human-in-the-loop · AI handles research, you remain the storyteller
              </span>
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
                <span className="text-[11px] font-medium text-emerald-300">Creator in command</span>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
            {view === "dashboard" && <DashboardView />}
            {view === "intelligence" && <IntelligenceView />}
            {view === "opportunities" && <OpportunitiesView />}
            {view === "approvals" && <ApprovalsView />}
            {view === "workspace" && <WorkspaceView />}
            {view === "interview" && <InterviewView />}
            {view === "production" && <ProductionView />}
            {view === "publish" && <PublishView />}
            {view === "media-os" && <MediaOSView />}
            {view === "director" && <DirectorView />}
            {view === "marketplace" && <MarketplaceView />}
            {view === "identity" && <IdentityView />}
            {view === "connectors" && <ConnectorsView />}
            {view === "authenticity" && <AuthenticityView />}
            {view === "constitution" && <ConstitutionView />}
            {view === "trust" && <TrustView />}
            {view === "mind" && <MindView />}
            {view === "knowledge-graph" && <KnowledgeGraphView />}
            {view === "primitives" && <PrimitivesView />}
            {view === "developer" && <DeveloperView />}
            {view === "competitors" && <CompetitorsView />}
            {view === "voice-dna" && <VoiceDnaView />}
            {view === "agents" && <AgentsView />}
            {view === "knowledge" && <KnowledgeView />}
            {view === "analytics" && <AnalyticsView />}
            {view === "creator" && <CreatorView />}
          </main>
        </div>
      </div>

      {/* Sticky footer */}
      <footer className="mt-auto border-t border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl lg:px-8">
        <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Icon name="Orchestra" className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              <span className="font-medium text-foreground">Maestro</span> · YouTube Intelligence &amp;
              Production OS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>15 specialized agents · 1 human strategist</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Persistent knowledge graph</span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline text-emerald-400">Human-in-the-loop</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
