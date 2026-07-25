import { generateForecast, getForecasts } from "@/lib/os/forecasting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const forecasts = await getForecasts();
    return Response.json({ forecasts });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const forecasts = await generateForecast({
      videosPerWeek: body.videosPerWeek ?? 2,
      qualityLevel: body.qualityLevel ?? 83,
      retention: body.retention ?? 47,
      targetAudience: body.targetAudience ?? "Senior engineers",
      horizonMonths: body.horizonMonths,
    });
    return Response.json({ forecasts });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
