"use client";

import { useRef, useState } from "react";
import { niceCeil, type DailyPoint } from "@/lib/overview-math";

// Categorical slots 1-2 of the validated reference palette. Views and downloads
// are the same unit (events), so they share one axis — never a dual-axis chart.
export const VIEWS_COLOR = "#2a78d6";
export const DOWNLOADS_COLOR = "#eb6834";

const GRID = "#ece9e2";
const AXIS_TEXT = "#6f6b63";

const W = 640;
const H = 230;
const M = { top: 12, right: 14, bottom: 26, left: 34 };

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

function LineKey({ color }: { color: string }) {
  return <span className="inline-block h-0.5 w-4 rounded-full align-middle" style={{ backgroundColor: color }} />;
}

export function ActivityChart({ data, days, loading }: { data: DailyPoint[]; days: number; loading: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const totalViews = data.reduce((s, p) => s + p.views, 0);
  const totalDownloads = data.reduce((s, p) => s + p.downloads, 0);
  const yMax = niceCeil(Math.max(0, ...data.map((p) => Math.max(p.views, p.downloads))));
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const x = (i: number) => M.left + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => M.top + plotH - (v / yMax) * plotH;
  const path = (key: "views" | "downloads") => data.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");

  const ticks = [0, 1, 2, 3, 4].map((t) => (yMax / 4) * t);
  const labelIdx = data.length <= 5 ? data.map((_, i) => i) : [0, 1, 2, 3, 4].map((t) => Math.round((t / 4) * (data.length - 1)));
  const last = data.length - 1;
  const empty = totalViews === 0 && totalDownloads === 0;

  function indexFromPointer(clientX: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || data.length === 0) return null;
    const svgX = ((clientX - rect.left) / rect.width) * W;
    const ratio = Math.min(1, Math.max(0, (svgX - M.left) / plotW));
    return Math.round(ratio * (data.length - 1));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") setHover((h) => Math.min(last, (h ?? -1) + 1));
    else if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? last + 1) - 1));
    else if (e.key === "Escape") setHover(null);
    else return;
    e.preventDefault();
  }

  const point = hover !== null ? data[hover] : null;

  return (
    <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[#1d1c1a]">
          <span className="inline-flex items-center gap-2">
            <LineKey color={VIEWS_COLOR} />
            <span className="text-[#6f6b63]">Views</span> <strong className="font-semibold">{totalViews.toLocaleString()}</strong>
          </span>
          <span className="inline-flex items-center gap-2">
            <LineKey color={DOWNLOADS_COLOR} />
            <span className="text-[#6f6b63]">Downloads</span> <strong className="font-semibold">{totalDownloads.toLocaleString()}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-pressed={showTable}
          className="rounded-md px-2 py-1 text-xs font-medium text-[#6f6b63] hover:bg-[#f0eee9] hover:text-[#1d1c1a]"
        >
          {showTable ? "Show chart" : "Table view"}
        </button>
      </div>

      {showTable ? (
        <div className="mt-3 max-h-[260px] overflow-auto rounded-lg border border-[#e3e0d8]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#f6f5f2] text-left text-xs uppercase tracking-wide text-[#6f6b63]">
              <tr>
                <th className="px-3 py-2 font-semibold">Day</th>
                <th className="px-3 py-2 text-right font-semibold">Views</th>
                <th className="px-3 py-2 text-right font-semibold">Downloads</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[...data].reverse().map((p) => (
                <tr key={p.date} className="border-t border-[#ece9e2]">
                  <td className="px-3 py-1.5 text-[#1d1c1a]">{longDate(p.date)}</td>
                  <td className="px-3 py-1.5 text-right">{p.views}</td>
                  <td className="px-3 py-1.5 text-right">{p.downloads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-3">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-[#2a78d6]/40"
            role="group"
            aria-label={`Daily views and downloads for the last ${days} days. Use the arrow keys to read each day.`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onBlur={() => setHover(null)}
            onPointerMove={(e) => setHover(indexFromPointer(e.clientX))}
            onPointerLeave={() => setHover(null)}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
                <text x={M.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={AXIS_TEXT} className="tabular-nums">
                  {Math.round(t).toLocaleString()}
                </text>
              </g>
            ))}
            {labelIdx.map((i) => (
              <text
                key={i}
                x={x(i)}
                y={H - 6}
                textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
                fontSize={11}
                fill={AXIS_TEXT}
              >
                {shortDate(data[i].date)}
              </text>
            ))}

            {!empty && (
              <>
                <path d={path("views")} fill="none" stroke={VIEWS_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                <path d={path("downloads")} fill="none" stroke={DOWNLOADS_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {data.length > 0 && hover === null && (
                  <>
                    <circle cx={x(last)} cy={y(data[last].views)} r={6} fill="#fff" />
                    <circle cx={x(last)} cy={y(data[last].views)} r={4} fill={VIEWS_COLOR} />
                    <circle cx={x(last)} cy={y(data[last].downloads)} r={6} fill="#fff" />
                    <circle cx={x(last)} cy={y(data[last].downloads)} r={4} fill={DOWNLOADS_COLOR} />
                  </>
                )}
              </>
            )}

            {point && hover !== null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + plotH} stroke="#c9c5bb" strokeWidth={1} />
                {[
                  { v: point.views, c: VIEWS_COLOR },
                  { v: point.downloads, c: DOWNLOADS_COLOR },
                ].map(({ v, c }) => (
                  <g key={c}>
                    <circle cx={x(hover)} cy={y(v)} r={6} fill="#fff" />
                    <circle cx={x(hover)} cy={y(v)} r={4} fill={c} />
                  </g>
                ))}
              </g>
            )}

            {empty && (
              <text x={W / 2} y={M.top + plotH / 2} textAnchor="middle" fontSize={13} fill={AXIS_TEXT}>
                No views or downloads in the last {days} days yet
              </text>
            )}
          </svg>

          {point && hover !== null && (
            <div
              role="status"
              className="pointer-events-none absolute top-0 z-10 min-w-[132px] rounded-lg border border-[#e3e0d8] bg-white px-3 py-2 text-xs shadow-[0_4px_16px_rgba(0,0,0,0.10)]"
              style={{
                left: `${(x(hover) / W) * 100}%`,
                transform: `translateX(${hover > last * 0.7 ? "calc(-100% - 10px)" : "10px"})`,
              }}
            >
              <p className="font-medium text-[#6f6b63]">{longDate(point.date)}</p>
              <p className="mt-1 flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 text-[#6f6b63]">
                  <LineKey color={VIEWS_COLOR} /> Views
                </span>
                <strong className="text-sm font-semibold text-[#1d1c1a]">{point.views}</strong>
              </p>
              <p className="mt-0.5 flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 text-[#6f6b63]">
                  <LineKey color={DOWNLOADS_COLOR} /> Downloads
                </span>
                <strong className="text-sm font-semibold text-[#1d1c1a]">{point.downloads}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const STATUS_META = [
  { key: "draft", label: "Draft", color: "#a8a59d" },
  { key: "ready", label: "Ready", color: "#2a78d6" },
  { key: "delivered", label: "Delivered", color: "#1baf7a" },
  { key: "archived", label: "Archived", color: "#4a3aa7" },
] as const;

// Part-to-whole in one horizontal stacked bar: 2px surface gaps between segments,
// 4px rounded outer ends. Counts live in the legend, so identity is never color alone.
export function StatusBar({ counts }: { counts: Record<string, number> }) {
  const total = STATUS_META.reduce((s, m) => s + (counts[m.key] ?? 0), 0);
  const visible = STATUS_META.filter((m) => (counts[m.key] ?? 0) > 0);
  const summary = STATUS_META.map((m) => `${counts[m.key] ?? 0} ${m.label.toLowerCase()}`).join(", ");

  return (
    <div>
      {total === 0 ? (
        <div className="h-3 rounded bg-[#f0eee9]" />
      ) : (
        <div className="flex h-3 gap-[2px]" role="img" aria-label={`Galleries by status: ${summary}`}>
          {visible.map((m, i) => (
            <div
              key={m.key}
              title={`${m.label}: ${counts[m.key]}`}
              className={`${i === 0 ? "rounded-l" : ""} ${i === visible.length - 1 ? "rounded-r" : ""} min-w-[6px] transition-opacity hover:opacity-80`}
              style={{ flexGrow: counts[m.key], backgroundColor: m.color }}
            />
          ))}
        </div>
      )}
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
        {STATUS_META.map((m) => (
          <li key={m.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 text-[#6f6b63]">
              <span className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: m.color }} />
              {m.label}
            </span>
            <strong className="font-semibold tabular-nums text-[#1d1c1a]">{counts[m.key] ?? 0}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

// One series, one color: every bar the same hue (magnitude is length, not shade).
// The value sits outside the bar tip so it can never be clipped by a short bar.
export function HBars({
  rows,
  color = VIEWS_COLOR,
  valueLabel,
}: {
  rows: { key: string | number; label: React.ReactNode; value: number }[];
  color?: string;
  valueLabel: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-[#1d1c1a]">{r.label}</span>
            <span className="shrink-0 tabular-nums text-[#1d1c1a]">
              <strong className="font-semibold">{r.value.toLocaleString()}</strong>{" "}
              <span className="text-xs text-[#6f6b63]">{valueLabel}</span>
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded bg-[#f0eee9]">
            <div
              className="h-2 rounded-r rounded-l-[1px] transition-opacity hover:opacity-80"
              style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, backgroundColor: color }}
              title={`${r.value} ${valueLabel}`}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
