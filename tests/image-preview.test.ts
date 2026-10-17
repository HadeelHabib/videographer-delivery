import { describe, expect, it } from "vitest";
import { isJpeg, previewDimensions } from "@/lib/image-preview";

describe("previewDimensions", () => {
  it("scales the long edge down to 2048 and keeps the aspect ratio", () => {
    expect(previewDimensions(6000, 4000)).toEqual({ width: 2048, height: 1365 });
    expect(previewDimensions(4000, 6000)).toEqual({ width: 1365, height: 2048 });
  });

  it("never upscales and ignores unusable sizes", () => {
    expect(previewDimensions(2048, 1000)).toBeNull();
    expect(previewDimensions(800, 600)).toBeNull();
    expect(previewDimensions(0, 4000)).toBeNull();
  });
});

describe("isJpeg", () => {
  it("accepts only real JPEG bytes", () => {
    expect(isJpeg(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]))).toBe(true);
    expect(isJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false); // PNG
    expect(isJpeg(new TextEncoder().encode("<html>"))).toBe(false);
    expect(isJpeg(new Uint8Array([]))).toBe(false);
  });
});
