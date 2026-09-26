"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeroMediaGrid } from "./HeroMediaGrid";

export type HeroSlide = { eyebrow: string; headline: string };

const AUTOPLAY_MS = 6000;

export function HeroSlider({ slides, images }: { slides: HeroSlide[]; images: string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  function next() {
    setIndex((i) => (i + 1) % slides.length);
  }
  function prev() {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(next, AUTOPLAY_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, slides.length]);

  return (
    <section
      className="relative flex min-h-[85vh] items-end overflow-hidden bg-zinc-950"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured work"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Background */}
      <HeroMediaGrid images={images} />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-40 sm:px-10">
        {/* Slide copy */}
        <div className="relative min-h-[140px] sm:min-h-[180px]">
          {slides.map((slide, i) => (
            <div
              key={i}
              aria-hidden={i !== index}
              className={`transition-all duration-700 ease-out ${
                i === index
                  ? "relative opacity-100 translate-y-0"
                  : "pointer-events-none absolute inset-0 opacity-0 translate-y-3"
              }`}
            >
              <p
                className="text-xs font-medium uppercase tracking-[0.3em] text-white/70"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
              >
                {slide.eyebrow}
              </p>
              <h1
                className="mt-4 max-w-2xl text-4xl leading-tight text-white sm:text-6xl"
                style={{ fontFamily: "var(--font-display)", textShadow: "0 4px 24px rgba(0,0,0,0.65)" }}
              >
                {slide.headline}
              </h1>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/portfolio"
            className="rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition hover:bg-white/90"
          >
            View our work
          </Link>
          <Link
            href="#contact"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Get in touch
          </Link>
        </div>

        {/* Slide controls */}
        {slides.length > 1 && (
          <div className="mt-12 flex items-center gap-5">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" stroke="currentColor" />
              </svg>
            </button>

            <div role="tablist" aria-label="Slides" className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Go to slide ${i + 1} of ${slides.length}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? "w-8 bg-white" : "w-1.5 bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" stroke="currentColor" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
