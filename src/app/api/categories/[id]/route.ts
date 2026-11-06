import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// Deleting a category never deletes galleries: they just become uncategorized.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await params).id);
  const category = Number.isInteger(id) ? await prisma.category.findUnique({ where: { id } }) : null;
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [unassigned] = await prisma.$transaction([
    prisma.gallery.updateMany({
      where: { photographerId: session.photographerId, category: { equals: category.name, mode: "insensitive" } },
      data: { category: null },
    }),
    prisma.category.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true, unassigned: unassigned.count });
}
