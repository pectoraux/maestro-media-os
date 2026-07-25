import { getMarketOpportunities } from "@/lib/os/market-fit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const opportunities = await getMarketOpportunities();
    return Response.json({ opportunities });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
