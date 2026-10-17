import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { moveObject, deleteObject, vaultKey } from "@/lib/r2";
import { WORKER_ENABLED } from "@/lib/processing";

// Archiving keeps only the original file (moved to cold storage under a
// vault/ prefix) and drops every extra rendition (1080p/720p/480p,
// 2048px/1024px/640px, etc). Those are cheap to regenerate later from the
// original via the Renditions tab, but expensive to keep sitting around
// unused for a gallery nobody is actively viewing anymore. Without a worker
// (WORKER_ENABLED=false) nothing can regenerate them, so those are kept.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await params).id);
  const existing = await prisma.gallery.findUnique({ where: { id } });
  if (!existing || existing.photographerId !== session.photographerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const renditions = await prisma.mediaRendition.findMany({
    where: { media: { galleryId: id }, status: "ready" },
  });

  for (const rendition of renditions) {
    if (rendition.quality === "original") {
      const destKey = vaultKey(rendition.storageKey);
      try {
        await moveObject(rendition.storageKey, destKey);
        await prisma.mediaRendition.update({ where: { id: rendition.id }, data: { storageKey: destKey } });
      } catch (err) {
        console.error(`Vault move failed for rendition ${rendition.id}`, err);
      }
    } else if (WORKER_ENABLED) {
      try {
        await deleteObject(rendition.storageKey);
        await prisma.$transaction([
          prisma.processingJob.deleteMany({ where: { renditionId: rendition.id } }),
          prisma.mediaRendition.delete({ where: { id: rendition.id } }),
        ]);
      } catch (err) {
        console.error(`Failed to drop extra rendition ${rendition.id} on archive`, err);
      }
    }
  }

  const gallery = await prisma.gallery.update({
    where: { id },
    data: { status: "archived", archivedAt: new Date() },
  });

  return NextResponse.json({ gallery });
}
