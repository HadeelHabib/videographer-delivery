import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { moveObject, unvaultKey } from "@/lib/r2";

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

  const gallery = await prisma.gallery.update({
    where: { id },
    data: { status: "delivered", archivedAt: null },
  });

  return NextResponse.json({ gallery });
}
