import { getPolicies, createPolicy, updatePolicy } from "@/lib/os/policies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const policies = await getPolicies();
    return Response.json({ policies });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "create") {
      const policy = await createPolicy(body);
      return Response.json({ policy });
    }
    if (body.action === "update") {
      await updatePolicy(body.id, body.patch);
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
