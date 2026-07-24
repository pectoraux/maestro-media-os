// /api/thumbnails/[id]/generate
// POST → load the ThumbnailBrief by id, take the first aiPrompt, generate the image,
// update the brief row with the generated data URL + status.

import { db } from "@/lib/db";
import { jparseArr } from "@/lib/json";
import { generateImage } from "@/lib/zai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const brief = await db.thumbnailBrief.findUnique({ where: { id } });
    if (!brief) {
      return Response.json({ error: "Thumbnail brief not found" }, { status: 404 });
    }

    const prompts = jparseArr<{ variant: string; prompt: string; size: string; styleNotes: string }>(
      brief.aiPrompts,
    );
    if (prompts.length === 0) {
      return Response.json({ error: "Brief has no AI generation prompts" }, { status: 400 });
    }

    const first = prompts[0];
    const size = (first.size === "1792x1024" || first.size === "1024x1792" || first.size === "1024x1024"
      ? first.size
      : "1792x1024") as "1024x1024" | "1024x1792" | "1792x1024";

    await db.thumbnailBrief.update({
      where: { id },
      data: { status: "generating" },
    });

    const imageUrl = await generateImage(first.prompt, size);

    if (!imageUrl) {
      await db.thumbnailBrief.update({
        where: { id },
        data: { status: "failed" },
      });
      return Response.json(
        { error: "Image generation failed — no image returned by the model" },
        { status: 500 },
      );
    }

    const updated = await db.thumbnailBrief.update({
      where: { id },
      data: {
        generatedImageUrl: imageUrl,
        status: "generated",
      },
    });

    return Response.json({
      brief: {
        id: updated.id,
        projectId: updated.projectId,
        concept: updated.concept,
        status: updated.status,
        generatedImageUrl: updated.generatedImageUrl,
      },
      imageUrl,
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
