import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// All recent per-gallery comments (GalleryComment) across every gallery this
// photographer owns — distinct from /api/comments, which is the portfolio
// testimonial moderation queue (a different model, Comment).
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const comments = await prisma.galleryComment.findMany({
    where: { gallery: { photographerId: session.photographerId }, parentId: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { name: true, email: true } },
      gallery: { select: { id: true, clientName: true, slug: true } },
      replies: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true, email: true } } } },
    },
  });

  return NextResponse.json({ comments });
}
