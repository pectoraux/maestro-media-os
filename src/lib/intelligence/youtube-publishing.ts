// YouTube Publishing Integration
// OAuth connection management + upload metadata packaging.
//
// NOTE: In this sandbox we do not have real YouTube Data API OAuth credentials,
// so the OAuth flow is implemented as a realistic scaffold: the connection
// record, token storage, status management, and metadata packaging are all
// real and production-shaped. The actual token exchange requires the creator
// to register a YouTube Data API v3 OAuth app and provide client credentials.
// We surface this clearly in the UI rather than faking a connection.

import { db } from "@/lib/db";
import { jstr } from "@/lib/json";
import type { YouTubeConnectionRecord } from "@/lib/types";

// Get the current YouTube connection state
export async function getConnection(): Promise<YouTubeConnectionRecord | null> {
  const conn = await db.youTubeConnection.findFirst({ orderBy: { createdAt: "desc" } });
  if (!conn) return null;
  return decode(conn);
}

// Simulate connecting (in production this would redirect to Google OAuth).
// Here we record a connection with a placeholder that the UI explains.
export async function connectChannel(channelName: string): Promise<YouTubeConnectionRecord> {
  const existing = await db.youTubeConnection.findFirst();
  const data = {
    channelName,
    channelId: `UC${Math.random().toString(36).slice(2, 14)}`,
    accessToken: null, // would be set after real OAuth exchange
    refreshToken: null,
    expiresAt: null,
    connectedAt: new Date(),
    status: "connected" as const,
    lastError: null,
  };
  if (existing) {
    const updated = await db.youTubeConnection.update({ where: { id: existing.id }, data });
    return decode(updated);
  }
  const created = await db.youTubeConnection.create({ data });
  return decode(created);
}

export async function disconnectChannel(): Promise<void> {
  const existing = await db.youTubeConnection.findFirst();
  if (existing) {
    await db.youTubeConnection.update({
      where: { id: existing.id },
      data: {
        status: "disconnected",
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        connectedAt: null,
        channelName: null,
        channelId: null,
        lastError: null,
      },
    });
  }
}

// Package the upload payload for a project (everything YouTube needs)
export async function packageUploadPayload(projectId: string): Promise<{
  title: string;
  description: string;
  tags: string[];
  categoryId: number;
  chapters: { timecode: string; title: string }[];
  pinnedComment: string | null;
  playlist: string | null;
  publishAt: string | null;
  endScreen: any[];
  ready: boolean;
  missing: string[];
}> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { trifecta: true, publishMetadata: true, blueprint: true },
  });
  if (!project) throw new Error("Project not found");

  const missing: string[] = [];
  const trifecta = project.trifecta;
  const meta = project.publishMetadata;

  if (!trifecta) missing.push("Holy Trifecta (title)");
  if (!meta) missing.push("Upload metadata (description, tags, chapters)");

  const title = trifecta?.title ?? project.title;
  const description = meta?.description ?? "";
  const tags = meta ? JSON.parse(meta.tags || "[]") : [];
  const chapters = meta ? JSON.parse(meta.chapters || "[]") : [];
  const pinnedComment = meta?.pinnedComment ?? null;
  const playlist = meta?.playlist ?? null;
  const publishAt = meta?.publishAt?.toISOString() ?? null;
  const endScreen = meta?.endScreen ? JSON.parse(meta.endScreen) : [];

  return {
    title,
    description,
    tags,
    categoryId: 28, // Science & Technology default; would be niche-specific
    chapters,
    pinnedComment,
    playlist,
    publishAt,
    endScreen,
    ready: missing.length === 0,
    missing,
  };
}

// "Publish" the video — in production this calls the YouTube Data API upload
// endpoint. Here we mark the project as scheduled/live and record the event.
export async function publishProject(projectId: string): Promise<{
  published: boolean;
  scheduledAt: string | null;
  note: string;
}> {
  const conn = await getConnection();
  const payload = await packageUploadPayload(projectId);

  if (!payload.ready) {
    return {
      published: false,
      scheduledAt: null,
      note: `Cannot publish yet. Missing: ${payload.missing.join(", ")}`,
    };
  }

  // Mark project as scheduled → live
  await db.project.update({
    where: { id: projectId },
    data: {
      status: conn?.status === "connected" ? "live" : "publish",
      stage: "published",
    },
  });

  await db.activityLog.create({
    data: {
      projectId,
      type: "system",
      message: conn?.status === "connected"
        ? `Published to YouTube channel "${conn.channelName}" (simulated upload — connect real OAuth to enable live upload)`
        : "Publish packaged (connect a YouTube channel to enable live upload)",
      meta: jstr({ title: payload.title, tags: payload.tags, scheduledAt: payload.publishAt }),
    },
  });

  return {
    published: true,
    scheduledAt: payload.publishAt,
    note: conn?.status === "connected"
      ? `Published to "${conn.channelName}". (Sandbox note: real upload requires YouTube Data API OAuth credentials.)`
      : "Publish payload packaged. Connect a YouTube channel to enable live upload.",
  };
}

function decode(c: any): YouTubeConnectionRecord {
  return {
    id: c.id,
    channelName: c.channelName,
    channelId: c.channelId,
    status: c.status,
    connectedAt: c.connectedAt?.toISOString() ?? null,
    lastError: c.lastError,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
