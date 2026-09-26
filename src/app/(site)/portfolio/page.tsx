"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Category = { name: string; count: number; coverImage: string | null };
type Studio = { name: string; logoUrl: string | null; brandColor: string };

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

      <section className="mx-auto max-w-6xl px-6 pb-24 sm:px-10">
        {!categories ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-zinc-100" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 py-24 text-center">
            <p className="text-sm text-zinc-400">No public galleries yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={`/portfolio/${c.name}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-900"
              >
                {c.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.coverImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
                  <div>
                    <h2
                      className="text-2xl capitalize text-white"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {c.name}
                    </h2>
                    <p className="mt-1 text-xs uppercase tracking-wide text-white/60">
                      {c.count} {c.count === 1 ? "gallery" : "galleries"}
                    </p>
                  </div>
                  <span className="translate-x-1 text-white/70 transition group-hover:translate-x-0 group-hover:text-white">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
