import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createGalleryAccessToken } from "@/lib/gallery-token";
import { clientIp } from "@/lib/request-ip";

const bodySchema = z.object({ password: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gallery = await prisma.gallery.findUnique({ where: { slug } });
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (gallery.expiryDate && gallery.expiryDate < new Date()) {
    return NextResponse.json({ error: "This gallery link has expired" }, { status: 410 });
  }

  if (gallery.visibility === "public") {
    const token = await createGalleryAccessToken(gallery.id, gallery.slug);
    return NextResponse.json({ token });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Password required" }, { status: 400 });

  if (!gallery.passwordHash || !(await verifyPassword(parsed.data.password, gallery.passwordHash))) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await createGalleryAccessToken(gallery.id, gallery.slug);

  await prisma.accessLog.create({
    data: { galleryId: gallery.id, action: "viewed", ipAddress: clientIp(req) },
  });

  return NextResponse.json({ token });
}
