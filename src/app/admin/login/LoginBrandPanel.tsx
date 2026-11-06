"use client";

import { motion, useReducedMotion } from "framer-motion";

export type Studio = { name: string; tagline: string | null; logoUrl: string | null };

const FRAMES = [
  "linear-gradient(160deg,#2f5d50 0%,#16221e 100%)",
  "linear-gradient(160deg,#b9854a 0%,#3a2814 100%)",
  "linear-gradient(160deg,#3b4a6b 0%,#14161f 100%)",
  "linear-gradient(160deg,#7a3b4f 0%,#1c1014 100%)",
  "linear-gradient(160deg,#4d6e62 0%,#101614 100%)",
  "linear-gradient(160deg,#8f6a3a 0%,#1d150c 100%)",
];

// Three columns of poster frames drifting at different speeds — the same visual language as the
// public site's hero, so the studio's front door and back door feel like one brand.
const COLUMNS = [
  { offset: 0, duration: 70, order: [0, 3, 1, 4, 2, 5] },
  { offset: 3, duration: 52, order: [2, 5, 0, 3, 1, 4] },
  { offset: 1, duration: 62, order: [4, 1, 5, 2, 0, 3] },
];

function Frame({ gradient, play }: { gradient: string; play?: boolean }) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl ring-1 ring-white/10" style={{ background: gradient }}>
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,rgba(255,255,255,0.14),transparent_55%)]" />
      {play && (
        <span className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 translate-x-px fill-white" aria-hidden="true">
            <path d="M8 5.5v13l11-6.5-11-6.5Z" />
          </svg>
        </span>
      )}
    </div>
  );
}

const POINTS = ["Deliver private galleries with a password", "See who viewed and downloaded", "Reply to client comments in one place"];

export function LoginBrandPanel({ studio }: { studio: Studio }) {
  const reduce = useReducedMotion();
  const initial = studio.name.trim().charAt(0).toUpperCase() || "S";

  return (
    <aside className="relative isolate hidden overflow-hidden bg-[#12110f] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(60% 50% at 12% 8%, rgba(47,93,80,0.55), transparent 70%), radial-gradient(55% 45% at 92% 96%, rgba(185,133,74,0.30), transparent 70%)",
        }}
      />

      {/* Drifting frames */}
      <div aria-hidden="true" className="absolute -right-28 -top-[12%] -z-10 flex h-[130%] w-[72%] rotate-[8deg] gap-5 opacity-60">
        {COLUMNS.map((col, ci) => (
          <div key={ci} className="min-w-0 flex-1 overflow-hidden" style={{ marginTop: `${col.offset * 28}px` }}>
            <motion.div
              className="flex flex-col gap-5 will-change-transform"
              animate={reduce ? undefined : { y: ["0%", "-50%"] }}
              transition={{ duration: col.duration, repeat: Infinity, ease: "linear" }}
            >
              {[...col.order, ...col.order].map((frameIndex, i) => (
                <Frame key={i} gradient={FRAMES[frameIndex]} play={(i + ci) % 4 === 0} />
              ))}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Keeps the copy readable over the frames */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#12110f] via-[#12110f]/80 to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-[#12110f] to-transparent" />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-3"
      >
        {studio.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={studio.logoUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg font-semibold ring-1 ring-white/15" style={{ fontFamily: "var(--font-display)" }}>
            {initial}
          </span>
        )}
        <span className="text-[15px] font-medium tracking-wide text-white/90">{studio.name.trim()}</span>
      </motion.div>

      <div className="max-w-md">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-xs font-medium uppercase tracking-[0.22em] text-[#c9a47a]"
        >
          Studio portal
        </motion.p>
        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 text-4xl leading-[1.12] xl:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Every story, delivered beautifully.
        </motion.h2>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-[15px] leading-relaxed text-white/70"
        >
          {studio.tagline || "Manage your galleries, share them with clients, and keep every delivery in one place."}
        </motion.p>

        <ul className="mt-8 flex flex-col gap-3">
          {POINTS.map((point, i) => (
            <motion.li
              key={point}
              initial={reduce ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.34 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 text-sm text-white/80"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2f5d50]/70 ring-1 ring-white/15">
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="white" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
              </span>
              {point}
            </motion.li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
