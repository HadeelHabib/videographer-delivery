"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Category = { name: string; count: number; coverImage: string | null };
type Studio = { name: string; logoUrl: string | null; brandColor: string };

function AlbumTile({ category }: { category: Category }) {
  const [broken, setBroken] = useState(false);
  const showImage = category.coverImage && !broken;

  return (
    <Link href={`/portfolio/${category.name}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-900 shadow-sm ring-1 ring-black/5 transition duration-300 group-hover:shadow-lg group-active:scale-[0.97]">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.coverImage!}
            alt=""
            loading="lazy"
            onError={() => setBroken(true)}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-white/30" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="10.5" r="1.5" />
              <path d="m21 16-5-4.5L8 19" />
            </svg>
          </div>
        )}
      </div>
      <p className="mt-2 truncate px-0.5 text-[15px] font-medium capitalize text-zinc-900">{category.name}</p>
      <p className="px-0.5 text-sm text-zinc-400">{category.count}</p>
    </Link>
  );
}

export default function PortfolioPage() {
  const [studio, setStudio] = useState<Studio | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    fetch("/api/public/portfolio")
      .then((res) => res.json())
      .then((data) => {
        setStudio(data.studio);
        setCategories(data.categories);
      });
  }, []);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 text-center sm:px-10 sm:pt-28">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-zinc-400">
          {studio?.name ?? "Portfolio"}
        </p>
        <h1
          className="mx-auto mt-4 max-w-2xl text-4xl leading-tight text-zinc-900 sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Stories worth remembering, framed one moment at a time.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-sm text-zinc-500 sm:text-base">
          A selection of work across weddings, portraits, and events — browse by category below.
        </p>
      </section>

      {/* Phone-gallery style: an "Albums" grid of square, rounded covers with the name and count beneath. */}
      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-10">
        <div className="mb-4 flex items-baseline justify-between px-1">
          <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl">Albums</h2>
          {categories && categories.length > 0 && (
            <span className="text-sm text-zinc-400">{categories.length}</span>
          )}
        </div>

        {!categories ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-square animate-pulse rounded-2xl bg-zinc-100" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 py-24 text-center">
            <p className="text-sm text-zinc-400">No public galleries yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4">
            {categories.map((c) => (
              <AlbumTile key={c.name} category={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
