import { db } from "@/lib/db";
import { hashPassword, computeReadinessScore, createToken, setSessionCookie } from "@/lib/auth";
import { jstr } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;
    if (!email || !password) return Response.json({ error: "Email and password required" }, { status: 400 });

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return Response.json({ error: "Email already registered" }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: { email, passwordHash, name: name || null, role: "creator", status: "waitlisted" },
    });

    // Compute position
    const position = await db.waitlistEntry.count() + 1;
    const { score, breakdown } = computeReadinessScore({
      skills: [], goals: [], targetPlatforms: [], interests: [], preferredFormats: [], availableHours: 10,
    });

    await db.waitlistEntry.create({
      data: { userId: user.id, email, name: name || null, readinessScore: score, readinessBreakdown: jstr(breakdown), position },
    });

    const token = await createToken({ id: user.id, email, name: name || null, role: "creator", status: "waitlisted", organizationId: null });
    await setSessionCookie(token);

    return Response.json({ user: { id: user.id, email, name, role: "creator", status: "waitlisted" }, position });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
