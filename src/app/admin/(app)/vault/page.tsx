"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";

type Gallery = {
  id: number;
  clientName: string;
  slug: string;
  archivedAt: string | null;
  _count: { media: number };
};

export default function VaultPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  function refresh() {
    setLoading(true);
    api
      .get<{ galleries: Gallery[] }>("/api/galleries?status=archived")
      .then((data) => setGalleries(data.galleries))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function restore(id: number) {
    setBusyId(id);
    try {
      await api.post(`/api/galleries/${id}/restore`);
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">Vault</h1>
      <p className="mt-1 text-sm text-zinc-500">Delivered galleries moved to cold storage.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-500">Loading...</div>
        ) : galleries.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">Nothing archived yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Media</th>
                <th className="px-4 py-3">Archived</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {galleries.map((g) => (
                <tr key={g.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/galleries/${g.id}`} className="font-medium text-zinc-900 hover:underline">
                      {g.clientName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{g._count.media}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {g.archivedAt ? new Date(g.archivedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => restore(g.id)}
                      disabled={busyId === g.id}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
