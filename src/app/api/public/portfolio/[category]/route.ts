import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { coverMediaSelect, resolveCoverImage } from "@/lib/covers";
import { getStudioProfile } from "@/lib/studio";
import { SHOWCASED_GALLERY } from "@/lib/showcase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;

  const galleries = await prisma.gallery.findMany({
    where: { ...SHOWCASED_GALLERY, category },
    select: {
      slug: true,
      clientName: true,
      brandColor: true,
      brandLogoUrl: true,
      createdAt: true,
      _count: { select: { media: true } },
      media: coverMediaSelect,
    },
    orderBy: { createdAt: "desc" },
  });

  const withCovers = await Promise.all(
    galleries.map(async (g) => ({
      slug: g.slug,
      clientName: g.clientName,
      brandColor: g.brandColor,
      brandLogoUrl: g.brandLogoUrl,
      mediaCount: g._count.media,
      coverImage: await resolveCoverImage(g.media),
    }))
  );

  const comments = await prisma.comment.findMany({
    where: { category, status: "approved" },
    orderBy: { createdAt: "desc" },
    select: { id: true, visitorName: true, body: true, createdAt: true },
  });

  return NextResponse.json({ studio: await getStudioProfile(), category, galleries: withCovers, comments });
}
