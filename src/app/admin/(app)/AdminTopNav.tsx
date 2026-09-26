"use client";

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

  return (
    <header className="sticky top-0 z-10 flex items-center gap-5 border-b border-[#e3e0d8] bg-white px-6 py-3">
      <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold tracking-tight text-[#1d1c1a]">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-6 w-6 rounded object-cover" />
        ) : null}
        {studioName} · Delivery
      </Link>
      <nav className="flex gap-1">
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
      <LogoutButton />
    </header>
  );
}
