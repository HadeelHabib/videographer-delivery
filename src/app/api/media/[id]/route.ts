import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { deleteObject } from "@/lib/r2";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await params).id);
  const media = await prisma.media.findUnique({
    where: { id },
    include: { gallery: true, renditions: true },
  });
  if (!media || media.gallery.photographerId !== session.photographerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await Promise.allSettled(media.renditions.map((r) => deleteObject(r.storageKey)));

  await prisma.$transaction([
    prisma.processingJob.deleteMany({ where: { renditionId: { in: media.renditions.map((r) => r.id) } } }),
    prisma.mediaRendition.deleteMany({ where: { mediaId: id } }),
    prisma.media.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
