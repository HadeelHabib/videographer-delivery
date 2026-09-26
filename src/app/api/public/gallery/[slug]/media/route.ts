import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyGalleryAccessToken } from "@/lib/gallery-token";
import { createDownloadUrl } from "@/lib/r2";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Access token required" }, { status: 401 });

  const access = await verifyGalleryAccessToken(token, slug);
  if (!access) return NextResponse.json({ error: "Invalid or expired access token" }, { status: 401 });

  const gallery = await prisma.gallery.findUnique({ where: { slug } });
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (gallery.expiryDate && gallery.expiryDate < new Date()) {
    return NextResponse.json({ error: "This gallery link has expired" }, { status: 410 });
  }

  const media = await prisma.media.findMany({
    where: { galleryId: gallery.id, status: { in: ["ready", "processing"] } },
    include: { renditions: { where: { status: "ready" } } },
    orderBy: { createdAt: "asc" },
  });

  const withUrls = await Promise.all(
    media.map(async (item) => ({
      id: item.id,
      type: item.type,
      originalFilename: item.originalFilename,
      durationSeconds: item.durationSeconds,
      status: item.status,
      renditions: await Promise.all(
        item.renditions.map(async (r) => ({
          id: r.id,
          quality: r.quality,
          url: await createDownloadUrl(r.storageKey, 3600, item.originalFilename ?? undefined),
        }))
      ),
    }))
  );

  return NextResponse.json({
    gallery: {
      clientName: gallery.clientName,
      brandLogoUrl: gallery.brandLogoUrl,
      brandColor: gallery.brandColor,
      allowPublicDownload: gallery.allowPublicDownload,
    },
    media: withUrls,
  });
}
