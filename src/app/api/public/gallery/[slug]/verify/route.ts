import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createGalleryAccessToken } from "@/lib/gallery-token";
import { clientIp } from "@/lib/request-ip";

// Opens a gallery for whoever has its link. Private galleries have no password: the unguessable link is the key.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gallery = await prisma.gallery.findUnique({ where: { slug } });
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (gallery.expiryDate && gallery.expiryDate < new Date()) {
    return NextResponse.json({ error: "This gallery link has expired" }, { status: 410 });
  }

  const token = await createGalleryAccessToken(gallery.id, gallery.slug);

  if (gallery.visibility === "private") {
    await prisma.accessLog.create({
      data: { galleryId: gallery.id, action: "viewed", ipAddress: clientIp(req) },
    });
  }

  return NextResponse.json({ token });
}
