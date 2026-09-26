"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GalleryCarousel } from "./GalleryCarousel";

type Gallery = {
  slug: string;
  clientName: string;
  brandColor: string | null;
  brandLogoUrl: string | null;
  mediaCount: number;
  coverImage: string | null;
};
type Comment = { id: number; visitorName: string | null; body: string; createdAt: string };

export function CategoryPage({ category }: { category: string }) {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    fetch(`/api/public/portfolio/${category}`)
      .then((res) => res.json())
      .then((data) => {
        setGalleries(data.galleries);
        setComments(data.comments);
      })
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [category]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/portfolio/${category}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, body, website }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to post comment");
      }
      setSubmitted(true);
      setName("");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <section className="bg-zinc-950 pb-20 pt-14 sm:pt-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <Link href="/portfolio" className="text-xs uppercase tracking-wide text-white/40 hover:text-white/70">
            ← Portfolio
          </Link>
          <h1
            className="mt-3 text-center text-4xl capitalize text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {category}
          </h1>
        </div>

        <div className="mx-auto mt-14 max-w-6xl px-6 sm:px-10">
          {loading ? (
            <div className="mx-auto h-[420px] max-w-xs animate-pulse rounded-xl bg-white/5 sm:h-[480px]" />
          ) : (
            <GalleryCarousel galleries={galleries} />
          )}
        </div>
      </section>

      <section className="border-t border-black/5 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10">
          <h2 className="text-center text-2xl text-zinc-900" style={{ fontFamily: "var(--font-display)" }}>
            Kind words
          </h2>

          <div className="mt-10 flex flex-col gap-4">
            {comments.length === 0 ? (
              <p className="text-center text-sm text-zinc-400">Be the first to leave a note.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="rounded-2xl bg-zinc-50 p-5">
                  <p className="text-sm leading-relaxed text-zinc-700">&ldquo;{c.body}&rdquo;</p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
                    {c.visitorName || "Anonymous"}
                  </p>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={submitComment}
            className="mt-10 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-[#fafaf8] p-6"
          >
            <p className="text-sm font-medium text-zinc-800">Leave a note</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            {/* Honeypot field, hidden from real visitors */}
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
            />
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {submitted && <p className="text-sm text-emerald-600">Thanks! Your note is awaiting approval.</p>}
            <button
              type="submit"
              disabled={submitting}
              className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post note"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
