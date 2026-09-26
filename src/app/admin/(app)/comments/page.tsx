"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { GalleryCommentThread, type GalleryCommentData } from "@/components/GalleryCommentThread";

type PortfolioComment = {
  id: number;
  category: string;
  visitorName: string | null;
  body: string;
  createdAt: string;
};

type GalleryComment = GalleryCommentData & { gallery: { id: number; clientName: string; slug: string } };

export default function CommentsPage() {
  const [portfolioComments, setPortfolioComments] = useState<PortfolioComment[]>([]);
  const [galleryComments, setGalleryComments] = useState<GalleryComment[]>([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    setLoading(true);
    Promise.all([
      api.get<{ comments: PortfolioComment[] }>("/api/comments?status=pending"),
      api.get<{ comments: GalleryComment[] }>("/api/gallery-comments"),
    ])
      .then(([portfolio, gallery]) => {
        setPortfolioComments(portfolio.comments);
        setGalleryComments(gallery.comments);
      })
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function moderate(id: number, status: "approved" | "rejected") {
    await api.patch(`/api/comments/${id}`, { status });
    setPortfolioComments((c) => c.filter((comment) => comment.id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">Comments</h1>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Portfolio testimonials — pending approval
        </h2>
        <p className="mt-1 text-sm text-zinc-500">Approve or reject before anything shows on the public portfolio.</p>

        <div className="mt-4 flex flex-col gap-3">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : portfolioComments.length === 0 ? (
            <p className="text-sm text-zinc-500">Nothing waiting on review.</p>
          ) : (
            portfolioComments.map((c) => (
              <div key={c.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{c.visitorName || "Anonymous"}</p>
                    <p className="text-xs capitalize text-zinc-400">
                      {c.category} · {new Date(c.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moderate(c.id, "approved")}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => moderate(c.id, "rejected")}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-700">{c.body}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Gallery comments</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Left by signed-in clients on their gallery pages — visible instantly, no approval needed.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : galleryComments.length === 0 ? (
            <p className="text-sm text-zinc-500">No gallery comments yet.</p>
          ) : (
            galleryComments.map((c) => (
              <GalleryCommentThread
                key={c.id}
                comment={c}
                galleryId={c.gallery.id}
                onChanged={refresh}
                headerExtra={
                  <>
                    <Link href={`/admin/galleries/${c.gallery.id}`} className="underline hover:text-zinc-600">
                      {c.gallery.clientName}
                    </Link>{" "}
                    ·{" "}
                  </>
                }
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
