"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountMenu } from "./AccountMenu";

type Studio = { name: string; logoUrl: string | null };
type User = { name: string | null; email: string | null } | null;

const PAST_HERO_THRESHOLD = 520;

export function SiteHeader({ studio, user }: { studio: Studio; user: User }) {
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > PAST_HERO_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      suppressHydrationWarning
      className={`fixed inset-x-0 top-0 z-40 ease-out ${
        pastHero
          ? "border-b border-black/5"
          : "border-b border-transparent"
      }`}
      style={{
        transitionProperty:
          "background-color, backdrop-filter, border-bottom-color",
        transitionDuration: "500ms",
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        backgroundColor: pastHero
          ? "rgba(250, 250, 248, 0.25)"
          : "transparent",
        backdropFilter: pastHero
          ? "blur(20px) saturate(140%)"
          : "blur(0px) saturate(100%)",
        WebkitBackdropFilter: pastHero
          ? "blur(20px) saturate(140%)"
          : "blur(0px) saturate(100%)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-3">
          {studio.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={studio.logoUrl} alt="" className="h-8 w-auto object-contain" />
          ) : null}
          <span
            className={`text-lg tracking-tight transition-colors duration-500 ${
              pastHero ? "text-zinc-900" : "text-white"
            }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {studio.name}
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm sm:flex">
          <Link
            href="/#services"
            className={`transition-colors duration-500 ${
              pastHero
                ? "text-zinc-600 hover:text-zinc-900"
                : "text-white/75 hover:text-white"
            }`}
          >
            Services
          </Link>
          <Link
            href="/portfolio"
            className={`transition-colors duration-500 ${
              pastHero
                ? "text-zinc-600 hover:text-zinc-900"
                : "text-white/75 hover:text-white"
            }`}
          >
            Work
          </Link>
          <Link
            href="/#about"
            className={`transition-colors duration-500 ${
              pastHero
                ? "text-zinc-600 hover:text-zinc-900"
                : "text-white/75 hover:text-white"
            }`}
          >
            About
          </Link>
          <Link
            href="/#contact"
            className={`rounded-full px-4 py-2 transition duration-500 ${
              pastHero
                ? "bg-zinc-900 text-white hover:bg-zinc-700"
                : "bg-white text-zinc-900 hover:bg-white/90"
            }`}
          >
            Get in touch
          </Link>
          <AccountMenu user={user} light={!pastHero} />
        </nav>
        <div className="flex items-center gap-4 sm:hidden">
          <AccountMenu user={user} light={!pastHero} />
          <Link
            href="/#contact"
            className={`text-sm font-medium transition-colors duration-500 ${
              pastHero ? "text-zinc-900" : "text-white"
            }`}
          >
            Contact
          </Link>
        </div>
      </div>
    </header>
  );
}
