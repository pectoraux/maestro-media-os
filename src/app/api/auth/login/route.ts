import { db } from "@/lib/db";
import { verifyPassword, createToken, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return Response.json({ error: "Email and password required" }, { status: 400 });

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return Response.json({ error: "Invalid credentials" }, { status: 401 });

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return Response.json({ error: "Invalid credentials" }, { status: 401 });

    if (user.status === "suspended") return Response.json({ error: "Account suspended" }, { status: 403 });

    const token = await createToken({
      id: user.id, email: user.email, name: user.name, role: user.role, status: user.status, organizationId: user.organizationId,
    });
    await setSessionCookie(token);

    return Response.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status, organizationId: user.organizationId } });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
