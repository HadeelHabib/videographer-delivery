export const DAY_MS = 86_400_000;

export function utcDayStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export type DailyPoint = { date: string; views: number; downloads: number };

// One point per UTC day for `days` days ending today, zero-filled, so the chart
// has no gaps and the table view lists every day.
export function buildDailySeries(
  logs: { action: string; accessedAt: Date }[],
  startDay: Date,
  days: number,
): DailyPoint[] {
  const points = new Map<string, DailyPoint>();
  for (let i = 0; i < days; i++) {
    const date = dayKey(new Date(startDay.getTime() + i * DAY_MS));
    points.set(date, { date, views: 0, downloads: 0 });
  }
  for (const log of logs) {
    const point = points.get(dayKey(log.accessedAt));
    if (!point) continue;
    if (log.action === "viewed") point.views += 1;
    else if (log.action === "downloaded") point.downloads += 1;
  }
  return [...points.values()];
}

// null when there's nothing to compare against — "+∞%" isn't a useful number.
export function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export type CategoryInput = {
  id: number;
  category: string | null;
  status: string;
};

export function normalizeCategory(category: string | null | undefined) {
  const value = category?.trim().toLowerCase();
  return value ? value : null;
}

// Groups by normalized category, largest first; "no category" (null) always last.
export function groupByCategory<T extends CategoryInput>(galleries: T[]) {
  const groups = new Map<string | null, T[]>();
  for (const g of galleries) {
    const key = normalizeCategory(g.category);
    groups.set(key, [...(groups.get(key) ?? []), g]);
  }
  return [...groups.entries()]
    .map(([name, items]) => ({ name, items }))
    .sort((a, b) => {
      if (a.name === null) return 1;
      if (b.name === null) return -1;
      return b.items.length - a.items.length || a.name.localeCompare(b.name);
    });
}

// Axis maximum for 4 equal intervals, each a clean step (1, 2, 2.5, 5 x 10^n), so the
// ticks read 0 / 25 / 50 / 75 / 100. Counts are whole numbers, so the step is never below 1.
export function niceCeil(max: number) {
  const rawStep = Math.max(max, 1) / 4;
  const base = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / base;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return Math.max(1, niceFraction * base) * 4;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function summarizeNames(names: string[], max = 2) {
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")} +${names.length - max} more`;
}

export function timeAgo(iso: string, nowMs: number = Date.now()) {
  const seconds = Math.max(0, Math.round((nowMs - new Date(iso).getTime()) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });
}
