import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { collectDescendantIds } from "@/lib/comment-tree";

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

  // No DB-level cascade on this self-relation — delete the whole subtree, deepest
  // replies first, so nothing dangles on a deleted parentId.
  const thread = await prisma.galleryComment.findMany({ where: { galleryId }, select: { id: true, parentId: true } });
  const doomed = [...collectDescendantIds(comment.id, thread).reverse(), comment.id];
  await prisma.$transaction(doomed.map((id) => prisma.galleryComment.delete({ where: { id } })));

  return NextResponse.json({ ok: true });
}
