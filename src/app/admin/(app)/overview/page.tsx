"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
import type { Overview } from "@/lib/admin-overview";
import { GALLERY_CATEGORIES } from "@/lib/constants";
import { formatBytes, timeAgo } from "@/lib/overview-math";
import { StatusBadge } from "@/components/StatusBadge";
import { ActivityChart, HBars, StatusBar, VIEWS_COLOR } from "./charts";

const RANGES = [7, 30, 90] as const;
const CARD = "rounded-[10px] border border-[#e3e0d8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]";

export default function OverviewPage() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api.get<Overview>(`/api/admin/overview?days=${days}`));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't load the overview");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1d1c1a]">Overview</h1>
          <p className="mt-1 text-sm text-[#6f6b63]">How your galleries are doing, and what needs you next.</p>
        </div>
        <div className="flex items-center gap-3">
          <div role="radiogroup" aria-label="Date range" className="flex rounded-lg border border-[#e3e0d8] bg-white p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                role="radio"
                aria-checked={days === r}
                onClick={() => {
                  if (r === days) return;
                  setLoading(true);
                  setDays(r);
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  days === r ? "bg-[#1d1c1a] text-white" : "text-[#6f6b63] hover:bg-[#f0eee9] hover:text-[#1d1c1a]"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
          <Link
            href="/admin/galleries/new"
            className="inline-flex items-center rounded-lg border border-[#2f5d50] bg-[#2f5d50] px-3.5 py-2 text-sm font-medium text-white transition hover:brightness-110"
          >
            + New Gallery
          </Link>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg border border-[#b3261e]/20 bg-[#b3261e]/5 px-3 py-2 text-sm text-[#b3261e]">{error}</p>}

      {!data ? (
        <div className={`${CARD} px-4 py-16 text-center text-sm text-[#6f6b63]`}>{error ? "Try refreshing the page." : "Loading your overview…"}</div>
      ) : (
        <div className={`flex flex-col gap-5 transition-opacity ${loading ? "opacity-70" : ""}`}>
          <KpiRow data={data} days={days} />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <Section title="Activity" subtitle={`Views and downloads per day, last ${days} days`}>
              <ActivityChart data={data.daily} days={days} loading={loading} />
            </Section>
            <Section title="Needs your attention" subtitle={data.attention.length ? `${data.attention.length} item${data.attention.length === 1 ? "" : "s"}` : undefined}>
              <AttentionList items={data.attention} />
            </Section>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]">
            <Section title="Galleries by status" subtitle={`${data.kpis.totalGalleries} total`}>
              <StatusBar counts={data.byStatus} />
              <div className="mt-5 flex gap-6 border-t border-[#ece9e2] pt-4 text-sm">
                <span className="text-[#6f6b63]">
                  Public <strong className="ml-1 font-semibold tabular-nums text-[#1d1c1a]">{data.byVisibility.public}</strong>
                </span>
                <span className="text-[#6f6b63]">
                  Private <strong className="ml-1 font-semibold tabular-nums text-[#1d1c1a]">{data.byVisibility.private}</strong>
                </span>
              </div>
            </Section>
            <Section id="categories" title="Galleries by category" subtitle="Open a category to see and re-file its galleries">
              <CategoryList categories={data.categories} days={days} onChanged={load} />
            </Section>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Section title="Most viewed" subtitle={`Last ${days} days`}>
              {data.topGalleries.length === 0 ? (
                <Empty>No gallery has been viewed in this period.</Empty>
              ) : (
                <HBars
                  valueLabel="views"
                  rows={data.topGalleries.map((g) => ({
                    key: g.id,
                    value: g.views,
                    label: (
                      <Link href={`/admin/dashboard?gallery=${g.id}`} className="hover:underline">
                        {g.clientName}
                      </Link>
                    ),
                  }))}
                />
              )}
            </Section>
            <Section title="Recent activity">
              <RecentList items={data.recent} />
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, subtitle, id, children }: { title: string; subtitle?: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`${CARD} min-w-0 scroll-mt-6 p-5`}>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[#1d1c1a]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-[#6f6b63]">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-[#f6f5f2] px-4 py-6 text-center text-sm text-[#6f6b63]">{children}</p>;
}

function KpiRow({ data, days }: { data: Overview; days: number }) {
  const k = data.kpis;
  const inProgress = data.byStatus.draft + data.byStatus.ready;
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Tile label={`Views · ${days}d`} value={k.views.toLocaleString()} foot={<Delta change={k.viewsChange} days={days} />} />
      <Tile label={`Downloads · ${days}d`} value={k.downloads.toLocaleString()} foot={<Delta change={k.downloadsChange} days={days} />} />
      <Tile
        label="Active galleries"
        value={k.activeGalleries.toLocaleString()}
        foot={`${data.byStatus.delivered} delivered · ${inProgress} in progress`}
      />
      <Tile label="Storage used" value={formatBytes(k.storageBytes)} foot={`${k.mediaCount.toLocaleString()} files · ${formatBytes(k.originalBytes)} originals`} />
    </div>
  );
}

function Tile({ label, value, foot }: { label: string; value: string; foot: React.ReactNode }) {
  return (
    <div className={`${CARD} min-w-0 p-4`}>
      <p className="text-sm text-[#6f6b63]">{label}</p>
      <p className="mt-1.5 text-3xl font-semibold tracking-tight text-[#1d1c1a]">{value}</p>
      <p className="mt-1.5 text-xs text-[#6f6b63]">{foot}</p>
    </div>
  );
}

function Delta({ change, days }: { change: number | null; days: number }) {
  if (change === null) return <>No activity in the previous {days} days</>;
  if (change === 0) return <>Same as the previous {days} days</>;
  const up = change > 0;
  return (
    <span className={`inline-flex items-center gap-1 font-medium ${up ? "text-[#1f7a4d]" : "text-[#b3261e]"}`}>
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
        <path d={up ? "M6 10V2M2.5 5.5 6 2l3.5 3.5" : "M6 2v8M2.5 6.5 6 10l3.5-3.5"} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {Math.abs(change)}%<span className="font-normal text-[#6f6b63]"> vs previous {days} days</span>
    </span>
  );
}

const TONE = {
  critical: { color: "#b3261e", label: "Critical" },
  warn: { color: "#9a6700", label: "Heads up" },
  info: { color: "#1f5f99", label: "Good to know" },
} as const;

function AttentionList({ items }: { items: Overview["attention"] }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-[#1f7a4d]/8 px-4 py-5 text-sm text-[#1f7a4d]">
        <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth={1.6} />
          <path d="m6.5 10.2 2.3 2.3 4.7-4.9" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        You&apos;re all caught up — nothing needs your attention.
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-[#ece9e2]">
      {items.map((item) => {
        const tone = TONE[item.tone];
        const body = (
          <>
            <span className="mt-0.5 shrink-0" style={{ color: tone.color }} title={tone.label}>
              <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
                {item.tone === "info" ? (
                  <>
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth={1.6} />
                    <path d="M10 9v4.5M10 6.6v.1" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <path d="M10 3 18 16.5H2L10 3Z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
                    <path d="M10 8.5v3.4M10 14.2v.1" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
                  </>
                )}
              </svg>
              <span className="sr-only">{tone.label}: </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-[#1d1c1a]">{item.title}</span>
              <span className="mt-0.5 block truncate text-xs text-[#6f6b63]">{item.detail}</span>
            </span>
            <svg viewBox="0 0 20 20" className="mt-1 h-4 w-4 shrink-0 text-[#a8a59d]" fill="none" aria-hidden="true">
              <path d="m8 5 5 5-5 5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        );
        const cls = "flex items-start gap-3 rounded-lg px-2 py-3 transition hover:bg-[#f6f5f2]";
        return (
          <li key={item.key}>
            {item.href.startsWith("#") ? (
              <a href={item.href} className={cls}>
                {body}
              </a>
            ) : (
              <Link href={item.href} className={cls}>
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function CategoryList({ categories, days, onChanged }: { categories: Overview["categories"]; days: number; onChanged: () => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const max = Math.max(1, ...categories.map((c) => c.total));

  async function recategorize(id: number, category: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.patch(`/api/galleries/${id}`, { category: category || null });
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't change the category");
    } finally {
      setBusyId(null);
    }
  }

  if (categories.length === 0) return <Empty>No galleries yet — create your first one to see it organised here.</Empty>;

  return (
    <div>
      {error && <p className="mb-3 text-sm text-[#b3261e]">{error}</p>}
      <ul className="flex flex-col divide-y divide-[#ece9e2]">
        {categories.map((c) => {
          const key = c.name ?? "__none";
          const isOpen = open[key] ?? c.name === null;
          const summary = Object.entries(c.byStatus)
            .map(([status, n]) => `${n} ${status}`)
            .join(" · ");
          return (
            <li key={key} className="py-3 first:pt-0 last:pb-0">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen((o) => ({ ...o, [key]: !isOpen }))}
                className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-[#f6f5f2]"
              >
                <svg viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 text-[#a8a59d] transition-transform ${isOpen ? "rotate-90" : ""}`} fill="none" aria-hidden="true">
                  <path d="m8 5 5 5-5 5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={`truncate text-sm font-medium capitalize ${c.name ? "text-[#1d1c1a]" : "text-[#6f6b63]"}`}>
                      {c.name ?? "No category"}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-[#6f6b63]">
                      <strong className="text-sm font-semibold text-[#1d1c1a]">{c.total}</strong> galler{c.total === 1 ? "y" : "ies"}
                    </span>
                  </span>
                  <span className="mt-1.5 block h-2 rounded bg-[#f0eee9]">
                    <span
                      className="block h-2 rounded-r rounded-l-[1px]"
                      style={{ width: `${Math.max(3, (c.total / max) * 100)}%`, backgroundColor: c.name ? VIEWS_COLOR : "#a8a59d" }}
                    />
                  </span>
                  <span className="mt-1.5 block text-xs text-[#6f6b63]">
                    {summary} · {c.media} file{c.media === 1 ? "" : "s"} · {c.views} view{c.views === 1 ? "" : "s"} ({days}d)
                  </span>
                </span>
              </button>

              {isOpen && (
                <ul className="mt-2 flex flex-col gap-1.5 pl-7">
                  {c.galleries.map((g) => (
                    <li key={g.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-[#ece9e2] bg-[#fbfaf8] px-3 py-2">
                      <Link href={`/admin/dashboard?gallery=${g.id}`} className="min-w-0 flex-1 truncate text-sm font-medium text-[#1d1c1a] hover:underline">
                        {g.clientName}
                      </Link>
                      <StatusBadge status={g.status} />
                      <span className="text-xs capitalize text-[#6f6b63]">{g.visibility}</span>
                      <span className="text-xs tabular-nums text-[#6f6b63]">
                        {g.mediaCount} file{g.mediaCount === 1 ? "" : "s"}
                      </span>
                      <label className="sr-only" htmlFor={`cat-${g.id}`}>
                        Category for {g.clientName}
                      </label>
                      <select
                        id={`cat-${g.id}`}
                        value={g.category?.trim().toLowerCase() ?? ""}
                        disabled={busyId === g.id}
                        onChange={(e) => recategorize(g.id, e.target.value)}
                        className="rounded-md border border-[#e3e0d8] bg-white px-2 py-1 text-xs capitalize text-[#1d1c1a] focus:border-[#2f5d50] focus:outline-none focus:ring-1 focus:ring-[#2f5d50] disabled:opacity-50"
                      >
                        <option value="">No category</option>
                        {GALLERY_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        {g.category && !GALLERY_CATEGORIES.includes(g.category.trim().toLowerCase() as (typeof GALLERY_CATEGORIES)[number]) && (
                          <option value={g.category.trim().toLowerCase()}>{g.category}</option>
                        )}
                      </select>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const EVENT_ICON = {
  viewed: "M2.5 10s2.6-5 7.5-5 7.5 5 7.5 5-2.6 5-7.5 5-7.5-5-7.5-5Zm7.5 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  downloaded: "M10 3.5v9m0 0-3.5-3.5M10 12.5 13.5 9M4 15.5h12",
  comment: "M4 5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5v6a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3h0A1.5 1.5 0 0 1 4 11.5v-6Z",
} as const;

function RecentList({ items }: { items: Overview["recent"] }) {
  if (items.length === 0) return <Empty>Nothing yet — views, downloads and comments will show up here.</Empty>;

  return (
    <ul className="flex flex-col divide-y divide-[#ece9e2]">
      {items.map((e, i) => (
        <li key={`${e.at}-${i}`}>
          <Link href={`/admin/dashboard?gallery=${e.galleryId}`} className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition hover:bg-[#f6f5f2]">
            <svg viewBox="0 0 20 20" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#6f6b63]" fill="none" aria-hidden="true">
              <path d={EVENT_ICON[e.type]} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-[#1d1c1a]">
                {e.type === "comment" ? (
                  <>
                    New comment on <strong className="font-medium">{e.galleryName}</strong>
                  </>
                ) : (
                  <>
                    {e.type === "viewed" ? "Viewed" : "Downloaded from"} <strong className="font-medium">{e.galleryName}</strong>
                  </>
                )}
              </span>
              {e.text && <span className="mt-0.5 block truncate text-xs text-[#6f6b63]">{e.text}</span>}
            </span>
            <span className="shrink-0 text-xs text-[#6f6b63]">{timeAgo(e.at)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
