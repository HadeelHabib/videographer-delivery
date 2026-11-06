import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { normalizeCategoryName, validateCategoryName } from "@/lib/categories";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [categories, usage] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.gallery.groupBy({ by: ["category"], where: { photographerId: session.photographerId, category: { not: null } }, _count: { _all: true } }),
  ]);

  // Galleries store the category as free text, so match on the normalized name.
  const counts = new Map<string, number>();
  for (const row of usage) {
    if (!row.category) continue;
    const key = normalizeCategoryName(row.category);
    counts.set(key, (counts.get(key) ?? 0) + row._count._all);
  }

  return NextResponse.json({
    categories: categories.map((c) => ({ id: c.id, name: c.name, galleryCount: counts.get(c.name) ?? 0 })),
  });
}

const bodySchema = z.object({ name: z.string() });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a category name." }, { status: 400 });

  const existing = (await prisma.category.findMany({ select: { name: true } })).map((c) => c.name);
  const problem = validateCategoryName(parsed.data.name, existing);
  if (problem) return NextResponse.json({ error: problem }, { status: problem.includes("already exists") ? 409 : 400 });

  const category = await prisma.category.create({ data: { name: normalizeCategoryName(parsed.data.name) } });
  return NextResponse.json({ category: { id: category.id, name: category.name, galleryCount: 0 } }, { status: 201 });
}
