"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

// The About portrait: the photo is pushed up and to the left so it breaks out of the dark box
// behind it, with a thin outline frame and a slow scroll parallax for depth.
export function AboutPortrait({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const photoShift = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [22, -22]);
  const frameShift = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-10, 10]);

  return (
    <div ref={ref} className="relative aspect-[4/5] w-full">
      {/* The box the photo escapes from */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950">
        <span
          className="absolute bottom-6 right-6 select-none text-8xl leading-none text-white/[0.07] sm:text-9xl"
          style={{ fontFamily: "var(--font-display)" }}
          aria-hidden="true"
        >
          {name.trim().charAt(0).toUpperCase()}
        </span>
        <p className="absolute bottom-6 left-6 text-[11px] font-medium uppercase tracking-[0.3em] text-white/45">Behind the lens</p>
      </div>

      {/* Outline frame, offset the other way */}
      <motion.div
        aria-hidden="true"
        style={{ y: frameShift }}
        className="absolute bottom-[3%] left-[10%] right-[3%] top-[8%] rounded-2xl border border-white/15"
      />

      {/* The photo, overflowing the top-left corner */}
      <motion.div
        style={{ y: photoShift }}
        className="absolute -left-[4%] -top-[3%] h-[91%] w-[86%] lg:-left-[9%] lg:-top-[6%] lg:h-[92%] lg:w-[84%]"
      >
        <motion.div
          initial={reduce ? false : { opacity: 0, x: 26, y: 26, rotate: 1 }}
          whileInView={{ opacity: 1, x: 0, y: 0, rotate: -2 }}
          viewport={{ once: true, margin: "-80px" }}
          whileHover={reduce ? undefined : { y: -6, rotate: -1, transition: { type: "spring", stiffness: 260, damping: 20 } }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-full w-full overflow-hidden rounded-2xl shadow-[0_40px_70px_-25px_rgba(0,0,0,0.65)] ring-1 ring-white/15"
        >
          <Image
            src="/ali-portfolio.jpg"
            alt={`${name}, photographing a reflection in a car side mirror`}
            width={1080}
            height={1738}
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="h-full w-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        </motion.div>
      </motion.div>
    </div>
  );
}
