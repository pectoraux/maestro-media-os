import { db } from "@/lib/db";
import { jparseObj, jparseArr, jstr } from "@/lib/json";
import type { CreatorProfileRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await db.creatorProfile.findFirst();
    if (!profile) {
      return Response.json({ profile: null });
    }
    return Response.json({ profile: decode(profile) });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const existing = await db.creatorProfile.findFirst();

    // Merge: accept partial fields; preserve existing on omitted
    const curVoice = existing ? jparseObj<any>(existing.voiceProfile) : {};
    const curStyle = existing ? jparseArr<any>(existing.styleGuidelines) : [];
    const curExp = existing ? jparseArr<any>(existing.expertise) : [];
    const curThemes = existing ? jparseArr<any>(existing.recurringThemes) : [];
    const curTones = existing ? jparseArr<any>(existing.toneSamples) : [];

    const voiceProfile = body.voiceProfile ?? curVoice;
    const styleGuidelines = body.styleGuidelines ?? curStyle;
    const expertise = body.expertise ?? curExp;
    const recurringThemes = body.recurringThemes ?? curThemes;
    const toneSamples = body.toneSamples ?? curTones;
    const distinctivenessScore = typeof body.distinctivenessScore === "number" ? body.distinctivenessScore : existing?.distinctivenessScore ?? 0;

    const profile = existing
      ? await db.creatorProfile.update({
          where: { id: existing.id },
          data: {
            voiceProfile: jstr(voiceProfile),
            styleGuidelines: jstr(styleGuidelines),
            expertise: jstr(expertise),
            recurringThemes: jstr(recurringThemes),
            toneSamples: jstr(toneSamples),
            distinctivenessScore,
          },
        })
      : await db.creatorProfile.create({
          data: {
            voiceProfile: jstr(voiceProfile),
            styleGuidelines: jstr(styleGuidelines),
            expertise: jstr(expertise),
            recurringThemes: jstr(recurringThemes),
            toneSamples: jstr(toneSamples),
            distinctivenessScore,
          },
        });

    return Response.json({ profile: decode(profile) });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

function decode(p: any): CreatorProfileRecord {
  return {
    id: p.id,
    voiceProfile: jparseObj(p.voiceProfile),
    styleGuidelines: jparseArr(p.styleGuidelines),
    expertise: jparseArr(p.expertise),
    recurringThemes: jparseArr(p.recurringThemes),
    toneSamples: jparseArr(p.toneSamples),
    distinctivenessScore: p.distinctivenessScore,
  };
}
