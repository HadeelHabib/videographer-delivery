import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { mediaStorageKey, putObject } from "@/lib/r2";
import { WORKER_ENABLED } from "@/lib/processing";
import { PREVIEW_MAX_BYTES, PREVIEW_QUALITY, isJpeg } from "@/lib/image-preview";

// Receives the 2048px JPEG preview the admin's browser made for a photo. Only used when
// there is no conversion worker (NEXT_PUBLIC_PROCESSING="none"); otherwise the worker makes it.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (WORKER_ENABLED) {
    return NextResponse.json({ error: "Previews are made by the worker on this deployment" }, { status: 400 });
  }

  const id = Number((await params).id);
  const media = await prisma.media.findUnique({ where: { id }, include: { gallery: true } });
  if (!media || media.gallery.photographerId !== session.photographerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (media.type !== "photo") {
    return NextResponse.json({ error: "Only photos have a preview image" }, { status: 400 });
  }

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > PREVIEW_MAX_BYTES) {
    return NextResponse.json({ error: "Preview image is too large" }, { status: 413 });
  }
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.length === 0 || bytes.length > PREVIEW_MAX_BYTES) {
    return NextResponse.json({ error: "Preview image is empty or too large" }, { status: 413 });
  }
  if (!isJpeg(bytes)) {
    return NextResponse.json({ error: "Preview must be a JPEG" }, { status: 400 });
  }

  const key = mediaStorageKey(media.galleryId, media.id, `${PREVIEW_QUALITY}.jpg`);
  await putObject(key, Buffer.from(bytes), "image/jpeg");

  const existing = await prisma.mediaRendition.findFirst({ where: { mediaId: id, quality: PREVIEW_QUALITY } });
  const data = { storageKey: key, fileSizeBytes: BigInt(bytes.length), status: "ready" };
  const rendition = existing
    ? await prisma.mediaRendition.update({ where: { id: existing.id }, data })
    : await prisma.mediaRendition.create({ data: { mediaId: id, quality: PREVIEW_QUALITY, ...data } });

  return NextResponse.json({ rendition }, { status: 201 });
}
