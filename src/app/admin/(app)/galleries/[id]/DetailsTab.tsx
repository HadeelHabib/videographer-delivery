"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { GALLERY_CATEGORIES } from "@/lib/constants";
import type { GalleryDetailData } from "./types";

export function DetailsTab({ gallery, onChanged }: { gallery: GalleryDetailData; onChanged: () => void }) {
  const [clientName, setClientName] = useState(gallery.clientName);
  const [visibility, setVisibility] = useState<"private" | "public">(gallery.visibility as "private" | "public");
  const [category, setCategory] = useState(gallery.category ?? "");
  const [expiryDate, setExpiryDate] = useState(gallery.expiryDate ? gallery.expiryDate.slice(0, 10) : "");
  const [allowPublicDownload, setAllowPublicDownload] = useState(gallery.allowPublicDownload);
  const [brandLogoUrl, setBrandLogoUrl] = useState(gallery.brandLogoUrl ?? "");
  const [brandColor, setBrandColor] = useState(gallery.brandColor ?? "");
  const [newPassword, setNewPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.patch(`/api/galleries/${gallery.id}`, {
        clientName,
        visibility,
        category: category || "",
        expiryDate: expiryDate || null,
        allowPublicDownload,
        brandLogoUrl,
        ...(brandColor ? { brandColor } : {}),
        ...(newPassword ? { password: newPassword } : {}),
      });
      setNewPassword("");
      setSaved(true);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-6">
      <div>
        <label className="block text-sm font-medium text-zinc-700">Client name</label>
        <input
          required
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-zinc-700">Visibility</span>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="radio" checked={visibility === "private"} onChange={() => setVisibility("private")} />
            Private (password)
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="radio" checked={visibility === "public"} onChange={() => setVisibility("public")} />
            Public (portfolio)
          </label>
        </div>
      </div>

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
        {visibility === "public" && !category && (
          <p className="mt-1 text-xs text-amber-600">
            Public galleries without a category won&apos;t appear on the portfolio page.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Expiry date</label>
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Brand logo URL</label>
          <input
            value={brandLogoUrl}
            onChange={(e) => setBrandLogoUrl(e.target.value)}
            placeholder="https://…"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Brand color</label>
          <input
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            placeholder="#18181b"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Reset gallery password</label>
        <input
          type="password"
          minLength={4}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Leave blank to keep current password"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Saved.</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
