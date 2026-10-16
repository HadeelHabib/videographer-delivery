import { prisma } from "@/lib/prisma";
import { coverMediaSelect, resolveCoverImage } from "@/lib/covers";
import { getStudioProfile } from "@/lib/studio";

const SERVICE_COPY: Record<string, string> = {
  wedding: "Full-day coverage cut into a film that plays back like a memory, not a highlight reel.",
  portrait: "Relaxed, directed sessions that still feel like you — solo, couples, or family.",
  event: "Corporate, private, and milestone events, covered without getting in the way.",
  commercial: "Brand and product films built around a clear story, not just pretty shots.",
  other: "Have something else in mind? Get in touch and let's talk through it.",
};

export async function getHomeData() {
  const [studio, categoryRows, featuredGalleries, testimonials] = await Promise.all([
    getStudioProfile(),
    prisma.gallery
      .groupBy({
        by: ["category"],
        where: { visibility: "public", category: { not: null } },
        _count: true,
      })
      .catch(() => []),
    prisma.gallery
      .findMany({
        where: { visibility: "public" },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          slug: true,
          clientName: true,
          category: true,
          _count: { select: { media: true } },
          media: coverMediaSelect,
        },
      })
      .catch(() => []),
    prisma.comment
      .findMany({
        where: { status: "approved" },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, visitorName: true, body: true, category: true },
      })
      .catch(() => []),
  ]);

  const services = categoryRows
    .filter((row) => row.category)
    .map((row) => ({
      name: row.category as string,
      count: row._count,
      description: SERVICE_COPY[row.category as string] ?? SERVICE_COPY.other,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const featured = await Promise.all(
    featuredGalleries.map(async (g) => ({
      slug: g.slug,
      clientName: g.clientName,
      category: g.category,
      mediaCount: g._count.media,
      coverImage: await resolveCoverImage(g.media),
    }))
  );

  return { studio, services, featured, testimonials };
}
