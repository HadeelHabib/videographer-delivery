export const VIDEO_QUALITIES = ["1080p", "720p", "480p"] as const;
export type VideoQuality = (typeof VIDEO_QUALITIES)[number];

// `height` is the vertical resolution this tier targets — used to stop a
// rendition being requested above what the source video actually contains.
export const VIDEO_RENDITION_SETTINGS: Record<VideoQuality, { size: string; crf: number; height: number }> = {
  "1080p": { size: "1920x1080", crf: 23, height: 1080 },
  "720p": { size: "1280x720", crf: 23, height: 720 },
  "480p": { size: "854x480", crf: 24, height: 480 },
};

export const PHOTO_QUALITIES = ["2048px", "1024px", "640px"] as const;
export type PhotoQuality = (typeof PHOTO_QUALITIES)[number];

// `longEdge` is the longest-side pixel size this tier targets — same
// upscale-guard idea as video's `height`, just measured along whichever
// side (width or height) is longer, since photos can be portrait or landscape.
export const PHOTO_RENDITION_SETTINGS: Record<PhotoQuality, { longEdge: number; jpegQuality: number }> = {
  "2048px": { longEdge: 2048, jpegQuality: 88 },
  "1024px": { longEdge: 1024, jpegQuality: 85 },
  "640px": { longEdge: 640, jpegQuality: 82 },
};

export const RENDITION_QUALITIES = [...VIDEO_QUALITIES, ...PHOTO_QUALITIES] as const;
export type RenditionQuality = VideoQuality | PhotoQuality;

export function isVideoQuality(quality: string): quality is VideoQuality {
  return (VIDEO_QUALITIES as readonly string[]).includes(quality);
}

export function isPhotoQuality(quality: string): quality is PhotoQuality {
  return (PHOTO_QUALITIES as readonly string[]).includes(quality);
}

// The pixel size a rendition quality targets (video: height, photo: long
// edge), so callers can reject a request that would upscale past the source.
export function qualityTargetPx(quality: string): number | null {
  if (isVideoQuality(quality)) return VIDEO_RENDITION_SETTINGS[quality].height;
  if (isPhotoQuality(quality)) return PHOTO_RENDITION_SETTINGS[quality].longEdge;
  return null;
}

// Qualities from a given set that the source dimensions can actually support
// without upscaling. `sourcePx` is the source's height (video) or long edge
// (photo); `null` means unknown, in which case nothing is filtered out.
export function supportedQualities<T extends readonly string[]>(qualities: T, sourcePx: number | null): T[number][] {
  if (sourcePx === null) return [...qualities];
  return qualities.filter((q) => {
    const target = qualityTargetPx(q);
    return target === null || target <= sourcePx;
  });
}

export const GALLERY_STATUSES = ["draft", "ready", "delivered", "archived"] as const;
export const GALLERY_CATEGORIES = ["wedding", "portrait", "event", "commercial", "other"] as const;
