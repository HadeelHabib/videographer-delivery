import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { deleteObject } from "@/lib/r2";

// Blocked if quality=original or status=processing, per spec — the original is
// only removable by deleting the whole media row, and removing mid-transcode
// would race the worker writing to the same storage key.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; renditionId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, renditionId } = await params;
  const mediaId = Number(id);
  const rendition = await prisma.mediaRendition.findUnique({
    where: { id: Number(renditionId) },
    include: { media: { include: { gallery: true } } },
  });

  if (!rendition || rendition.mediaId !== mediaId || rendition.media.gallery.photographerId !== session.photographerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (rendition.quality === "original") {
    return NextResponse.json({ error: "The original rendition cannot be removed" }, { status: 400 });
  }
  if (rendition.status === "processing") {
    return NextResponse.json({ error: "Cannot remove a rendition that is still processing" }, { status: 409 });
  }

  await deleteObject(rendition.storageKey).catch(() => {});
  await prisma.processingJob.deleteMany({ where: { renditionId: rendition.id } });
  await prisma.mediaRendition.delete({ where: { id: rendition.id } });

  return NextResponse.json({ ok: true });
}
