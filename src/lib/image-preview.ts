// Shared by the browser (to size the preview) and the API (to validate what arrives).

export const PREVIEW_QUALITY = "2048px";
export const PREVIEW_MAX_EDGE = 2048;
export const PREVIEW_MAX_BYTES = 8 * 1024 * 1024;

// Target size so the long edge is `maxEdge`, or null when the photo is already small
// enough to be shown as-is (never upscale).
export function previewDimensions(width: number, height: number, maxEdge = PREVIEW_MAX_EDGE) {
  const longEdge = Math.max(width, height);
  if (!width || !height || longEdge <= maxEdge) return null;
  const scale = maxEdge / longEdge;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

// JPEG magic bytes — the upload endpoint accepts nothing else, whatever the client claims.
export function isJpeg(bytes: Uint8Array) {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}
