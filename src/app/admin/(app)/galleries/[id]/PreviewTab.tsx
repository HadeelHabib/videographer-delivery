"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { GalleryDetailData } from "./types";

export function PreviewTab({ gallery, onChanged }: { gallery: GalleryDetailData; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewToken, setPreviewToken] = useState<string | null>(null);

  const galleryUrl = typeof window !== "undefined" ? `${window.location.origin}/gallery/${gallery.slug}` : "";

  useEffect(() => {
    api
      .get<{ token: string }>(`/api/galleries/${gallery.id}/preview-token`)
      .then((data) => setPreviewToken(data.token))
      .catch(() => setPreviewToken(null));
  }, [gallery.id]);

  async function runAction(action: "deliver" | "archive" | "restore") {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/api/galleries/${gallery.id}/${action}`);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(galleryUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <code className="flex-1 truncate text-sm text-zinc-700">{galleryUrl}</code>
        <button
          onClick={copyLink}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {gallery.status !== "delivered" && gallery.status !== "archived" && (
          <button
            onClick={() => runAction("deliver")}
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Mark as Delivered
          </button>
        )}
        {gallery.status === "delivered" && (
          <button
            onClick={() => runAction("archive")}
            disabled={busy}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            Move to Vault
          </button>
        )}
        {gallery.status === "archived" && (
          <button
            onClick={() => runAction("restore")}
            disabled={busy}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            Restore from Vault
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-zinc-700">Client preview</p>
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          {previewToken ? (
            <iframe
              src={`/gallery/${gallery.slug}#preview_token=${encodeURIComponent(previewToken)}`}
              className="h-[600px] w-full"
              title="Gallery preview"
            />
          ) : (
            <div className="flex h-[600px] w-full items-center justify-center text-sm text-zinc-400">
              Loading preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
