import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { mediaStorageKey } from "@/lib/r2";
import { RENDITION_QUALITIES, isPhotoQuality, qualityTargetPx } from "@/lib/constants";
import { WORKER_ENABLED } from "@/lib/processing";

async function loadOwnedMedia(id: number, photographerId: number) {
  const media = await prisma.media.findUnique({ where: { id }, include: { gallery: true } });
  if (!media || media.gallery.photographerId !== photographerId) return null;
  return media;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await params).id);
  const media = await loadOwnedMedia(id, session.photographerId);
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const renditions = await prisma.mediaRendition.findMany({
    where: { mediaId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ renditions });
}

const bodySchema = z.object({ quality: z.enum(RENDITION_QUALITIES) });

// Re-transcodes/resizes from the stored original: queues a new rendition + processing job.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!WORKER_ENABLED) {
    return NextResponse.json({ error: "Server-side conversion is turned off on this deployment" }, { status: 400 });
  }

  const id = Number((await params).id);
  const media = await loadOwnedMedia(id, session.photographerId);
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { quality } = parsed.data;

  const sourcePx = media.type === "photo" ? Math.max(media.width ?? 0, media.height ?? 0) || null : media.height;
  const target = qualityTargetPx(quality);
  if (target !== null && sourcePx !== null && target > sourcePx) {
    return NextResponse.json({ error: `${quality} exceeds this file's source resolution` }, { status: 400 });
  }

  const existing = await prisma.mediaRendition.findFirst({
    where: { mediaId: id, quality, status: { in: ["queued", "processing", "ready"] } },
  });
  if (existing) {
    return NextResponse.json({ error: `A ${quality} rendition already exists` }, { status: 409 });
  }

  const filename = isPhotoQuality(quality) ? `${quality}.jpg` : `${quality}.mp4`;
  const key = mediaStorageKey(media.galleryId, media.id, filename);
  const rendition = await prisma.mediaRendition.create({
    data: { mediaId: id, quality, storageKey: key, status: "queued" },
  });
  await prisma.processingJob.create({ data: { renditionId: rendition.id, status: "queued" } });
  await prisma.media.update({ where: { id }, data: { status: "processing" } });

  return NextResponse.json({ rendition }, { status: 201 });
}
