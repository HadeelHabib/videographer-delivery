import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { mediaStorageKey, moveObject, unvaultKey } from "@/lib/r2";
import { defaultQualityFor, isPhotoQuality } from "@/lib/constants";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await params).id);
  const existing = await prisma.gallery.findUnique({ where: { id } });
  if (!existing || existing.photographerId !== session.photographerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const renditions = await prisma.mediaRendition.findMany({
    where: { media: { galleryId: id }, storageKey: { startsWith: "vault/" } },
  });

  for (const rendition of renditions) {
    const destKey = unvaultKey(rendition.storageKey);
    try {
      await moveObject(rendition.storageKey, destKey);
      await prisma.mediaRendition.update({ where: { id: rendition.id }, data: { storageKey: destKey } });
    } catch (err) {
      console.error(`Vault restore failed for rendition ${rendition.id}`, err);
    }
  }

  // Archiving deleted every rendition except the original, so queue the default
  // one again for each file — otherwise the restored gallery has nothing to stream.
  const restoredMedia = await prisma.media.findMany({
    where: { galleryId: id },
    include: { renditions: true },
  });
  let requeued = 0;
  for (const media of restoredMedia) {
    const original = media.renditions.find((r) => r.quality === "original");
    if (!original || original.storageKey.startsWith("vault/")) continue;
    if (media.renditions.some((r) => r.quality !== "original" && ["queued", "processing", "ready"].includes(r.status))) continue;

    const sourcePx = media.type === "photo" ? Math.max(media.width ?? 0, media.height ?? 0) || null : media.height;
    const quality = defaultQualityFor(media.type, sourcePx);
    if (!quality) continue;

    const filename = isPhotoQuality(quality) ? `${quality}.jpg` : `${quality}.mp4`;
    const rendition = await prisma.mediaRendition.create({
      data: { mediaId: media.id, quality, storageKey: mediaStorageKey(media.galleryId, media.id, filename), status: "queued" },
    });
    await prisma.processingJob.create({ data: { renditionId: rendition.id, status: "queued" } });
    await prisma.media.update({ where: { id: media.id }, data: { status: "processing" } });
    requeued += 1;
  }

  const gallery = await prisma.gallery.update({
    where: { id },
    data: { status: "delivered", archivedAt: null },
  });

  return NextResponse.json({ gallery, requeuedRenditions: requeued });
}
