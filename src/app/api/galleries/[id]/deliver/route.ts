import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notifySubscribersOfNewPublicGallery } from "@/lib/notify";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await params).id);
  const existing = await prisma.gallery.findUnique({ where: { id } });
  if (!existing || existing.photographerId !== session.photographerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gallery = await prisma.gallery.update({
    where: { id },
    data: { status: "delivered", deliveredAt: new Date() },
  });

  if (gallery.visibility === "public" && !gallery.publicNotifiedAt) {
    notifySubscribersOfNewPublicGallery(gallery).catch((err) => console.error("[notify] failed:", err));
  }

  return NextResponse.json({ gallery });
}
