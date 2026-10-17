"use client";

import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { uploadFileInParts } from "@/lib/chunked-upload";
import { WORKER_ENABLED } from "@/lib/processing";
import { makePreviewJpeg } from "@/lib/client-image";
import { VIDEO_QUALITIES, PHOTO_QUALITIES, supportedQualities, type RenditionQuality } from "@/lib/constants";
import type { GalleryDetailData } from "./types";

type QueueItem = {
  file: File;
  qualities: RenditionQuality[];
  dimensions: { width: number; height: number } | null; // null while still detecting
  progress: number; // 0-1
  status: "pending" | "uploading" | "processing" | "done" | "error";
  error?: string;
  note?: string; // non-fatal: the file is uploaded, but something optional didn't happen
};

function detectType(file: File): "video" | "photo" {
  return file.type.startsWith("video/") ? "video" : "photo";
}

// Reads intrinsic pixel dimensions from the file itself, client-side, before
// any upload starts — used to hide quality tiers that would just upscale.
function readDimensions(file: File): Promise<{ width: number; height: number } | null> {
  const type = detectType(file);
  const url = URL.createObjectURL(file);
  return new Promise((resolve) => {
    if (type === "video") {
      const el = document.createElement("video");
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(el.videoWidth && el.videoHeight ? { width: el.videoWidth, height: el.videoHeight } : null);
      };
      el.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      el.src = url;
    } else {
      const el = new Image();
      el.onload = () => {
        URL.revokeObjectURL(url);
        resolve(el.naturalWidth && el.naturalHeight ? { width: el.naturalWidth, height: el.naturalHeight } : null);
      };
      el.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      el.src = url;
    }
  });
}

function sourcePx(type: "video" | "photo", dimensions: { width: number; height: number } | null) {
  if (!dimensions) return null;
  return type === "photo" ? Math.max(dimensions.width, dimensions.height) : dimensions.height;
}

function defaultQualities(type: "video" | "photo", dimensions: { width: number; height: number } | null) {
  const all = type === "video" ? VIDEO_QUALITIES : PHOTO_QUALITIES;
  const allowed = supportedQualities(all, sourcePx(type, dimensions));
  // Videos default to just the top supported tier — extra renditions cost real
  // storage for large video files, so 720p/480p are opt-in, not automatic.
  // Photos stay cheap to store either way, so default to the top two.
  return type === "video" ? allowed.slice(0, 1) : allowed.slice(0, 2);
}

