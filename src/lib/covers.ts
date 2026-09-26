import { createDownloadUrl } from "@/lib/r2";

// Shared by every public route that shows a gallery's cover art (portfolio
// list, category grid, landing page): the cover is always the first ready
// photo's original file, since photos never need a lower-quality rendition.
export const coverMediaSelect = {
  where: { type: "photo", status: "ready" as const },
  take: 1,
  orderBy: { createdAt: "asc" as const },
  select: { renditions: { where: { quality: "original" }, take: 1, select: { storageKey: true } } },
};

type CoverMedia = { renditions: { storageKey: string }[] }[];

export async function resolveCoverImage(media: CoverMedia) {
  const key = media[0]?.renditions[0]?.storageKey;
  return key ? createDownloadUrl(key, 3600) : null;
}
