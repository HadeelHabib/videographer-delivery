import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { generateUniqueSlug } from "@/lib/slug";
import { GALLERY_STATUSES } from "@/lib/constants";
import { notifySubscribersOfNewPublicGallery } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const where = {
    photographerId: session.photographerId,
    ...(status && GALLERY_STATUSES.includes(status as (typeof GALLERY_STATUSES)[number])
      ? { status }
      : {}),
  };

  const rows = await prisma.gallery.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { media: true } },
      media: { select: { renditions: { where: { status: { in: ["queued", "processing"] } }, select: { id: true } } } },
      galleryComments: { where: { fromPhotographer: false }, select: { createdAt: true } },
    },
  });

  const galleries = rows.map(({ media, galleryComments, ...gallery }) => ({
    ...gallery,
    pendingRenditions: media.reduce((sum, m) => sum + m.renditions.length, 0),
    newComments: galleryComments.filter((c) => !gallery.commentsViewedAt || c.createdAt > gallery.commentsViewedAt)
      .length,
  }));

  return NextResponse.json({ galleries });
}

const createSchema = z.object({
  clientName: z.string().min(1),
  password: z.string().min(4, "Password must be at least 4 characters").optional(),
  visibility: z.enum(["private", "public"]).default("private"),
  category: z.string().optional(),
  brandLogoUrl: z.string().url().optional().or(z.literal("")),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  expiryDate: z.string().optional(),
  allowPublicDownload: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (data.visibility === "private" && !data.password) {
    return NextResponse.json({ error: "Password is required for private galleries" }, { status: 400 });
  }

  const photographer = await prisma.photographer.findUnique({ where: { id: session.photographerId } });
  const slug = await generateUniqueSlug(data.clientName);

  const gallery = await prisma.gallery.create({
    data: {
      photographerId: session.photographerId,
      clientName: data.clientName,
      slug,
      passwordHash: data.password ? await hashPassword(data.password) : null,
      visibility: data.visibility,
      category: data.category,
      brandLogoUrl: data.brandLogoUrl || photographer?.defaultLogoUrl || null,
      brandColor: data.brandColor || photographer?.defaultBrandColor || null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      allowPublicDownload: data.allowPublicDownload ?? false,
    },
  });

  if (gallery.visibility === "public") {
    notifySubscribersOfNewPublicGallery(gallery).catch((err) => console.error("[notify] failed:", err));
  }

  return NextResponse.json({ gallery }, { status: 201 });
}
