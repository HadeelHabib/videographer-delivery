import { describe, expect, it } from "vitest";
import { describeDeletion, normalizeCategoryName, validateCategoryName } from "@/lib/categories";

describe("normalizeCategoryName", () => {
  it("trims, collapses spaces and lowercases", () => {
    expect(normalizeCategoryName("  Music   Video ")).toBe("music video");
    expect(normalizeCategoryName("WEDDING")).toBe("wedding");
  });
});

describe("validateCategoryName", () => {
  it("accepts ordinary names, hyphens and non-latin letters", () => {
    expect(validateCategoryName("Music video")).toBeUndefined();
    expect(validateCategoryName("pre-wedding")).toBeUndefined();
    expect(validateCategoryName("أعراس")).toBeUndefined();
    expect(validateCategoryName("4k reels")).toBeUndefined();
  });

  it("explains what's wrong", () => {
    expect(validateCategoryName("   ")).toMatch(/enter a category name/i);
    expect(validateCategoryName("x".repeat(31))).toMatch(/under 30/);
    for (const bad of ["a/b", "a?b", "<b>", "wed_ding", "-lead", "a&b"]) {
      expect(validateCategoryName(bad)).toMatch(/letters, numbers/i);
    }
  });

  it("rejects duplicates regardless of case and spacing", () => {
    expect(validateCategoryName("Wedding ", ["wedding", "event"])).toMatch(/already exists/);
    expect(validateCategoryName("music  video", ["Music Video"])).toMatch(/already exists/);
    expect(validateCategoryName("portrait", ["wedding"])).toBeUndefined();
  });
});

describe("describeDeletion", () => {
  it("states the consequence in plain words", () => {
    expect(describeDeletion("event", 0)).toMatch(/No galleries use it/);
    expect(describeDeletion("event", 1)).toMatch(/1 gallery will become uncategorized/);
    expect(describeDeletion("event", 4)).toMatch(/4 galleries will become uncategorized/);
  });
});
