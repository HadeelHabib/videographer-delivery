import { describe, expect, it } from "vitest";
import {
  buildDailySeries,
  formatBytes,
  groupByCategory,
  niceCeil,
  normalizeCategory,
  percentChange,
  summarizeNames,
  timeAgo,
  utcDayStart,
} from "@/lib/overview-math";

describe("buildDailySeries", () => {
  const start = utcDayStart(new Date("2026-10-10T15:30:00Z"));

  it("zero-fills every day and counts views and downloads separately", () => {
    const series = buildDailySeries(
      [
        { action: "viewed", accessedAt: new Date("2026-10-10T00:00:01Z") },
        { action: "viewed", accessedAt: new Date("2026-10-10T23:59:59Z") },
        { action: "downloaded", accessedAt: new Date("2026-10-12T08:00:00Z") },
        { action: "viewed", accessedAt: new Date("2026-10-30T08:00:00Z") },
      ],
      start,
      4,
    );
    expect(series.map((p) => p.date)).toEqual(["2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13"]);
    expect(series.map((p) => p.views)).toEqual([2, 0, 0, 0]);
    expect(series.map((p) => p.downloads)).toEqual([0, 0, 1, 0]);
  });
});

describe("percentChange", () => {
  it("compares to the previous period and refuses to divide by zero", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
    expect(percentChange(5, 0)).toBeNull();
  });
});

describe("groupByCategory", () => {
  it("merges case variants, sorts by size, and puts uncategorized last", () => {
    const groups = groupByCategory([
      { id: 1, category: "Wedding", status: "draft" },
      { id: 2, category: "wedding ", status: "delivered" },
      { id: 3, category: null, status: "draft" },
      { id: 4, category: "event", status: "ready" },
      { id: 5, category: "", status: "ready" },
    ]);
    expect(groups.map((g) => [g.name, g.items.length])).toEqual([
      ["wedding", 2],
      ["event", 1],
      [null, 2],
    ]);
    expect(normalizeCategory("  Portrait ")).toBe("portrait");
  });
});

describe("axis + formatting helpers", () => {
  it("rounds axis maxima to clean numbers", () => {
    expect(niceCeil(0)).toBe(4);
    expect(niceCeil(3)).toBe(4);
    expect(niceCeil(7)).toBe(8);
    expect(niceCeil(13)).toBe(20);
    expect(niceCeil(87)).toBe(100);
    expect(niceCeil(230)).toBe(400);
  });

  it("formats bytes and name lists", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 ** 3)).toBe("5.0 GB");
    expect(summarizeNames(["a", "b"])).toBe("a, b");
    expect(summarizeNames(["a", "b", "c", "d"])).toBe("a, b +2 more");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-17T12:00:00Z").getTime();
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it("reads naturally at each scale", () => {
    expect(timeAgo(ago(10_000), now)).toBe("just now");
    expect(timeAgo(ago(5 * 60_000), now)).toBe("5m ago");
    expect(timeAgo(ago(3 * 3_600_000), now)).toBe("3h ago");
    expect(timeAgo(ago(2 * 86_400_000), now)).toBe("2d ago");
    expect(timeAgo(ago(30 * 86_400_000), now)).toMatch(/Sep/);
  });
});
