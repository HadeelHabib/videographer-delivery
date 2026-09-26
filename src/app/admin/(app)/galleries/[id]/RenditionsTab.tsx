"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { StatusBadge } from "@/components/StatusBadge";
import { VIDEO_QUALITIES, PHOTO_QUALITIES, supportedQualities, type RenditionQuality } from "@/lib/constants";
import type { GalleryDetailData } from "./types";

export function RenditionsTab({ gallery, onChanged }: { gallery: GalleryDetailData; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function addQuality(mediaId: number, quality: RenditionQuality) {
    setBusy(`add-${mediaId}-${quality}`);
    setError(null);
    try {
      await api.post(`/api/media/${mediaId}/renditions`, { quality });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to queue rendition");
    } finally {
      setBusy(null);
    }
  }

  async function removeRendition(mediaId: number, renditionId: number) {
    setBusy(`remove-${renditionId}`);
    setError(null);
    try {
      await api.delete(`/api/media/${mediaId}/renditions/${renditionId}`);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove rendition");
    } finally {
      setBusy(null);
    }
  }

  if (gallery.media.length === 0) {
    return <p className="text-sm text-zinc-500">Upload media first to manage renditions.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {gallery.media.map((media) => {
        const existingQualities = new Set(media.renditions.map((r) => r.quality));
        const sourcePx =
          media.type === "photo" ? Math.max(media.width ?? 0, media.height ?? 0) || null : media.height;
        const allQualities = media.type === "video" ? VIDEO_QUALITIES : PHOTO_QUALITIES;
        const missingQualities = supportedQualities(allQualities, sourcePx).filter(
          (q) => !existingQualities.has(q)
        );

        return (
          <div key={media.id} className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-sm font-medium text-zinc-900">{media.originalFilename}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {media.renditions.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs"
                >
                  <span className="font-medium text-zinc-700">{r.quality}</span>
                  <StatusBadge status={r.status} />
                  {r.quality !== "original" && r.status !== "processing" && (
                    <button
                      onClick={() => removeRendition(media.id, r.id)}
                      disabled={busy === `remove-${r.id}`}
                      className="text-zinc-400 hover:text-red-600"
                      title="Remove rendition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {missingQualities.map((q) => (
                <button
                  key={q}
                  onClick={() => addQuality(media.id, q)}
                  disabled={busy === `add-${media.id}-${q}`}
                  className="rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs text-zinc-500 hover:border-zinc-900 hover:text-zinc-900"
                >
                  + Add {q}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
