import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDownloadUrl } from "@/lib/r2";
import { coverMediaSelect } from "@/lib/covers";
import { getStudioProfile } from "@/lib/studio";

export async function GET() {
  const galleries = await prisma.gallery.findMany({
    where: { visibility: "public", category: { not: null } },
    select: { category: true, media: coverMediaSelect },
  });

  const byCategory = new Map<string, { count: number; coverKey: string | null }>();
  for (const g of galleries) {
    if (!g.category) continue;
    const entry = byCategory.get(g.category) ?? { count: 0, coverKey: null };
    entry.count += 1;
    if (!entry.coverKey) {
      entry.coverKey = g.media[0]?.renditions[0]?.storageKey ?? null;
    }
    byCategory.set(g.category, entry);
  }

  const categories = await Promise.all(
    Array.from(byCategory.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(async ([name, { count, coverKey }]) => ({
        name,
        count,
        coverImage: coverKey ? await createDownloadUrl(coverKey, 3600) : null,
      }))
  );

  return NextResponse.json({ studio: await getStudioProfile(), categories });
}
