import { db } from "@/lib/db";
import { getCurrentUser, isAdmin, computeReadinessScore } from "@/lib/auth";
import { jstr, jparseArr, jparseObj } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: list waitlist (admin) or get own entry (creator)
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    if (isAdmin(user.role)) {
      const entries = await db.waitlistEntry.findMany({ orderBy: { position: "asc" } });
      return Response.json({ entries: entries.map(decode) });
    }

    // Creator gets their own entry
    const entry = await db.waitlistEntry.findUnique({ where: { userId: user.id } });
    return Response.json({ entry: entry ? decode(entry) : null });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

// PUT: update waitlist profile (progressive profiling)
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const entry = await db.waitlistEntry.findUnique({ where: { userId: user.id } });
    if (!entry) return Response.json({ error: "No waitlist entry found" }, { status: 404 });

    const skills = body.skills ?? jparseArr(entry.skills);
    const goals = body.goals ?? jparseArr(entry.goals);
    const targetPlatforms = body.targetPlatforms ?? jparseArr(entry.targetPlatforms);
    const interests = body.interests ?? jparseArr(entry.interests);
    const preferredFormats = body.preferredFormats ?? jparseArr(entry.preferredFormats);

    const { score, breakdown } = computeReadinessScore({
      skills, experience: body.experience ?? entry.experience ?? undefined,
      goals, targetPlatforms, interests,
      existingAudience: body.existingAudience ?? entry.existingAudience ?? undefined,
      youtubeChannel: body.youtubeChannel ?? entry.youtubeChannel ?? undefined,
      xAccount: body.xAccount ?? entry.xAccount ?? undefined,
      linkedinUrl: body.linkedinUrl ?? entry.linkedinUrl ?? undefined,
      preferredFormats, monetizationGoals: body.monetizationGoals ?? entry.monetizationGoals ?? undefined,
      availableHours: body.availableHours ?? entry.availableHours ?? 10,
      personality: body.personality ?? entry.personality ?? undefined,
    });

    const updated = await db.waitlistEntry.update({
      where: { userId: user.id },
      data: {
        name: body.name, country: body.country, occupation: body.occupation,
        skills: jstr(skills), experience: body.experience, goals: jstr(goals),
        targetPlatforms: jstr(targetPlatforms), interests: jstr(interests),
        existingAudience: body.existingAudience, youtubeChannel: body.youtubeChannel,
        xAccount: body.xAccount, linkedinUrl: body.linkedinUrl,
        preferredFormats: jstr(preferredFormats), monetizationGoals: body.monetizationGoals,
        availableHours: body.availableHours, personality: body.personality,
        readinessScore: score, readinessBreakdown: jstr(breakdown),
      },
    });

    return Response.json({ entry: decode(updated) });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

function decode(r: any) {
  return {
    id: r.id, userId: r.userId, email: r.email, name: r.name, country: r.country, occupation: r.occupation,
    skills: jparseArr(r.skills), experience: r.experience, goals: jparseArr(r.goals),
    targetPlatforms: jparseArr(r.targetPlatforms), interests: jparseArr(r.interests),
    referralSource: r.referralSource, existingAudience: r.existingAudience,
    youtubeChannel: r.youtubeChannel, xAccount: r.xAccount, linkedinUrl: r.linkedinUrl,
    preferredFormats: jparseArr(r.preferredFormats), monetizationGoals: r.monetizationGoals,
    availableHours: r.availableHours, personality: r.personality,
    readinessScore: r.readinessScore, readinessBreakdown: jparseObj(r.readinessBreakdown),
    position: r.position, status: r.status, approvedAt: r.approvedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}
