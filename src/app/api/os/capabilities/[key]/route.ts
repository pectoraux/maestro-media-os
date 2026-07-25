import { getContract } from "@/lib/os/capability-contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params;
    const contract = await getContract(key);
    if (!contract) return Response.json({ error: "Capability not found" }, { status: 404 });
    return Response.json({ contract });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
