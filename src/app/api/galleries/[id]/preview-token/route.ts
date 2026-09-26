import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createGalleryAccessToken } from "@/lib/gallery-token";

// Lets the owning photographer preview a gallery from the admin dashboard
// without going through the client-facing password gate — visibility/status
// only ever control what a client or the public portfolio can see, not
// whether the admin can look at their own gallery.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await params).id);
  const gallery = await prisma.gallery.findUnique({ where: { id } });
  if (!gallery || gallery.photographerId !== session.photographerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = await createGalleryAccessToken(gallery.id, gallery.slug);
  return NextResponse.json({ token });
}
