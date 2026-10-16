import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { deleteObject } from "@/lib/r2";
import { notifySubscribersOfNewPublicGallery } from "@/lib/notify";
import { buildCommentTree } from "@/lib/comment-tree";

async function loadOwnedGallery(id: number, photographerId: number) {
  const gallery = await prisma.gallery.findUnique({ where: { id } });
  if (!gallery || gallery.photographerId !== photographerId) return null;
  return gallery;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await params).id);
  const gallery = await prisma.gallery.findUnique({
    where: { id },
    include: {
      media: { include: { renditions: true }, orderBy: { createdAt: "asc" } },
      accessLogs: { orderBy: { accessedAt: "desc" } },
      galleryComments: { include: { user: { select: { name: true, email: true } } } },
    },
  });
  if (!gallery || gallery.photographerId !== session.photographerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Opening a gallery's detail page is how the photographer "reads" its
  // comments — marks them seen so the dashboard's new-comment badge clears.
  prisma.gallery
    .update({ where: { id }, data: { commentsViewedAt: new Date() } })
    .catch((err) => console.error("[comments] failed to mark viewed:", err));

  return NextResponse.json({ gallery: { ...gallery, galleryComments: buildCommentTree(gallery.galleryComments) } });
}

const patchSchema = z.object({
  clientName: z.string().min(1).optional(),
  password: z.string().min(4, "Password must be at least 4 characters").optional(),
  visibility: z.enum(["private", "public"]).optional(),
  category: z.string().nullable().optional(),
  brandLogoUrl: z.string().url().optional().or(z.literal("")),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  expiryDate: z.string().nullable().optional(),
  allowPublicDownload: z.boolean().optional(),
  status: z.enum(["draft", "ready"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await params).id);
  const existing = await loadOwnedGallery(id, session.photographerId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const gallery = await prisma.gallery.update({
    where: { id },
    data: {
      ...(data.clientName !== undefined ? { clientName: data.clientName } : {}),
      ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
      ...(data.visibility !== undefined ? { visibility: data.visibility } : {}),
      ...(data.category !== undefined ? { category: data.category || null } : {}),
      ...(data.brandLogoUrl !== undefined ? { brandLogoUrl: data.brandLogoUrl || null } : {}),
      ...(data.brandColor !== undefined ? { brandColor: data.brandColor } : {}),
      ...(data.expiryDate !== undefined ? { expiryDate: data.expiryDate ? new Date(data.expiryDate) : null } : {}),
      ...(data.allowPublicDownload !== undefined ? { allowPublicDownload: data.allowPublicDownload } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
  });

  // Switched to public after it was already delivered (and never announced) — tell subscribers.
  // Deliver does the same when a public gallery is delivered; private ones stay quiet.
  if (gallery.visibility === "public" && gallery.status === "delivered" && existing.visibility !== "public" && !gallery.publicNotifiedAt) {
    notifySubscribersOfNewPublicGallery(gallery).catch((err) => console.error("[notify] failed:", err));
  }

  return NextResponse.json({ gallery });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await params).id);
  const existing = await loadOwnedGallery(id, session.photographerId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const media = await prisma.media.findMany({
    where: { galleryId: id },
    select: { id: true, renditions: { select: { storageKey: true } } },
  });
  const mediaIds = media.map((m) => m.id);
  const storageKeys = media.flatMap((m) => m.renditions.map((r) => r.storageKey));

  await Promise.allSettled(storageKeys.map((key) => deleteObject(key)));

  await prisma.$transaction([
    prisma.processingJob.deleteMany({ where: { rendition: { mediaId: { in: mediaIds } } } }),
    prisma.mediaRendition.deleteMany({ where: { mediaId: { in: mediaIds } } }),
    prisma.media.deleteMany({ where: { galleryId: id } }),
    prisma.accessLog.deleteMany({ where: { galleryId: id } }),
    prisma.gallery.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
