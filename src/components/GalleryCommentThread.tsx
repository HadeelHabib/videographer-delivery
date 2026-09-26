"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";

export type GalleryReplyData = {
  id: number;
  body: string;
  createdAt: string;
  fromPhotographer: boolean;
  user: { name: string | null; email: string } | null;
};

export type GalleryCommentData = GalleryReplyData & { replies: GalleryReplyData[] };

// Shared by the gallery detail page's Comments tab and the admin-wide
// Comments overview — one comment thread: the client's comment, any
// photographer replies nested under it, and a reply composer.
export function GalleryCommentThread({
  comment,
  galleryId,
  onChanged,
  headerExtra,
}: {
  comment: GalleryCommentData;
  galleryId: number;
  onChanged: () => void;
  headerExtra?: React.ReactNode;
}) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(commentId: number) {
    setBusyId(commentId);
    setError(null);
    try {
      await api.delete(`/api/galleries/${galleryId}/comments/${commentId}`);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete comment");
    } finally {
      setBusyId(null);
    }
  }

  async function sendReply() {
    setSending(true);
    setError(null);
    try {
      await api.post(`/api/galleries/${galleryId}/comments/${comment.id}/reply`, { body: replyBody });
      setReplyBody("");
      setReplying(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-900">{comment.user?.name || comment.user?.email}</p>
          <p className="text-xs text-zinc-400">
            {headerExtra}
            {new Date(comment.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setReplying((v) => !v)}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
          >
            Reply
          </button>
          <button
            onClick={() => remove(comment.id)}
            disabled={busyId === comment.id}
            className="text-xs font-medium text-zinc-400 hover:text-red-600 disabled:opacity-50"
          >
            {busyId === comment.id ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
      <p className="mt-2 text-sm text-zinc-700">{comment.body}</p>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {comment.replies.length > 0 && (
        <div className="mt-3 flex flex-col gap-2 border-l-2 border-zinc-100 pl-4">
          {comment.replies.map((r) => (
            <div key={r.id} className="rounded-lg bg-zinc-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-zinc-900">
                  {r.user?.name || r.user?.email || "You"}
                  {r.fromPhotographer && <span className="ml-1.5 text-zinc-400">(you)</span>}
                </p>
                <button
                  onClick={() => remove(r.id)}
                  disabled={busyId === r.id}
                  className="text-xs text-zinc-400 hover:text-red-600 disabled:opacity-50"
                >
                  {busyId === r.id ? "Deleting…" : "Delete"}
                </button>
              </div>
              <p className="mt-1 text-sm text-zinc-700">{r.body}</p>
              <p className="mt-1 text-xs text-zinc-400">{new Date(r.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {replying && (
        <div className="mt-3 flex flex-col gap-2 border-l-2 border-zinc-100 pl-4">
          <textarea
            autoFocus
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          <div className="flex gap-2">
            <button
              onClick={sendReply}
              disabled={sending || !replyBody.trim()}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send reply"}
            </button>
            <button
              onClick={() => {
                setReplying(false);
                setReplyBody("");
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
