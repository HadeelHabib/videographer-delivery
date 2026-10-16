import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { countUnreadGalleryComments } from "@/lib/admin-overview";

export const dynamic = "force-dynamic";

// Small counts for the sidebar badges — polled, so it stays cheap.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [unreadComments, pendingTestimonials] = await Promise.all([
    countUnreadGalleryComments(session.photographerId),
    prisma.comment.count({ where: { status: "pending" } }),
  ]);

  return NextResponse.json({ comments: unreadComments + pendingTestimonials });
}
