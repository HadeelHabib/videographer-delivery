"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "../LogoutButton";

const LINKS = [
  {
    href: "/admin/dashboard",
    label: "Galleries",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v4A1.5 1.5 0 0 1 9.5 11h-4A1.5 1.5 0 0 1 4 9.5v-4Zm9 0A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v4A1.5 1.5 0 0 1 18.5 11h-4a1.5 1.5 0 0 1-1.5-1.5v-4ZM4 14.5A1.5 1.5 0 0 1 5.5 13h4a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 9.5 20h-4A1.5 1.5 0 0 1 4 18.5v-4Zm9 0a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-4Z"
      />
    ),
  },
  {
    href: "/admin/comments",
    label: "Comments",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 4v-4H5.5A1.5 1.5 0 0 1 4 14.5v-9Z"
      />
    ),
  },
  {
    href: "/admin/vault",
    label: "Vault",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z"
      />
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.6}
          d="M10.5 4.5h3l.5 2.2a6.9 6.9 0 0 1 1.8 1l2.1-.8 1.5 2.6-1.7 1.5a6.9 6.9 0 0 1 0 2.1l1.7 1.5-1.5 2.6-2.1-.8a6.9 6.9 0 0 1-1.8 1l-.5 2.2h-3l-.5-2.2a6.9 6.9 0 0 1-1.8-1l-2.1.8-1.5-2.6 1.7-1.5a6.9 6.9 0 0 1 0-2.1L4.6 9.5l1.5-2.6 2.1.8a6.9 6.9 0 0 1 1.8-1l.5-2.2Z"
        />
        <circle cx="12" cy="12" r="2.5" strokeWidth={1.6} />
      </>
    ),
  },
];

export function AdminSidebar({ studioName, logoUrl }: { studioName: string; logoUrl: string | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-0.5">
      {LINKS.map((l) => {
        const active = pathname?.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-[#f0eee9] text-[#1d1c1a]" : "text-[#6f6b63] hover:bg-[#f0eee9] hover:text-[#1d1c1a]"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5 shrink-0" aria-hidden="true">
              {l.icon}
            </svg>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[#e3e0d8] bg-white px-4 py-5 md:flex">
        <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-2 truncate px-1 font-bold tracking-tight text-[#1d1c1a]">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />
          ) : null}
          <span className="truncate">{studioName}</span>
        </Link>

        <div className="mt-6 flex-1">{nav()}</div>

        <div className="border-t border-[#e3e0d8] pt-3">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#e3e0d8] bg-white px-4 py-3 md:hidden">
        <Link href="/admin/dashboard" className="flex min-w-0 flex-1 items-center gap-2 truncate font-bold tracking-tight text-[#1d1c1a]">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />
          ) : null}
          <span className="truncate">{studioName}</span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#1d1c1a] hover:bg-[#f0eee9]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" />
          </svg>
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white px-4 py-5 shadow-xl">
            <div className="flex items-center justify-between px-1">
              <span className="truncate font-bold tracking-tight text-[#1d1c1a]">{studioName}</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#1d1c1a] hover:bg-[#f0eee9]"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 6l12 12M18 6L6 18" stroke="currentColor" />
                </svg>
              </button>
            </div>
            <div className="mt-6 flex-1">{nav(() => setMenuOpen(false))}</div>
            <div className="border-t border-[#e3e0d8] pt-3">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
