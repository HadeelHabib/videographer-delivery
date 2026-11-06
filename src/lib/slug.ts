import { randomBytes } from "node:crypto";
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

// A private gallery has no password: the link itself is the key. So its slug carries a random part
// and can't be guessed from the client's name ("smith-wedding-2026" would be).
export function unguessableSuffix() {
  return randomBytes(7).toString("hex");
}

export async function generateUniqueSlug(clientName: string, opts: { unguessable?: boolean } = {}) {
  const base = opts.unguessable ? `${baseSlug(clientName)}-${unguessableSuffix()}` : baseSlug(clientName);
  let candidate = base;
  let suffix = 1;
  while (await prisma.gallery.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}
