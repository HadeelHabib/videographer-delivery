"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { GALLERY_CATEGORIES } from "@/lib/constants";

export default function NewGalleryPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [password, setPassword] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [category, setCategory] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [allowPublicDownload, setAllowPublicDownload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { gallery } = await api.post<{ gallery: { id: number } }>("/api/galleries", {
        clientName,
        password: password || undefined,
        visibility,
        category: category || undefined,
        expiryDate: expiryDate || undefined,
        allowPublicDownload,
      });
      router.push(`/admin/galleries/${gallery.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-zinc-900">New gallery</h1>
      <p className="mt-1 text-sm text-zinc-500">Set up a delivery for a new client.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Client name</label>
          <input
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Smith Wedding"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-zinc-700">Visibility</span>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="radio"
                checked={visibility === "private"}
                onChange={() => setVisibility("private")}
              />
              Private (password)
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="radio" checked={visibility === "public"} onChange={() => setVisibility("public")} />
              Public (portfolio)
            </label>
          </div>
        </div>

        {visibility === "private" && (
          <div>
            <label className="block text-sm font-medium text-zinc-700">Gallery password</label>
            <input
              required
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            <p className="mt-1 text-xs text-zinc-400">At least 4 characters.</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          >
            <option value="">None</option>
            {GALLERY_CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Expiry date (optional)</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={allowPublicDownload}
            onChange={(e) => setAllowPublicDownload(e.target.checked)}
          />
          Allow downloads (client can save full-quality files)
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create gallery"}
        </button>
      </form>
    </div>
  );
}
