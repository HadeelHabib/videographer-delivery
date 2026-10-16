"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type GalleryMeta = {
  clientName: string;
  slug: string;
  brandLogoUrl: string | null;
  brandColor: string | null;
  requiresPassword: boolean;
  studioName: string;
};

type Rendition = { id: number; quality: string; url: string };
type MediaItem = {
  id: number;
  type: "video" | "photo";
  originalFilename: string | null;
  status: string;
  renditions: Rendition[];
};

const TOKEN_STORAGE_PREFIX = "gallery-token:";
const QUALITY_ORDER = ["original", "1080p", "720p", "480p", "2048px", "1024px", "640px"];
const QUALITY_LABEL: Record<string, string> = {
  original: "Original (full quality)",
  "1080p": "1080p",
  "720p": "720p",
  "480p": "480p",
  "2048px": "Large (2048px)",
  "1024px": "Medium (1024px)",
  "640px": "Small (640px)",
};

function byQuality(a: Rendition, b: Rendition) {
  return QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality);
}

export function PublicGallery({ slug }: { slug: string }) {
  const [meta, setMeta] = useState<GalleryMeta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [allowDownload, setAllowDownload] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);

  useEffect(() => {
    // The admin dashboard's "Client preview" iframe passes a token in the URL
    // hash (never sent to the server, unlike a query string) so the owning
    // photographer can preview a private gallery without the password gate.
    const hashToken =
      typeof window !== "undefined" && window.location.hash.startsWith("#preview_token=")
        ? decodeURIComponent(window.location.hash.slice("#preview_token=".length))
        : null;

    fetch(`/api/public/gallery/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "This gallery could not be found");
        }
        return res.json();
      })
      .then((data) => {
        setMeta(data.gallery);
        if (hashToken) {
          setToken(hashToken);
        } else if (!data.gallery.requiresPassword) {
          const stored = sessionStorage.getItem(TOKEN_STORAGE_PREFIX + slug);
          verify(undefined, stored ?? undefined);
        } else {
          const stored = sessionStorage.getItem(TOKEN_STORAGE_PREFIX + slug);
          if (stored) setToken(stored);
        }
      })
      .catch((err) => setMetaError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!token) return;
    setMediaLoading(true);
    fetch(`/api/public/gallery/${slug}/media`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) {
          sessionStorage.removeItem(TOKEN_STORAGE_PREFIX + slug);
          setToken(null);
          throw new Error("Session expired, please re-enter the password");
        }
        return res.json();
      })
      .then((data) => {
        setMedia(data.media);
        setAllowDownload(data.gallery.allowPublicDownload);
      })
      .catch((err) => setPasswordError(err.message))
      .finally(() => setMediaLoading(false));
  }, [token, slug]);

  async function verify(e?: React.FormEvent, presetToken?: string) {
    if (e) e.preventDefault();
    if (presetToken) {
      setToken(presetToken);
      return;
    }
    setVerifying(true);
    setPasswordError(null);
    try {
      const res = await fetch(`/api/public/gallery/${slug}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Incorrect password");
      sessionStorage.setItem(TOKEN_STORAGE_PREFIX + slug, data.token);
      setToken(data.token);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setVerifying(false);
    }
  }

  function logAction(mediaId: number, action: "viewed" | "downloaded") {
    if (!token) return;
    fetch(`/api/public/gallery/${slug}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mediaId, action }),
    }).catch(() => {});
  }

  const brandColor = meta?.brandColor || "#18181b";

  if (metaError) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#fafaf8] px-4">
        <p className="text-sm text-zinc-500">{metaError}</p>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#fafaf8]">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#fafaf8] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          {meta.brandLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.brandLogoUrl} alt="" className="mb-4 h-10 object-contain" />
          ) : (
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">{meta.studioName}</p>
          )}
          <h1 className="text-lg font-semibold text-zinc-900">{meta.clientName}</h1>
          <p className="mt-1 text-sm text-zinc-500">Enter the password to view this gallery.</p>
          <form onSubmit={verify} className="mt-6 flex flex-col gap-3">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: brandColor }}
            />
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            <button
              type="submit"
              disabled={verifying}
              style={{ backgroundColor: brandColor }}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {verifying ? "Checking..." : "View gallery"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <div className="h-1.5" style={{ backgroundColor: brandColor }} />
      <header className="border-b border-black/5 bg-white/80 px-6 py-8 backdrop-blur sm:px-10">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          {meta.brandLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.brandLogoUrl} alt="" className="h-10 w-auto object-contain" />
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
              Prepared by {meta.studioName}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{meta.clientName}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        {mediaLoading ? (
          <div className="columns-1 gap-6 sm:columns-2 [&>*]:mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-zinc-100" />
            ))}
          </div>
        ) : media.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 py-24 text-center">
            <p className="text-sm text-zinc-400">No media has been added to this gallery yet.</p>
          </div>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2">
            {media.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                watermarkLabel={meta.studioName}
                allowDownload={allowDownload}
                onView={() => logAction(item.id, "viewed")}
                onDownload={() => logAction(item.id, "downloaded")}
              />
            ))}
          </div>
        )}

        <GalleryComments slug={slug} token={token} brandColor={brandColor} />
      </main>
    </div>
  );
}

type GalleryReplyItem = { id: number; body: string; createdAt: string; authorName: string };
type GalleryCommentItem = GalleryReplyItem & { replies: GalleryReplyItem[] };
type CurrentUser = { id: number; email: string; name: string | null; emailVerified: boolean };

function GalleryComments({ slug, token, brandColor }: { slug: string; token: string; brandColor: string }) {
  const [comments, setComments] = useState<GalleryCommentItem[] | null>(null);
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resend, setResend] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function resendVerification() {
    setResend("sending");
    try {
      const res = await fetch("/api/account/resend-verification", { method: "POST" });
      setResend(res.ok ? "sent" : "error");
    } catch {
      setResend("error");
    }
  }

  useEffect(() => {
    fetch(`/api/public/gallery/${slug}/comments`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(() => setComments([]));
    fetch("/api/account/session")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, [slug, token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/gallery/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to post comment");
      setComments((c) => [data.comment, ...(c ?? [])]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="mt-14 border-t border-zinc-200 pt-10">
      <h2 className="text-lg font-semibold text-zinc-900">Comments</h2>

      <div className="mt-4 flex flex-col gap-3">
        {comments === null ? (
          <p className="text-sm text-zinc-400">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-zinc-400">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-medium text-zinc-900">{c.authorName}</p>
              <p className="mt-1 text-sm text-zinc-600">{c.body}</p>
              <p className="mt-2 text-xs text-zinc-400">{new Date(c.createdAt).toLocaleString()}</p>

              {c.replies.length > 0 && (
                <div className="mt-3 flex flex-col gap-2 border-l-2 border-zinc-100 pl-4">
                  {c.replies.map((r) => (
                    <div key={r.id} className="rounded-lg bg-zinc-50 p-3">
                      <p className="text-xs font-medium text-zinc-900">{r.authorName}</p>
                      <p className="mt-1 text-sm text-zinc-600">{r.body}</p>
                      <p className="mt-1 text-xs text-zinc-400">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {user === undefined ? null : user && !user.emailVerified ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>
            Confirm your email address to leave a comment. We sent a link to <strong>{user.email}</strong>.
          </p>
          <button
            type="button"
            onClick={resendVerification}
            disabled={resend === "sending" || resend === "sent"}
            className="mt-2 font-medium underline disabled:no-underline disabled:opacity-60"
          >
            {resend === "sent" ? "Link sent — check your inbox" : resend === "sending" ? "Sending..." : "Resend the link"}
          </button>
          {resend === "error" && <p className="mt-1 text-red-600">Couldn&apos;t send right now, try again later.</p>}
        </div>
      ) : user ? (
        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Leave a comment..."
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={posting}
            style={{ backgroundColor: brandColor }}
            className="self-start rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {posting ? "Posting..." : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">
          <a href={`/account/login?next=${encodeURIComponent(`/gallery/${slug}`)}`} className="font-medium underline">
            Sign in
          </a>{" "}
          to leave a comment.
        </p>
      )}
    </section>
  );
}

// Two offset passes (dark + light) instead of a single blend-mode layer, so
// the watermark stays legible on both bright skies and near-black video
// frames — a mix-blend-mode approach alone goes invisible over pure black.
function watermarkTile(label: string) {
  const text = label.toUpperCase();
  const common = 'text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="600" letter-spacing="2" transform="rotate(-28 140 100)"';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="200">
    <text x="141" y="111" ${common} fill="#000000" fill-opacity="0.3">${text}</text>
    <text x="140" y="110" ${common} fill="#ffffff" fill-opacity="0.4">${text}</text>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function MediaCard({
  item,
  watermarkLabel,
  allowDownload,
  onView,
  onDownload,
}: {
  item: MediaItem;
  watermarkLabel: string;
  allowDownload: boolean;
  onView: () => void;
  onDownload: () => void;
}) {
  const previewOptions = useMemo(
    () => item.renditions.filter((r) => r.quality !== "original").sort(byQuality),
    [item.renditions]
  );
  const original = item.renditions.find((r) => r.quality === "original");
  // Videos default to a mid-size rendition for faster preview playback;
  // photos always preview at full quality — the quality picker below is for
  // download size only, not something a viewer needs while just browsing.
  const defaultPreview =
    item.type === "video" ? previewOptions.find((r) => r.quality === "720p") ?? previewOptions[0] ?? original : original;
  const [selectedId, setSelectedId] = useState<number | undefined>(defaultPreview?.id);

  const selected = useMemo(
    () => item.renditions.find((r) => r.id === selectedId) ?? defaultPreview,
    [item.renditions, selectedId, defaultPreview]
  );

  const downloadOptions = useMemo(() => [...item.renditions].sort(byQuality), [item.renditions]);

  if (!selected) return null;

  return (
    <div className="mb-6 break-inside-avoid overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="relative">
        {item.type === "video" ? (
          <video src={selected.url} controls className="aspect-video w-full bg-black" onPlay={onView} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected.url} alt={item.originalFilename ?? ""} className="w-full object-cover" onLoad={onView} />
        )}
        {/* Preview-only watermark — never applied to downloaded files, which stream the clean original bytes directly. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: watermarkTile(watermarkLabel), backgroundRepeat: "repeat" }}
        />
      </div>

      <div className="flex items-center justify-between gap-2 p-3">
        {item.type === "video" && previewOptions.length > 1 ? (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            aria-label="Preview quality"
            className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs text-zinc-600"
          >
            {previewOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.quality}
              </option>
            ))}
          </select>
        ) : (
          <span />
        )}

        {allowDownload && downloadOptions.length > 0 && (
          <DownloadMenu options={downloadOptions} onDownload={onDownload} />
        )}
      </div>
    </div>
  );
}

function DownloadMenu({ options, onDownload }: { options: Rendition[]; onDownload: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (options.length === 1) {
    return (
      <a
        href={options[0].url}
        download
        onClick={onDownload}
        className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
      >
        <DownloadIcon />
        Download
      </a>
    );
  }

  return (
    <div ref={ref} className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
      >
        <DownloadIcon />
        Download
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" stroke="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 bottom-full z-10 mb-2 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
          {options.map((r) => (
            <a
              key={r.id}
              href={r.url}
              download
              onClick={() => {
                onDownload();
                setOpen(false);
              }}
              className="block px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              {QUALITY_LABEL[r.quality] ?? r.quality}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
      />
    </svg>
  );
}
