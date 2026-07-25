import { DEMO_USERS, createToken, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { role } = await request.json();
    const demoUser = DEMO_USERS[role];
    if (!demoUser) return Response.json({ error: "Invalid demo role" }, { status: 400 });
    const token = await createToken(demoUser);
    await setSessionCookie(token);
    return Response.json({ user: demoUser });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
