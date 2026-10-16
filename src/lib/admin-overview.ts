import { prisma } from "@/lib/prisma";
import {
  DAY_MS,
  buildDailySeries,
  groupByCategory,
  percentChange,
  summarizeNames,
  utcDayStart,
} from "@/lib/overview-math";

export const RANGE_OPTIONS = [7, 30, 90] as const;

export type AttentionItem = {
  key: string;
  tone: "critical" | "warn" | "info";
  title: string;
  detail: string;
  href: string;
};

// Comments from visitors that arrived after the studio last opened the gallery's
// Comments tab — the same rule the gallery list's "new comments" badge uses.
export async function countUnreadGalleryComments(photographerId: number) {
  const rows = await prisma.gallery.findMany({
    where: { photographerId },
    select: { commentsViewedAt: true, galleryComments: { where: { fromPhotographer: false }, select: { createdAt: true } } },
  });
  return rows.reduce(
    (sum, g) => sum + g.galleryComments.filter((c) => !g.commentsViewedAt || c.createdAt > g.commentsViewedAt).length,
    0,
  );
}

export async function getOverview(photographerId: number, days: number) {
  const now = new Date();
  const startDay = utcDayStart(new Date(now.getTime() - (days - 1) * DAY_MS));
  const prevStart = new Date(startDay.getTime() - days * DAY_MS);
  const own = { photographerId };

  const [galleries, logs, lifetimeViews, originalBytes, derivedBytes, renditionStates, failedRenditions, comments, pendingTestimonials] =
    await Promise.all([
      prisma.gallery.findMany({
        where: own,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          clientName: true,
          slug: true,
          status: true,
          visibility: true,
          category: true,
          expiryDate: true,
          createdAt: true,
          deliveredAt: true,
          commentsViewedAt: true,
          _count: { select: { media: true } },
        },
      }),
      prisma.accessLog.findMany({
        where: { gallery: own, accessedAt: { gte: prevStart } },
        orderBy: { accessedAt: "desc" },
        take: 100_000,
        select: { galleryId: true, action: true, accessedAt: true },
      }),
      prisma.accessLog.groupBy({ by: ["galleryId"], where: { gallery: own, action: "viewed" }, _count: { _all: true } }),
      prisma.mediaRendition.aggregate({
        where: { media: { gallery: own }, quality: "original" },
        _sum: { fileSizeBytes: true },
      }),
      prisma.mediaRendition.aggregate({
        where: { media: { gallery: own }, quality: { not: "original" }, status: "ready" },
        _sum: { fileSizeBytes: true },
      }),
      prisma.mediaRendition.groupBy({ by: ["status"], where: { media: { gallery: own } }, _count: { _all: true } }),
      prisma.mediaRendition.findMany({
        where: { status: "failed", media: { gallery: own } },
        select: { media: { select: { galleryId: true } } },
      }),
      prisma.galleryComment.findMany({
        where: { gallery: own, fromPhotographer: false },
        orderBy: { createdAt: "desc" },
        take: 300,
        select: { id: true, galleryId: true, body: true, createdAt: true, user: { select: { name: true, email: true } } },
      }),
      prisma.comment.count({ where: { status: "pending" } }),
    ]);

  const byId = new Map(galleries.map((g) => [g.id, g]));
  const inPeriod = logs.filter((l) => l.accessedAt >= startDay);
  const inPrev = logs.filter((l) => l.accessedAt < startDay);
  const count = (list: typeof logs, action: string) => list.filter((l) => l.action === action).length;

  const perGallery = new Map<number, { views: number; downloads: number }>();
  for (const l of inPeriod) {
    const entry = perGallery.get(l.galleryId) ?? { views: 0, downloads: 0 };
    if (l.action === "viewed") entry.views += 1;
    else if (l.action === "downloaded") entry.downloads += 1;
    perGallery.set(l.galleryId, entry);
  }

  const live = galleries.filter((g) => g.status !== "archived");
  const mediaCount = galleries.reduce((s, g) => s + g._count.media, 0);

  const byStatus = { draft: 0, ready: 0, delivered: 0, archived: 0 };
  const byVisibility = { public: 0, private: 0 };
  for (const g of galleries) {
    if (g.status in byStatus) byStatus[g.status as keyof typeof byStatus] += 1;
    if (g.status !== "archived" && g.visibility in byVisibility) byVisibility[g.visibility as keyof typeof byVisibility] += 1;
  }

  const categories = groupByCategory(live).map(({ name, items }) => ({
    name,
    total: items.length,
    byStatus: items.reduce<Record<string, number>>((acc, g) => ({ ...acc, [g.status]: (acc[g.status] ?? 0) + 1 }), {}),
    media: items.reduce((s, g) => s + g._count.media, 0),
    views: items.reduce((s, g) => s + (perGallery.get(g.id)?.views ?? 0), 0),
    galleries: items.map((g) => ({
      id: g.id,
      clientName: g.clientName,
      status: g.status,
      visibility: g.visibility,
      category: g.category,
      mediaCount: g._count.media,
      views: perGallery.get(g.id)?.views ?? 0,
    })),
  }));

  const topGalleries = [...perGallery.entries()]
    .filter(([id]) => byId.has(id))
    .map(([id, v]) => ({ id, clientName: byId.get(id)!.clientName, views: v.views, downloads: v.downloads }))
    .filter((g) => g.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  // ---- Needs attention ----
  const attention: AttentionItem[] = [];
  const open = (id: number) => `/admin/dashboard?gallery=${id}`;
  const names = (list: { clientName: string }[]) => summarizeNames(list.map((g) => g.clientName));

  const failedGalleryIds = [...new Set(failedRenditions.map((r) => r.media.galleryId))];
  if (failedRenditions.length > 0) {
    attention.push({
      key: "failed-renditions",
      tone: "critical",
      title: `${failedRenditions.length} video/photo version${failedRenditions.length === 1 ? "" : "s"} failed to process`,
      detail: names(failedGalleryIds.map((id) => byId.get(id)).filter((g): g is NonNullable<typeof g> => Boolean(g))),
      href: open(failedGalleryIds[0]),
    });
  }

  const expired = live.filter((g) => g.expiryDate && g.expiryDate.getTime() <= now.getTime());
  if (expired.length > 0) {
    attention.push({
      key: "expired",
      tone: "critical",
      title: `${expired.length} expired galler${expired.length === 1 ? "y is" : "ies are"} still active`,
      detail: `${names(expired)} — archive to free storage`,
      href: open(expired[0].id),
    });
  }

  const unreadComments = comments.filter((c) => {
    const g = byId.get(c.galleryId);
    return g && (!g.commentsViewedAt || c.createdAt > g.commentsViewedAt);
  });
  if (unreadComments.length > 0) {
    const first = byId.get(unreadComments[0].galleryId)!;
    const where = [...new Set(unreadComments.map((c) => byId.get(c.galleryId)!.clientName))];
    attention.push({
      key: "new-comments",
      tone: "warn",
      title: `${unreadComments.length} new client comment${unreadComments.length === 1 ? "" : "s"}`,
      detail: summarizeNames(where),
      href: open(first.id),
    });
  }

  if (pendingTestimonials > 0) {
    attention.push({
      key: "testimonials",
      tone: "warn",
      title: `${pendingTestimonials} testimonial${pendingTestimonials === 1 ? "" : "s"} waiting for approval`,
      detail: "Nothing shows on the public portfolio until you approve it",
      href: "/admin/comments",
    });
  }

  const soon = live.filter((g) => g.expiryDate && g.expiryDate.getTime() > now.getTime() && g.expiryDate.getTime() <= now.getTime() + 14 * DAY_MS);
  if (soon.length > 0) {
    attention.push({
      key: "expiring",
      tone: "warn",
      title: `${soon.length} galler${soon.length === 1 ? "y expires" : "ies expire"} within 14 days`,
      detail: names(soon),
      href: open(soon[0].id),
    });
  }

  const waiting = live.filter((g) => (g.status === "draft" || g.status === "ready") && now.getTime() - g.createdAt.getTime() > 7 * DAY_MS);
  if (waiting.length > 0) {
    attention.push({
      key: "waiting",
      tone: "info",
      title: `${waiting.length} galler${waiting.length === 1 ? "y has" : "ies have"} been waiting over a week to be delivered`,
      detail: names(waiting),
      href: open(waiting[0].id),
    });
  }

  const seen = new Set(lifetimeViews.map((v) => v.galleryId));
  const unopened = live.filter(
    (g) => g.visibility === "private" && g.status === "delivered" && !seen.has(g.id) && now.getTime() - (g.deliveredAt ?? g.createdAt).getTime() > 3 * DAY_MS,
  );
  if (unopened.length > 0) {
    attention.push({
      key: "unopened",
      tone: "info",
      title: `${unopened.length} delivered private galler${unopened.length === 1 ? "y has" : "ies have"} never been opened`,
      detail: `${names(unopened)} — the client may need a reminder`,
      href: open(unopened[0].id),
    });
  }

  const uncategorized = live.filter((g) => !g.category?.trim());
  if (uncategorized.length > 0) {
    attention.push({
      key: "uncategorized",
      tone: "info",
      title: `${uncategorized.length} galler${uncategorized.length === 1 ? "y has" : "ies have"} no category`,
      detail: "Uncategorized work can't appear in the portfolio sections",
      href: "#categories",
    });
  }

  const processing = renditionStates
    .filter((r) => r.status === "queued" || r.status === "processing")
    .reduce((s, r) => s + r._count._all, 0);
  if (processing > 0) {
    attention.push({
      key: "processing",
      tone: "info",
      title: `${processing} file version${processing === 1 ? " is" : "s are"} still processing`,
      detail: "The worker is converting uploads — they'll be ready shortly",
      href: "/admin/dashboard",
    });
  }

  const tonePriority = { critical: 0, warn: 1, info: 2 } as const;
  attention.sort((a, b) => tonePriority[a.tone] - tonePriority[b.tone]);

  // ---- Recent activity ----
  const recent = [
    ...inPeriod.slice(0, 12).map((l) => ({
      type: l.action === "downloaded" ? ("downloaded" as const) : ("viewed" as const),
      galleryId: l.galleryId,
      galleryName: byId.get(l.galleryId)?.clientName ?? "Deleted gallery",
      at: l.accessedAt.toISOString(),
      text: null as string | null,
    })),
    ...comments.slice(0, 6).map((c) => ({
      type: "comment" as const,
      galleryId: c.galleryId,
      galleryName: byId.get(c.galleryId)?.clientName ?? "Deleted gallery",
      at: c.createdAt.toISOString(),
      text: `${c.user?.name || c.user?.email.split("@")[0] || "A visitor"}: ${c.body.slice(0, 120)}`,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 10);

  const views = count(inPeriod, "viewed");
  const downloads = count(inPeriod, "downloaded");
  const viewsPrev = count(inPrev, "viewed");
  const downloadsPrev = count(inPrev, "downloaded");
  const original = Number(originalBytes._sum.fileSizeBytes ?? 0);
  const derived = Number(derivedBytes._sum.fileSizeBytes ?? 0);

  return {
    days,
    generatedAt: now.toISOString(),
    kpis: {
      views,
      viewsChange: percentChange(views, viewsPrev),
      downloads,
      downloadsChange: percentChange(downloads, downloadsPrev),
      activeGalleries: live.length,
      totalGalleries: galleries.length,
      mediaCount,
      storageBytes: original + derived,
      originalBytes: original,
      derivedBytes: derived,
    },
    byStatus,
    byVisibility,
    categories,
    daily: buildDailySeries(inPeriod, startDay, days),
    topGalleries,
    attention,
    recent,
  };
}

export type Overview = Awaited<ReturnType<typeof getOverview>>;
