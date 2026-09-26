import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// The owning photographer can delete any comment on their gallery at any
// time — there's no moderation queue for gallery comments, just after-the-fact removal.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, commentId } = await params;
  const galleryId = Number(id);

  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery || gallery.photographerId !== session.photographerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const comment = await prisma.galleryComment.findUnique({ where: { id: Number(commentId) } });
  if (!comment || comment.galleryId !== galleryId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // No DB-level cascade on this self-relation — delete replies first so a
  // top-level comment's replies don't dangle on a deleted parentId.
  await prisma.$transaction([
    prisma.galleryComment.deleteMany({ where: { parentId: comment.id } }),
    prisma.galleryComment.delete({ where: { id: comment.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
