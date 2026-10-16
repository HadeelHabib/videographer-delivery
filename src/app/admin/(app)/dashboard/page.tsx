"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { StatusBadge } from "@/components/StatusBadge";
import { GalleryDetail } from "../galleries/[id]/GalleryDetail";
import { normalizeCategory } from "@/lib/overview-math";

type Gallery = {
  id: number;
  clientName: string;
  slug: string;
  status: string;
  visibility: string;
  category: string | null;
  expiryDate: string | null;
  createdAt: string;
  pendingRenditions: number;
  newComments: number;
  _count: { media: number };
};

const FILTERS = [
  { value: "", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

function isExpired(expiryDate: string | null) {
  return !!expiryDate && Date.now() >= new Date(expiryDate).getTime();
}

function formatDay(d: string | null) {
  return d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("gallery");

  const [filter, setFilter] = useState("");
  const [galleries, setGalleries] = useState<Gallery[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null); // null = all, "" = uncategorized
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" jumps to search from anywhere on the page, like most dashboards.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // "" (Active) and "all" both need the full list — "" then hides archived
  // client-side, since the API only knows how to filter to one exact status.
  const load = useCallback(async () => {
    try {
      const qs = filter && filter !== "all" ? `?status=${filter}` : "";
      const data = await api.get<{ galleries: Gallery[] }>(`/api/galleries${qs}`);
      const filtered = filter === "" ? data.galleries.filter((g) => g.status !== "archived") : data.galleries;
      setGalleries(filtered);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load galleries");
    }
  }, [filter]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  function selectGallery(id: number) {
    router.push(`/admin/dashboard?gallery=${id}`);
  }

  function clearSelection() {
    router.push("/admin/dashboard");
  }

  const hasSelection = Boolean(selectedId);

  const needle = query.trim().toLowerCase();
  const categoryOptions = [...new Set((galleries ?? []).map((g) => normalizeCategory(g.category) ?? ""))].sort((a, b) =>
    a === "" ? 1 : b === "" ? -1 : a.localeCompare(b),
  );
  const shown = (galleries ?? []).filter(
    (g) =>
      (categoryFilter === null || (normalizeCategory(g.category) ?? "") === categoryFilter) &&
      (!needle || [g.clientName, g.slug, g.category ?? ""].some((v) => v.toLowerCase().includes(needle))),
  );

  return (
    <div className={hasSelection ? "lg:flex lg:items-start lg:gap-6" : undefined}>
      {/* Gallery list — a fixed-width rail once a gallery is open on large
          screens, full width and hidden behind the detail view on small ones. */}
      <div className={hasSelection ? "hidden lg:block lg:w-[360px] lg:shrink-0" : undefined}>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1d1c1a]">Galleries</h1>
          <div className="flex-1" />
          <Link
            href="/admin/galleries/new"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2f5d50] bg-[#2f5d50] px-3.5 py-2 text-sm font-medium text-white transition hover:brightness-110"
          >
            + New Gallery
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-3 py-1 text-sm ${
                filter === f.value
                  ? "border-[#1d1c1a] bg-[#1d1c1a] text-white"
                  : "border-[#e3e0d8] bg-white text-[#6f6b63] hover:bg-[#f0eee9]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {categoryOptions.length > 1 && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by category">
            <span className="mr-1 text-xs font-medium uppercase tracking-wide text-[#6f6b63]">Category</span>
            {[null, ...categoryOptions].map((value) => {
              const active = categoryFilter === value;
              return (
                <button
                  key={String(value)}
                  onClick={() => setCategoryFilter(value)}
                  aria-pressed={active}
                  className={`rounded-full border px-2.5 py-0.5 text-xs capitalize ${
                    active ? "border-[#2f5d50] bg-[#2f5d50] text-white" : "border-[#e3e0d8] bg-white text-[#6f6b63] hover:bg-[#f0eee9]"
                  }`}
                >
                  {value === null ? "All" : value === "" ? "No category" : value}
                </button>
              );
            })}
          </div>
        )}

        <div className="relative mb-4">
          <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f6b63]" aria-hidden="true">
            <path stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" d="m20 20-3.5-3.5M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
          </svg>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by client, link or category…   ( / )"
            aria-label="Search galleries"
            className="w-full rounded-lg border border-[#e3e0d8] bg-white py-2 pl-9 pr-3 text-sm text-[#1d1c1a] placeholder:text-[#9a968e] focus:border-[#2f5d50] focus:outline-none focus:ring-1 focus:ring-[#2f5d50]"
          />
        </div>

        {error && <p className="mb-3 text-sm text-[#b3261e]">{error}</p>}

        {galleries === null ? (
          <div className="rounded-[10px] border border-[#e3e0d8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
            <p className="px-4 py-10 text-center text-sm text-[#6f6b63]">Loading…</p>
          </div>
        ) : galleries.length === 0 ? (
          <div className="rounded-[10px] border border-[#e3e0d8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
            <p className="px-4 py-10 text-center text-sm text-[#6f6b63]">No galleries yet — create your first one.</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-[10px] border border-[#e3e0d8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
            <p className="px-4 py-10 text-center text-sm text-[#6f6b63]">No galleries match “{query.trim()}”.</p>
          </div>
        ) : hasSelection ? (
          // Compact list when the detail panel is open (list rail)
          <div className="flex flex-col gap-2">
            {shown.map((g) => (
              <GalleryListItem
                key={g.id}
                gallery={g}
                active={String(g.id) === selectedId}
                onClick={() => selectGallery(g.id)}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Card list — small screens, where a 5-column table can't fit */}
            <div className="flex flex-col gap-3 sm:hidden">
              {shown.map((g) => (
                <GalleryCard key={g.id} gallery={g} onClick={() => selectGallery(g.id)} />
              ))}
            </div>

            {/* Table — sm and up */}
            <div className="hidden overflow-x-auto rounded-[10px] border border-[#e3e0d8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] sm:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {["Client", "Status", "Files", "Expires", "Created"].map((h) => (
                      <th
                        key={h}
                        className="border-b border-[#e3e0d8] px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[#6f6b63]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((g) => (
                    <GalleryRow key={g.id} gallery={g} onClick={() => selectGallery(g.id)} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Detail section — the selected gallery's content, inline in its own
          panel instead of navigating to a separate page. */}
      {hasSelection && (
        <div className="mt-6 min-w-0 flex-1 rounded-[10px] border border-[#e3e0d8] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] lg:mt-0">
          <GalleryDetail galleryId={Number(selectedId)} onBack={clearSelection} />
        </div>
      )}
    </div>
  );
}

function GalleryBadges({ gallery: g }: { gallery: Gallery }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusBadge status={g.status} />
      {g.pendingRenditions > 0 && <StatusBadge status="processing" label={`${g.pendingRenditions} processing`} />}
      {g.newComments > 0 && (
        <StatusBadge status="ready" label={`${g.newComments} new comment${g.newComments === 1 ? "" : "s"}`} />
      )}
      {isExpired(g.expiryDate) && <StatusBadge status="expired" />}
    </div>
  );
}

function GalleryRow({ gallery: g, onClick }: { gallery: Gallery; onClick: () => void }) {
  return (
    <tr
      onClick={onClick}
      className="cursor-pointer border-b border-[#e3e0d8] last:border-0 hover:bg-[#f0eee9]"
    >
      <td className="px-3 py-2.5">
        <strong className="font-semibold text-[#1d1c1a]">{g.clientName}</strong>
        <div className="mt-0.5 text-xs text-[#6f6b63]">
          /gallery/{g.slug} · <span className="capitalize">{g.visibility}</span> ·{" "}
          {g.category ? <span className="capitalize">{g.category}</span> : "Uncategorized"}
        </div>
      </td>
      <td className="px-3 py-2.5">
        <GalleryBadges gallery={g} />
      </td>
      <td className="px-3 py-2.5 text-[#1d1c1a]">{g._count.media}</td>
      <td className="px-3 py-2.5 text-[#1d1c1a]">{formatDay(g.expiryDate)}</td>
      <td className="px-3 py-2.5 text-[#1d1c1a]">{formatDateTime(g.createdAt)}</td>
    </tr>
  );
}

function GalleryCard({ gallery: g, onClick }: { gallery: Gallery; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="block rounded-[10px] border border-[#e3e0d8] bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] active:bg-[#f0eee9]"
    >
      <strong className="font-semibold text-[#1d1c1a]">{g.clientName}</strong>
      <div className="mt-0.5 text-xs text-[#6f6b63]">
        /gallery/{g.slug} · <span className="capitalize">{g.visibility}</span> ·{" "}
        {g.category ? <span className="capitalize">{g.category}</span> : "Uncategorized"}
      </div>

      <div className="mt-2.5">
        <GalleryBadges gallery={g} />
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-[#e3e0d8] pt-2.5 text-xs text-[#6f6b63]">
        <span>
          <span className="font-medium text-[#1d1c1a]">{g._count.media}</span> files
        </span>
        <span>Expires {formatDay(g.expiryDate)}</span>
        <span className="ml-auto">{formatDateTime(g.createdAt)}</span>
      </div>
    </button>
  );
}

function GalleryListItem({ gallery: g, active, onClick }: { gallery: Gallery; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-2.5 text-left transition ${
        active ? "border-[#2f5d50] bg-[#2f5d50]/5" : "border-[#e3e0d8] bg-white hover:bg-[#f0eee9]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <strong className="truncate text-sm font-semibold text-[#1d1c1a]">{g.clientName}</strong>
        <StatusBadge status={g.status} />
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-[#6f6b63]">
        <span>{g._count.media} files</span>
        {(g.pendingRenditions > 0 || g.newComments > 0) && (
          <span className="flex items-center gap-1">
            {g.pendingRenditions > 0 && <StatusBadge status="processing" label={`${g.pendingRenditions}`} />}
            {g.newComments > 0 && <StatusBadge status="ready" label={`${g.newComments}`} />}
          </span>
        )}
      </div>
    </button>
  );
}
