"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Gallery = {
  slug: string;
  clientName: string;
  mediaCount: number;
  coverImage: string | null;
};

const SPACING_PX = 230; // horizontal distance between neighboring panels
const ROTATE_DEG = 42; // how far each panel turns away from facing the viewer
const DEPTH_PX = 260; // how far back each panel steps into the scene
const VISIBLE_RANGE = 3; // panels further than this from center aren't rendered
const AUTOPLAY_MS = 5000;

export function GalleryCarousel({ galleries }: { galleries: Gallery[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (galleries.length <= 1 || paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setActive((i) => (i + 1) % galleries.length), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [active, paused, galleries.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") setActive((i) => (i - 1 + galleries.length) % galleries.length);
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % galleries.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleries.length]);

  if (galleries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 py-24 text-center">
        <p className="text-sm text-white/40">No galleries in this category yet.</p>
      </div>
    );
  }

  const current = galleries[active];

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="relative flex h-[420px] items-center justify-center overflow-hidden sm:h-[480px]"
        style={{ perspective: "1600px" }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Galleries in this category"
      >
        {galleries.map((g, i) => {
          const diff = i - active;
          const distance = Math.abs(diff);
          if (distance > VISIBLE_RANGE) return null;
          const isActive = diff === 0;

          const style: React.CSSProperties = {
            transform: `translate(-50%, -50%) translateX(${diff * SPACING_PX}px) translateZ(${-distance * DEPTH_PX}px) rotateY(${-diff * ROTATE_DEG}deg)`,
            opacity: distance > VISIBLE_RANGE - 1 ? 0 : 1 - distance * 0.22,
            filter: isActive ? "brightness(1)" : `brightness(${1 - distance * 0.18})`,
            zIndex: 100 - distance,
            transformStyle: "preserve-3d",
          };

          return (
            <button
              key={g.slug}
              type="button"
              onClick={() => setActive(i)}
              aria-current={isActive}
              aria-label={g.clientName}
              className="absolute left-1/2 top-1/2 h-[300px] w-[220px] shrink-0 overflow-hidden rounded-xl bg-zinc-900 shadow-2xl transition-[transform,opacity,filter] duration-700 ease-out sm:h-[360px] sm:w-[260px]"
              style={style}
            >
              {g.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.coverImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
                  <span className="text-xs uppercase tracking-wide text-white/40">No preview yet</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            </button>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xl text-white" style={{ fontFamily: "var(--font-display)" }}>
          {current.clientName}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-white/40">
          {current.mediaCount} {current.mediaCount === 1 ? "file" : "files"}
        </p>
        <Link
          href={`/gallery/${current.slug}`}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-white/90"
        >
          View gallery →
        </Link>
      </div>

      {galleries.length > 1 && (
        <div className="mt-8 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => setActive((i) => (i - 1 + galleries.length) % galleries.length)}
            aria-label="Previous gallery"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" stroke="currentColor" />
            </svg>
          </button>

          <div role="tablist" aria-label="Galleries" className="flex items-center gap-2">
            {galleries.map((g, i) => (
              <button
                key={g.slug}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Go to ${g.clientName}`}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? "w-8 bg-white" : "w-1.5 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setActive((i) => (i + 1) % galleries.length)}
            aria-label="Next gallery"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" stroke="currentColor" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
