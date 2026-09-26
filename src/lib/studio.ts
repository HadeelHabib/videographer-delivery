import { prisma } from "@/lib/prisma";

// Single-tenant app: there's exactly one photographer row, and the public
// site (landing page + portfolio) borrows their saved profile (Settings page)
// rather than per-gallery branding, since it's the studio's own identity.
export async function getStudioProfile() {
  const photographer = await prisma.photographer.findFirst({
    select: { name: true, email: true, tagline: true, bio: true, defaultLogoUrl: true, defaultBrandColor: true },
  });

  return {
    name: photographer?.name || "Studio",
    email: photographer?.email ?? null,
    tagline: photographer?.tagline || null,
    bio: photographer?.bio || null,
    logoUrl: photographer?.defaultLogoUrl ?? null,
    brandColor: photographer?.defaultBrandColor || "#18181b",
  };
}
