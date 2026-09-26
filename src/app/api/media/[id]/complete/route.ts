import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { mediaStorageKey } from "@/lib/r2";
import { RENDITION_QUALITIES, isPhotoQuality, qualityTargetPx } from "@/lib/constants";

const bodySchema = z.object({
  qualities: z.array(z.enum(RENDITION_QUALITIES)).default([]),
});

async function loadOwnedMedia(id: number, photographerId: number) {
  const media = await prisma.media.findUnique({ where: { id }, include: { gallery: true } });
  if (!media || media.gallery.photographerId !== photographerId) return null;
  return media;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await params).id);
  const media = await loadOwnedMedia(id, session.photographerId);
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { qualities } = parsed.data;

  // Source resolution guard: never queue a rendition that would upscale past
  // what the uploaded file actually contains (video: height, photo: long edge).
  const sourcePx = media.type === "photo" ? Math.max(media.width ?? 0, media.height ?? 0) || null : media.height;
  const oversized = qualities.filter((q) => {
    const target = qualityTargetPx(q);
    return target !== null && sourcePx !== null && target > sourcePx;
  });
  if (oversized.length > 0) {
    return NextResponse.json(
      { error: `These qualities exceed the source resolution: ${oversized.join(", ")}` },
      { status: 400 }
    );
  }

  const ext = media.originalFilename?.includes(".") ? media.originalFilename.split(".").pop() : "bin";
  const originalKey = mediaStorageKey(media.galleryId, media.id, `original.${ext}`);

  await prisma.$transaction(async (tx) => {
    await tx.mediaRendition.create({
      data: {
        mediaId: media.id,
        quality: "original",
        storageKey: originalKey,
        fileSizeBytes: media.fileSizeBytes,
        status: "ready",
      },
    });

    for (const quality of qualities) {
      const filename = isPhotoQuality(quality) ? `${quality}.jpg` : `${quality}.mp4`;
      const key = mediaStorageKey(media.galleryId, media.id, filename);
      const rendition = await tx.mediaRendition.create({
        data: { mediaId: media.id, quality, storageKey: key, status: "queued" },
      });
      await tx.processingJob.create({ data: { renditionId: rendition.id, status: "queued" } });
    }

    await tx.media.update({
      where: { id: media.id },
      data: { status: qualities.length > 0 ? "processing" : "ready" },
    });
  });

  const updated = await prisma.media.findUnique({ where: { id }, include: { renditions: true } });
  return NextResponse.json({ media: updated });
}
