"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "../LogoutButton";

const LINKS = [
  { href: "/admin/dashboard", label: "Galleries" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/vault", label: "Vault" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminTopNav({ studioName, logoUrl }: { studioName: string; logoUrl: string | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-[#e3e0d8] bg-white">
      <div className="flex items-center gap-5 px-4 py-3 sm:px-6">
        <Link
          href="/admin/dashboard"
          className="flex min-w-0 items-center gap-2 truncate font-bold tracking-tight text-[#1d1c1a]"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />
          ) : null}
          <span className="truncate">{studioName} · Delivery</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-1 sm:flex">
          {LINKS.map((l) => {
            const active = pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
                  active ? "bg-[#f0eee9] text-[#1d1c1a]" : "text-[#6f6b63] hover:bg-[#f0eee9] hover:text-[#1d1c1a]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="hidden sm:block">
          <LogoutButton />
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#1d1c1a] hover:bg-[#f0eee9] sm:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 6l12 12M18 6L6 18" stroke="currentColor" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-[#e3e0d8] px-4 py-3 sm:hidden">
          {LINKS.map((l) => {
            const active = pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-[#f0eee9] text-[#1d1c1a]" : "text-[#6f6b63] hover:bg-[#f0eee9] hover:text-[#1d1c1a]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <div className="mt-1 border-t border-[#e3e0d8] pt-2">
            <LogoutButton />
          </div>
        </nav>
      )}
    </header>
  );
}