export function UploadTab({ gallery, onChanged }: { gallery: GalleryDetailData; onChanged: () => void }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const startIndex = queue.length;
    const items: QueueItem[] = Array.from(files).map((file) => ({
      file,
      qualities: [],
      dimensions: null,
      progress: 0,
      status: "pending",
    }));
    setQueue((q) => [...q, ...items]);

    items.forEach((item, i) => {
      readDimensions(item.file).then((dimensions) => {
        setQueue((q) =>
          q.map((existing, idx) =>
            idx === startIndex + i
              ? {
                  ...existing,
                  dimensions,
                  qualities: WORKER_ENABLED ? defaultQualities(detectType(existing.file), dimensions) : [],
                }
              : existing
          )
        );
      });
    });
  }

  function toggleQuality(index: number, quality: RenditionQuality) {
    setQueue((q) =>
      q.map((item, i) =>
        i === index
          ? {
              ...item,
              qualities: item.qualities.includes(quality)
                ? item.qualities.filter((x) => x !== quality)
                : [...item.qualities, quality],
            }
          : item
      )
    );
  }

  function updateItem(index: number, patch: Partial<QueueItem>) {
    setQueue((q) => q.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function startUpload(index: number) {
    const item = queue[index];
    updateItem(index, { status: "uploading", progress: 0 });

    try {
      const type = detectType(item.file);
      const { media, uploadId } = await api.post<{ media: { id: number }; uploadId: string }>(
        `/api/galleries/${gallery.id}/media`,
        {
          type,
          originalFilename: item.file.name,
          fileSizeBytes: item.file.size,
          contentType: item.file.type || "application/octet-stream",
          width: item.dimensions?.width,
          height: item.dimensions?.height,
        }
      );

      await uploadFileInParts(item.file, media.id, uploadId, (p) =>
        updateItem(index, { progress: p.uploadedBytes / p.totalBytes })
      );

      updateItem(index, { status: "processing" });
      await api.post(`/api/media/${media.id}/complete`, { qualities: item.qualities });

      // No worker: make the web-sized photo preview here, in the browser, and send it along.
      let note: string | undefined;
      if (!WORKER_ENABLED && type === "photo") {
        try {
          const preview = await makePreviewJpeg(item.file);
          if (preview) {
            await api.postBinary(`/api/media/${media.id}/preview-image`, preview);
          } else if (item.dimensions && Math.max(item.dimensions.width, item.dimensions.height) > 2048) {
            note = "Uploaded, but this browser couldn't make a web preview (HEIC/RAW?) — viewers will load the full original. Upload a JPEG for faster galleries.";
          }
        } catch {
          note = "Uploaded, but the web preview failed — viewers will load the full original. Re-upload the photo to retry.";
        }
      }

      updateItem(index, { status: "done", progress: 1, note });
      onChanged();
    } catch (err) {
      updateItem(index, { status: "error", error: err instanceof ApiError ? err.message : "Upload failed" });
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
          dragOver ? "border-zinc-900 bg-zinc-100" : "border-zinc-300 bg-white hover:bg-zinc-50"
        }`}
      >
        <p className="text-sm font-medium text-zinc-700">Drag and drop files here, or click to browse</p>
        <p className="mt-1 text-xs text-zinc-400">
          {WORKER_ENABLED
            ? "Videos and photos, any size"
            : "Videos (web-ready H.264 MP4) and photos (JPEG), any size"}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {queue.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {queue.map((item, index) => {
            const type = detectType(item.file);
            const allQualities = type === "video" ? VIDEO_QUALITIES : PHOTO_QUALITIES;
            const allowedQualities = supportedQualities(allQualities, sourcePx(type, item.dimensions));

            return (
              <div key={index} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{item.file.name}</p>
                    <p className="text-xs text-zinc-400">
                      {(item.file.size / (1024 * 1024)).toFixed(1)} MB · {type}
                      {item.dimensions ? ` · ${item.dimensions.width}×${item.dimensions.height}` : ""}
                    </p>
                  </div>
                  {item.status === "pending" && (
                    <button
                      onClick={() => startUpload(index)}
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
                    >
                      Upload
                    </button>
                  )}
                  {item.status === "error" && (
                    <button
                      onClick={() => startUpload(index)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                    >
                      Retry
                    </button>
                  )}
                </div>

                {item.status === "pending" && (
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    {!WORKER_ENABLED ? (
                      <p className="text-xs text-zinc-500">
                        {type === "video"
                          ? "Delivered exactly as uploaded — export it as an H.264 MP4 so it plays in every browser."
                          : "Delivered in full quality for download, with a 2048px preview made here in your browser."}
                      </p>
                    ) : !item.dimensions ? (
                      <p className="text-xs text-zinc-400">Detecting resolution…</p>
                    ) : allowedQualities.length === 0 ? (
                      <p className="text-xs text-zinc-400">
                        Source resolution too small for any downscaled version — the original will be delivered as-is.
                      </p>
                    ) : (
                      allowedQualities.map((q) => (
                        <label key={q} className="flex items-center gap-1.5 text-xs text-zinc-600">
                          <input
                            type="checkbox"
                            checked={item.qualities.includes(q)}
                            onChange={() => toggleQuality(index, q)}
                          />
                          {q}
                        </label>
                      ))
                    )}
                  </div>
                )}

                {(item.status === "uploading" || item.status === "processing" || item.status === "done") && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-zinc-900 transition-all"
                        style={{ width: `${Math.round(item.progress * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-zinc-400 capitalize">
                      {item.status === "uploading" ? `Uploading ${Math.round(item.progress * 100)}%` : item.status}
                    </p>
                  </div>
                )}

                {item.status === "done" && item.note && <p className="mt-2 text-xs text-amber-700">{item.note}</p>}
                {item.status === "error" && <p className="mt-2 text-xs text-red-600">{item.error}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
