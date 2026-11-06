import { prisma } from "@/lib/prisma";
import { normalizeCategoryName } from "@/lib/categories";

// Turns what the client sent into what gets stored: null for "no category", the normalized name
// when it's one of the studio's categories, or an error when it isn't.
export async function resolveGalleryCategory(
  input: string | null | undefined,
): Promise<{ ok: true; value: string | null } | { ok: false; error: string }> {
  const name = input ? normalizeCategoryName(input) : "";
  if (!name) return { ok: true, value: null };

  const known = await prisma.category.findUnique({ where: { name } });
  if (!known) return { ok: false, error: `“${name}” isn't one of your categories. Add it under Manage categories first.` };
  return { ok: true, value: known.name };
}
