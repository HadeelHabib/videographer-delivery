"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { StatusBadge } from "@/components/StatusBadge";
import type { GalleryDetailData } from "./types";
import { UploadTab } from "./UploadTab";
import { RenditionsTab } from "./RenditionsTab";
import { PreviewTab } from "./PreviewTab";
import { AccessLogTab } from "./AccessLogTab";
import { DetailsTab } from "./DetailsTab";
import { GalleryCommentsTab } from "./GalleryCommentsTab";

const TABS = ["Upload", "Renditions", "Preview & Send", "Comments", "Access Log", "Details"] as const;

export function GalleryDetail({ galleryId }: { galleryId: number }) {
  const [gallery, setGallery] = useState<GalleryDetailData | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Upload");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    return api
      .get<{ gallery: GalleryDetailData }>(`/api/galleries/${galleryId}`)
      .then((data) => setGallery(data.gallery));
  }, [galleryId]);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  if (loading || !gallery) {
    return <div className="text-sm text-zinc-500">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-zinc-900">{gallery.clientName}</h1>
            <StatusBadge status={gallery.status} />
          </div>
          <p className="mt-1 text-sm text-zinc-500">/gallery/{gallery.slug}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-1 border-b border-zinc-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t}
            {t === "Comments" && gallery.galleryComments.length > 0 && (
              <span className="ml-1.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">
                {gallery.galleryComments.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Upload" && <UploadTab gallery={gallery} onChanged={refresh} />}
        {tab === "Renditions" && <RenditionsTab gallery={gallery} onChanged={refresh} />}
        {tab === "Preview & Send" && <PreviewTab gallery={gallery} onChanged={refresh} />}
        {tab === "Comments" && <GalleryCommentsTab gallery={gallery} onChanged={refresh} />}
        {tab === "Access Log" && <AccessLogTab logs={gallery.accessLogs} />}
        {tab === "Details" && <DetailsTab gallery={gallery} onChanged={refresh} />}
      </div>
    </div>
  );
}
