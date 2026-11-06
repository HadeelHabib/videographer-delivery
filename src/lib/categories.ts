export const MAX_CATEGORY_LENGTH = 30;

// Names are stored lowercase so "Wedding", "wedding " and "WEDDING" are one category.
export function normalizeCategoryName(input: string) {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}

// Letters (any language), numbers, spaces and hyphens — the name ends up in public URLs.
const ALLOWED = /^[\p{L}\p{N}][\p{L}\p{N} -]*$/u;

export function validateCategoryName(input: string, existing: string[] = []): string | undefined {
  const name = normalizeCategoryName(input);
  if (!name) return "Enter a category name.";
  if (name.length > MAX_CATEGORY_LENGTH) return `Keep it under ${MAX_CATEGORY_LENGTH} characters.`;
  if (!ALLOWED.test(name)) return "Use letters, numbers, spaces and hyphens only.";
  if (existing.some((e) => normalizeCategoryName(e) === name)) return "That category already exists.";
  return undefined;
}

export function describeDeletion(name: string, galleryCount: number) {
  if (galleryCount === 0) return `Delete “${name}”? No galleries use it.`;
  const these = galleryCount === 1 ? "1 gallery" : `${galleryCount} galleries`;
  return `Delete “${name}”? ${these} will become uncategorized — nothing else is deleted. Public galleries without a category stay off the portfolio.`;
}
