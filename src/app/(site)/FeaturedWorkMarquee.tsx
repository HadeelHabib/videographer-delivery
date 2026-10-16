"use client";

import Link from "next/link";

type Item = { slug: string; clientName: string; category: string | null; coverImage: string | null };

// Measured directly from the reference clip (frame-by-frame pixel sampling):
// panel height at a FIXED screen x-position never changes over time — it's a
// static trapezoid across the row (tall flat plateau in the middle, ~44% of
// the width, tapering over ~28% on each side toward the edges). Panels don't
// individually "breathe" a wave over time; whichever panel currently sits at
// a given x simply takes on that position's height. A 3D rotateY + translateZ
// tied to each panel's own position (not a clock) reproduces exactly this:
// the rotation/depth only apply in the outer ~28% of the journey, so it
// resolves to a fixed height-by-position profile, with genuinely slanted
// (not just shorter) edges — also confirmed by measurement.
const HALF_SPAN_SLOTS = 3;
const PANEL_STEP_SECONDS = 2;
const MAX_ROTATION = 38;
const MIN_SCALE = 0.8;
const LANES = HALF_SPAN_SLOTS * 2;

export function FeaturedWorkMarquee({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 py-24 text-center">
        <p className="text-sm text-white/40">New work is on its way — check back soon.</p>
      </div>
    );
  }

  const minCount = Math.max(items.length, LANES);
  const repeats = Math.ceil(minCount / items.length);
  const lanes = Array.from({ length: repeats }, () => items).flat();

  const cycleSeconds = HALF_SPAN_SLOTS * 2 * PANEL_STEP_SECONDS;
  const spanSlots = HALF_SPAN_SLOTS;

  return (
    <div className="featured-marquee-wrap relative overflow-hidden">
      <style>{`
        .featured-marquee-wrap {
          --panel-width: 230px;
          --slot-spacing: 248px;
          --depth: 150px;
          --perspective: 1300px;
          --panel-height: 58vh;
          height: var(--panel-height);
          perspective: var(--perspective);
        }
        @media (max-width: 640px) {
          .featured-marquee-wrap {
            --panel-width: 128px;
            --slot-spacing: 138px;
            --depth: 82px;
            --perspective: 720px;
            --panel-height: 46vh;
          }
        }
        /* Position (translateX) stays perfectly linear across 0%→100% the
           whole time — only rotation/depth/scale change, and only in a band
           near each edge, matching the measured flat-plateau width. Where
           that band falls (as a % of the journey) depends on how wide the
           viewport is relative to the travel distance, so mobile — a much
           narrower viewport relative to the same slot-spacing-driven span —
           needs its own, later-starting band; see the mobile override below. */
        @keyframes featured-panel-move {
          0%   { transform: translate(-50%, -50%) translateX(calc(var(--slot-spacing) * ${spanSlots})) rotateY(${MAX_ROTATION}deg) translateZ(calc(var(--depth) * -1)) scale(${MIN_SCALE}); opacity: 0; }
          4%   { opacity: 1; }
          28%  { transform: translate(-50%, -50%) translateX(calc(var(--slot-spacing) * ${spanSlots} * 0.44)) rotateY(0deg) translateZ(0px) scale(1); opacity: 1; }
          72%  { transform: translate(-50%, -50%) translateX(calc(var(--slot-spacing) * ${spanSlots} * -0.44)) rotateY(0deg) translateZ(0px) scale(1); opacity: 1; }
          96%  { opacity: 1; }
          100% { transform: translate(-50%, -50%) translateX(calc(var(--slot-spacing) * -${spanSlots})) rotateY(-${MAX_ROTATION}deg) translateZ(calc(var(--depth) * -1)) scale(${MIN_SCALE}); opacity: 0; }
        }
        @media (max-width: 640px) {
          @keyframes featured-panel-move {
            0%   { transform: translate(-50%, -50%) translateX(calc(var(--slot-spacing) * ${spanSlots})) rotateY(${MAX_ROTATION}deg) translateZ(calc(var(--depth) * -1)) scale(${MIN_SCALE}); opacity: 0; }
            4%   { opacity: 1; }
            39%  { transform: translate(-50%, -50%) translateX(calc(var(--slot-spacing) * ${spanSlots} * 0.22)) rotateY(0deg) translateZ(0px) scale(1); opacity: 1; }
            61%  { transform: translate(-50%, -50%) translateX(calc(var(--slot-spacing) * ${spanSlots} * -0.22)) rotateY(0deg) translateZ(0px) scale(1); opacity: 1; }
            96%  { opacity: 1; }
            100% { transform: translate(-50%, -50%) translateX(calc(var(--slot-spacing) * -${spanSlots})) rotateY(-${MAX_ROTATION}deg) translateZ(calc(var(--depth) * -1)) scale(${MIN_SCALE}); opacity: 0; }
          }
        }
        .featured-marquee-track {
          transform-style: preserve-3d;
        }
        .featured-panel {
          width: var(--panel-width);
          animation: featured-panel-move ${cycleSeconds}s linear infinite;
          transform-style: preserve-3d;
          backface-visibility: hidden;
          box-shadow: 0 30px 70px -15px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255,255,255,0.04) inset;
        }
        .featured-marquee-wrap:hover .featured-panel {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .featured-panel { animation-play-state: paused !important; }
        }
      `}</style>

      <div className="featured-marquee-track relative h-full">
        {lanes.map((g, i) => (
          <Link
            key={i}
            href={`/gallery/${g.slug}`}
            className="featured-panel group absolute left-1/2 top-1/2 block h-full overflow-hidden rounded-2xl bg-zinc-900"
            style={{ animationDelay: `${-(i * PANEL_STEP_SECONDS)}s` }}
          >
            {g.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={g.coverImage}
                alt={g.clientName}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5">
              {g.category && <p className="text-[10px] uppercase tracking-wide text-white/50 sm:text-xs">{g.category}</p>}
              <p className="mt-1 text-sm text-white sm:text-lg" style={{ fontFamily: "var(--font-display)" }}>
                {g.clientName}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
