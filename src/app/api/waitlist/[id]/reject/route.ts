import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: "Admin access required" }, { status: 403 });

    const { id } = await params;
    await db.waitlistEntry.update({ where: { id }, data: { status: "rejected" } });
    await db.user.updateMany({ where: { waitlistEntry: { id } }, data: { status: "suspended" } });

    return Response.json({ ok: true, status: "rejected" });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
