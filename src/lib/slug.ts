import { prisma } from "@/lib/prisma";

function baseSlug(clientName: string) {
  const slug = clientName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const year = new Date().getFullYear();
  return `${slug || "gallery"}-${year}`;
}

export async function generateUniqueSlug(clientName: string) {
  const base = baseSlug(clientName);
  let candidate = base;
  let suffix = 1;
  while (await prisma.gallery.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}
