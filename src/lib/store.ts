"use client";

import { create } from "zustand";

export type ViewKey =
  | "dashboard"
  | "opportunities"
  | "workspace"
  | "approvals"
  | "agents"
  | "knowledge"
  | "analytics"
  | "creator"
  | "intelligence"
  | "competitors"
  | "interview"
  | "voice-dna"
  | "production"
  | "publish"
  | "media-os"
  | "marketplace"
  | "identity"
  | "connectors"
  | "director"
  | "authenticity"
  | "developer"
  | "primitives"
  | "constitution";

interface AppState {
  view: ViewKey;
  activeProjectId: string | null;
  setView: (v: ViewKey) => void;
  openProject: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

export const useApp = create<AppState>((set) => ({
  view: "dashboard",
  activeProjectId: null,
  setView: (view) => set({ view }),
  openProject: (id) => set({ activeProjectId: id, view: "workspace" }),
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
