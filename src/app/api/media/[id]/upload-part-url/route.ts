import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { mediaStorageKey, presignUploadPart } from "@/lib/r2";

const bodySchema = z.object({
  uploadId: z.string().min(1),
  partNumber: z.number().int().min(1).max(10000),
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

  const ext = media.originalFilename?.includes(".") ? media.originalFilename.split(".").pop() : "bin";
  const storageKey = mediaStorageKey(media.galleryId, media.id, `original.${ext}`);

  const url = await presignUploadPart(storageKey, parsed.data.uploadId, parsed.data.partNumber);
  return NextResponse.json({ url });
}
