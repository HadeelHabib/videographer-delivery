import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyGalleryAccessToken } from "@/lib/gallery-token";
import { getUserSession } from "@/lib/user-session";
import { sendEmailSafe } from "@/lib/email";
import { isRateLimited } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";
import { getStudioProfile } from "@/lib/studio";
import { escapeHtml } from "@/lib/html";

async function requireGalleryAccess(req: NextRequest, slug: string) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  return verifyGalleryAccessToken(token, slug);
}

function authorName(c: { fromPhotographer: boolean; user: { name: string | null; email: string } | null }, studioName: string) {
  if (c.fromPhotographer) return studioName;
  return c.user?.name || c.user?.email.split("@")[0] || "A visitor";
}

// Gallery comments are instantly visible (no moderation queue) — only
// visitors who already unlocked the gallery (password or public) can read or
// post them, and only a signed-in user can post. The photographer's replies
// (fromPhotographer=true) nest one level under the comment they answer.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const access = await requireGalleryAccess(req, slug);
  if (!access) return NextResponse.json({ error: "Access token required" }, { status: 401 });

  const gallery = await prisma.gallery.findUnique({ where: { slug } });
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [comments, studio] = await Promise.all([
    prisma.galleryComment.findMany({
      where: { galleryId: gallery.id, parentId: null },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { name: true, email: true } } },
        },
      },
    }),
    getStudioProfile(),
  ]);

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      authorName: authorName(c, studio.name),
      replies: c.replies.map((r) => ({
        id: r.id,
        body: r.body,
        createdAt: r.createdAt,
        authorName: authorName(r, studio.name),
      })),
    })),
  });
}

const bodySchema = z.object({ body: z.string().min(1).max(2000) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const access = await requireGalleryAccess(req, slug);
  if (!access) return NextResponse.json({ error: "Access token required" }, { status: 401 });

  const userSession = await getUserSession();
  if (!userSession) return NextResponse.json({ error: "Sign in to leave a comment" }, { status: 401 });

  const ip = clientIp(req) ?? "unknown";
  if (isRateLimited(`gallery-comment:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many comments, please try again later" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });

  const gallery = await prisma.gallery.findUnique({
    where: { slug },
    include: { photographer: { select: { email: true } } },
  });
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: userSession.userId },
    select: { name: true, email: true, emailVerifiedAt: true },
  });
  if (!user) return NextResponse.json({ error: "Sign in to leave a comment" }, { status: 401 });
  if (!user.emailVerifiedAt) {
    return NextResponse.json({ error: "Confirm your email address to leave a comment" }, { status: 403 });
  }

  const comment = await prisma.galleryComment.create({
    data: { galleryId: gallery.id, userId: userSession.userId, body: parsed.data.body },
  });

  const name = user.name || user.email.split("@")[0] || "A visitor";
  sendEmailSafe({
    to: gallery.photographer.email,
    subject: `New comment on "${gallery.clientName}"`,
    html: `<p><strong>${escapeHtml(name)}</strong> commented on <strong>${escapeHtml(gallery.clientName)}</strong>:</p>
<blockquote>${escapeHtml(parsed.data.body)}</blockquote>
<p><a href="${process.env.APP_URL ?? ""}/admin/galleries/${gallery.id}">View in dashboard</a></p>`,
  });

  return NextResponse.json(
    { comment: { id: comment.id, body: comment.body, createdAt: comment.createdAt, authorName: name, replies: [] } },
    { status: 201 }
  );
}
