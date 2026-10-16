import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildCommentTree } from "@/lib/comment-tree";

// All recent per-gallery comments (GalleryComment) across every gallery this
// photographer owns — distinct from /api/comments, which is the portfolio
// testimonial moderation queue (a different model, Comment).
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const include = { user: { select: { name: true, email: true } }, gallery: { select: { id: true, clientName: true, slug: true } } };
  const roots = await prisma.galleryComment.findMany({
    where: { gallery: { photographerId: session.photographerId }, parentId: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    include,
  });
  const replies = roots.length
    ? await prisma.galleryComment.findMany({
        where: { galleryId: { in: [...new Set(roots.map((r) => r.galleryId))] }, parentId: { not: null } },
        include,
      })
    : [];

  return NextResponse.json({ comments: buildCommentTree([...roots, ...replies]) });
}
