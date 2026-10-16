import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-redirect";

const backslash = String.fromCharCode(92);

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/gallery/ali-2026")).toBe("/gallery/ali-2026");
    expect(safeNextPath("/gallery/x?y=1")).toBe("/gallery/x?y=1");
  });

  it.each([null, undefined, "", "https://evil.com", "//evil.com", `/${backslash}evil.com`, "gallery/x", "javascript:alert(1)"])(
    "falls back to / for %s",
    (value) => {
      expect(safeNextPath(value as string | null | undefined)).toBe("/");
    },
  );
});
