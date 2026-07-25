import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: "Admin access required" }, { status: 403 });

    const { id } = await params;
    const entry = await db.waitlistEntry.findUnique({ where: { id } });
    if (!entry) return Response.json({ error: "Entry not found" }, { status: 404 });

    await db.waitlistEntry.update({ where: { id }, data: { status: "approved", approvedAt: new Date() } });
    await db.user.update({ where: { id: entry.userId }, data: { status: "active" } });

    return Response.json({ ok: true, status: "approved" });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
