"use client";

import { GalleryCommentThread } from "@/components/GalleryCommentThread";
import type { GalleryDetailData } from "./types";

export function GalleryCommentsTab({ gallery, onChanged }: { gallery: GalleryDetailData; onChanged: () => void }) {
  if (gallery.galleryComments.length === 0) {
    return <p className="text-sm text-zinc-500">No comments yet. Comments left by signed-in clients show up here instantly.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {gallery.galleryComments.map((c) => (
        <GalleryCommentThread key={c.id} comment={c} galleryId={gallery.id} onChanged={onChanged} />
      ))}
    </div>
  );
}
