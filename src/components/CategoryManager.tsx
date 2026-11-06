"use client";

import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { MAX_CATEGORY_LENGTH, describeDeletion, validateCategoryName } from "@/lib/categories";
import type { CategoryItem } from "./useCategories";

// Add and remove the categories galleries can be filed under. Used inline on the Settings page
// and inside the "Manage categories" dialog.
export function CategoryManager({
  categories,
  loaded,
  onChanged,
}: {
  categories: CategoryItem[];
  loaded: boolean;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setNotice(null);
    const problem = validateCategoryName(name, categories.map((c) => c.name));
    if (problem) {
      setError(problem);
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { category } = await api.post<{ category: CategoryItem }>("/api/categories", { name });
      setName("");
      setNotice(`Added “${category.name}”.`);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't add that category. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(category: CategoryItem) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { unassigned } = await api.delete<{ unassigned: number }>(`/api/categories/${category.id}`);
      setConfirmingId(null);
      setNotice(
        unassigned > 0
          ? `Deleted “${category.name}”. ${unassigned === 1 ? "1 gallery is" : `${unassigned} galleries are`} now uncategorized.`
          : `Deleted “${category.name}”.`,
      );
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't delete that category. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={add} noValidate>
        <label htmlFor="new-category" className="block text-sm font-medium text-zinc-700">
          New category
        </label>
        <div className="mt-1 flex gap-2">
          <input
            ref={inputRef}
            id="new-category"
            value={name}
            maxLength={MAX_CATEGORY_LENGTH + 10}
            disabled={busy}
            placeholder="e.g. Music video"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "new-category-error" : undefined}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            className={`h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm outline-none transition focus:ring-2 ${
              error ? "border-red-500 focus:ring-red-500/20" : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900/15"
            }`}
          />
          <button
            type="submit"
            disabled={busy}
            className="h-10 shrink-0 cursor-pointer rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60"
          >
            Add
          </button>
        </div>
        <div className="min-h-[20px] pt-1.5 text-[13px]" aria-live="polite">
          {error ? (
            <p id="new-category-error" className="text-red-600">
              {error}
            </p>
          ) : notice ? (
            <p className="text-emerald-700">{notice}</p>
          ) : null}
        </div>
      </form>

      <ul className="mt-2 flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
        {!loaded ? (
          <li className="px-4 py-6 text-center text-sm text-zinc-500">Loading categories…</li>
        ) : categories.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-zinc-500">No categories yet — add your first one above.</li>
        ) : (
          categories.map((c) => (
            <li key={c.id} className="px-4 py-3">
              {confirmingId === c.id ? (
                <div role="alertdialog" aria-label={`Delete ${c.name}`}>
                  <p className="text-sm text-zinc-700">{describeDeletion(c.name, c.galleryCount)}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => remove(c)}
                      className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
                    >
                      {busy ? "Deleting…" : "Delete category"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmingId(null)}
                      className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
                    >
                      Keep it
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium capitalize text-zinc-900">{c.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                    {c.galleryCount} {c.galleryCount === 1 ? "gallery" : "galleries"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingId(c.id);
                      setError(null);
                      setNotice(null);
                    }}
                    aria-label={`Delete category ${c.name}`}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                  >
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4.5 7h15M10 7V5h4v2M7 7l.7 11.2a1.5 1.5 0 0 0 1.5 1.3h5.6a1.5 1.5 0 0 0 1.5-1.3L17 7M10.5 11v5M13.5 11v5" />
                    </svg>
                  </button>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
