import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getStudioProfile } from "@/lib/studio";
import { sendEmailSafe } from "@/lib/email";
import { escapeHtml } from "@/lib/html";

const bodySchema = z.object({ body: z.string().min(1).max(2000) });

// The photographer replies to a client's top-level comment. Replies nest one
// level (a reply can't itself be replied to) and email the original
// commenter, if they have an account with an email on file.
export async function POST(
  req: NextRequest,
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

  const parent = await prisma.galleryComment.findUnique({
    where: { id: Number(commentId) },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!parent || parent.galleryId !== galleryId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (parent.parentId !== null) {
    return NextResponse.json({ error: "Can't reply to a reply" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Reply cannot be empty" }, { status: 400 });

  const [studio, reply] = await Promise.all([
    getStudioProfile(),
    prisma.galleryComment.create({
      data: { galleryId, parentId: parent.id, fromPhotographer: true, body: parsed.data.body },
    }),
  ]);

  if (parent.user?.email) {
    sendEmailSafe({
      to: parent.user.email,
      subject: `${studio.name} replied to your comment on "${gallery.clientName}"`,
      html: `<p><strong>${escapeHtml(studio.name)}</strong> replied:</p>
<blockquote>${escapeHtml(parsed.data.body)}</blockquote>
<p>Your comment: <em>${escapeHtml(parent.body)}</em></p>
<p><a href="${process.env.APP_URL ?? ""}/gallery/${gallery.slug}">View the gallery</a></p>`,
    });
  }

  return NextResponse.json(
    { reply: { id: reply.id, body: reply.body, createdAt: reply.createdAt, authorName: studio.name } },
    { status: 201 }
  );
}
