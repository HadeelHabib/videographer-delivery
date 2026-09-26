import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStudioProfile } from "@/lib/studio";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gallery = await prisma.gallery.findUnique({ where: { slug } });

  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (gallery.expiryDate && gallery.expiryDate < new Date()) {
    return NextResponse.json({ error: "This gallery link has expired" }, { status: 410 });
  }

  const studio = await getStudioProfile();

  return NextResponse.json({
    gallery: {
      clientName: gallery.clientName,
      slug: gallery.slug,
      brandLogoUrl: gallery.brandLogoUrl,
      brandColor: gallery.brandColor,
      requiresPassword: gallery.visibility === "private",
      visibility: gallery.visibility,
      studioName: studio.name,
    },
  });
}
