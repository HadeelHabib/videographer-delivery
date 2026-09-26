"use client";

import Link from "next/link";

type Item = { slug: string; clientName: string; category: string | null; coverImage: string | null };

const PANEL_WIDTH = 250;
const PANEL_HEIGHT_VH = 58;
// Panels are absolutely positioned and each drives its own translateX, rather
// than sitting in a flex row that a parent scrolls — a flex gap can't account
// for how far a rotated panel visually bleeds sideways, which caused adjacent
// panels to overlap. Driving position from the same keyframe as the rotation
// guarantees enough clearance at any rotation angle.
const SLOT_SPACING = 300; // px between two panels' consecutive phase positions
const HALF_SPAN_SLOTS = 3; // a panel travels from +3 slots (entering) to -3 (exiting)
const PANEL_STEP_SECONDS = 2.2; // time between one panel's phase and the next panel's
const MAX_ROTATION = 40;
const DEPTH_PX = 170;
const MIN_SCALE = 0.82;
const PERSPECTIVE_PX = 1400;
const LANES = HALF_SPAN_SLOTS * 2; // minimum concurrent panels needed for continuous coverage

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
  const span = HALF_SPAN_SLOTS * SLOT_SPACING;

  return (
    <div
      className="featured-marquee-wrap relative overflow-hidden"
      style={{ perspective: `${PERSPECTIVE_PX}px`, height: `${PANEL_HEIGHT_VH}vh` }}
    >
      <style>{`
        @keyframes featured-panel-move {
          0%   { transform: translate(-50%, -50%) translateX(${span}px) rotateY(${MAX_ROTATION}deg) translateZ(-${DEPTH_PX}px) scale(${MIN_SCALE}); opacity: 0; }
          6%   { opacity: 1; }
          50%  { transform: translate(-50%, -50%) translateX(0px) rotateY(0deg) translateZ(0px) scale(1); opacity: 1; }
          94%  { opacity: 1; }
          100% { transform: translate(-50%, -50%) translateX(-${span}px) rotateY(-${MAX_ROTATION}deg) translateZ(-${DEPTH_PX}px) scale(${MIN_SCALE}); opacity: 0; }
        }
        .featured-marquee-track {
          transform-style: preserve-3d;
        }
        .featured-panel {
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
            className="featured-panel group absolute left-1/2 top-1/2 block overflow-hidden rounded-2xl bg-zinc-900"
            style={{
              width: PANEL_WIDTH,
              height: "100%",
              animationDelay: `${-(i * PANEL_STEP_SECONDS)}s`,
            }}
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
            <div className="absolute inset-x-0 bottom-0 p-5">
              {g.category && <p className="text-xs uppercase tracking-wide text-white/50">{g.category}</p>}
              <p className="mt-1 text-lg text-white" style={{ fontFamily: "var(--font-display)" }}>
                {g.clientName}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
