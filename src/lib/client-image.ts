import { PREVIEW_MAX_BYTES, previewDimensions } from "@/lib/image-preview";

// Browser-only. Makes the 2048px JPEG preview of a photo; returns null when the photo is
// already small enough to show as-is, or when this browser can't decode it (e.g. HEIC) —
// in both cases the original is simply what viewers get.
export async function makePreviewJpeg(file: File): Promise<Blob | null> {
  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the camera's EXIF rotation so portrait shots aren't sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return null;
  }

  try {
    const target = previewDimensions(bitmap.width, bitmap.height);
    if (!target) return null;

    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, target.width, target.height);

    const toBlob = (quality: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

    // Step the quality down for the rare very detailed photo that would exceed the size cap.
    for (const quality of [0.88, 0.78, 0.68]) {
      const blob = await toBlob(quality);
      if (blob && blob.size <= PREVIEW_MAX_BYTES) return blob;
    }
    return null;
  } finally {
    bitmap.close();
  }
}
