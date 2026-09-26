import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyGalleryAccessToken } from "@/lib/gallery-token";
import { clientIp } from "@/lib/request-ip";

const bodySchema = z.object({
  mediaId: z.number().int().positive(),
  action: z.enum(["viewed", "downloaded"]),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Access token required" }, { status: 401 });

  const access = await verifyGalleryAccessToken(token, slug);
  if (!access) return NextResponse.json({ error: "Invalid or expired access token" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.accessLog.create({
    data: { galleryId: access.galleryId, action: parsed.data.action, ipAddress: clientIp(req) },
  });

  return NextResponse.json({ ok: true });
}
