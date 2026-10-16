import { describe, expect, it } from "vitest";
import { defaultQualityFor, qualityTargetPx, supportedQualities, VIDEO_QUALITIES } from "@/lib/constants";

describe("rendition qualities", () => {
  it("never offers a tier above the source resolution", () => {
    expect(supportedQualities(VIDEO_QUALITIES, 720)).toEqual(["720p", "480p"]);
    expect(supportedQualities(VIDEO_QUALITIES, null)).toEqual(["1080p", "720p", "480p"]);
    expect(qualityTargetPx("2048px")).toBe(2048);
    expect(qualityTargetPx("original")).toBeNull();
  });

  it("defaults to the top tier the source supports", () => {
    expect(defaultQualityFor("video", 2160)).toBe("1080p");
    expect(defaultQualityFor("video", 720)).toBe("720p");
    expect(defaultQualityFor("photo", 3000)).toBe("2048px");
    expect(defaultQualityFor("photo", 800)).toBe("640px");
  });

  it("returns nothing when the source is smaller than every tier", () => {
    expect(defaultQualityFor("photo", 300)).toBeUndefined();
    expect(defaultQualityFor("video", 360)).toBeUndefined();
  });
});
