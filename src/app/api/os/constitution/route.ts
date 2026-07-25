import { getConstitution, addPrinciple, updatePrinciple } from "@/lib/os/constitution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const principles = await getConstitution();
    return Response.json({ principles });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "add") {
      const principle = await addPrinciple(body);
      return Response.json({ principle });
    }
    if (body.action === "update") {
      await updatePrinciple(body.id, body.patch);
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
