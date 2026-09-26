"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { StatusBadge } from "@/components/StatusBadge";

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
  const [filter, setFilter] = useState("");
  const [galleries, setGalleries] = useState<Gallery[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>
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

      {error && <p className="mb-3 text-sm text-[#b3261e]">{error}</p>}

      <div className="rounded-[10px] border border-[#e3e0d8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
        {galleries === null ? (
          <p className="px-4 py-10 text-center text-sm text-[#6f6b63]">Loading…</p>
        ) : galleries.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[#6f6b63]">No galleries yet — create your first one.</p>
        ) : (
          <div className="overflow-x-auto">
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
                {galleries.map((g) => (
                  <GalleryRow key={g.id} gallery={g} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function GalleryRow({ gallery: g }: { gallery: Gallery }) {
  return (
    <tr className="cursor-pointer border-b border-[#e3e0d8] last:border-0 hover:bg-[#f0eee9]">
      <td className="px-3 py-2.5">
        <Link href={`/admin/galleries/${g.id}`} className="block">
          <strong className="font-semibold text-[#1d1c1a]">{g.clientName}</strong>
          <div className="mt-0.5 text-xs text-[#6f6b63]">
            /gallery/{g.slug} · <span className="capitalize">{g.visibility}</span> ·{" "}
            {g.category ? <span className="capitalize">{g.category}</span> : "Uncategorized"}
          </div>
        </Link>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={g.status} />
          {g.pendingRenditions > 0 && (
            <StatusBadge status="processing" label={`${g.pendingRenditions} processing`} />
          )}
          {g.newComments > 0 && (
            <StatusBadge status="ready" label={`${g.newComments} new comment${g.newComments === 1 ? "" : "s"}`} />
          )}
          {isExpired(g.expiryDate) && <StatusBadge status="expired" />}
        </div>
      </td>
      <td className="px-3 py-2.5 text-[#1d1c1a]">{g._count.media}</td>
      <td className="px-3 py-2.5 text-[#1d1c1a]">{formatDay(g.expiryDate)}</td>
      <td className="px-3 py-2.5 text-[#1d1c1a]">{formatDateTime(g.createdAt)}</td>
    </tr>
  );
}
