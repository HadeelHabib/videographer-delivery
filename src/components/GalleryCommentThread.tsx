"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";

const MAX_DEPTH = 5; // keep in sync with MAX_REPLY_DEPTH in lib/comment-tree
const MAX_INDENT = 3; // deeper levels keep the same indent so threads don't squeeze off-screen

export type GalleryCommentData = {
  id: number;
  body: string;
  createdAt: string;
  fromPhotographer: boolean;
  user: { name: string | null; email: string } | null;
  replies: GalleryCommentData[];
};

// Shared by the gallery detail page's Comments tab and the admin-wide
// Comments overview — a whole thread: the client's comment, every reply
// nested under it (any depth), and a reply composer on each comment.
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
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <CommentNode comment={comment} galleryId={galleryId} onChanged={onChanged} depth={0} headerExtra={headerExtra} />
    </div>
  );
}

function CommentNode({
  comment,
  galleryId,
  onChanged,
  depth,
  headerExtra,
}: {
  comment: GalleryCommentData;
  galleryId: number;
  onChanged: () => void;
  depth: number;
  headerExtra?: React.ReactNode;
}) {
  const [deleting, setDeleting] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    const hasReplies = comment.replies.length > 0;
    if (hasReplies && !window.confirm("Deleting this comment also deletes all replies under it. Continue?")) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/api/galleries/${galleryId}/comments/${comment.id}`);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete comment");
      setDeleting(false);
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

  const author = comment.fromPhotographer ? "You" : comment.user?.name || comment.user?.email || "Visitor";
  const nested = depth > 0;

  return (
    <div className={nested ? "rounded-lg bg-zinc-50 p-3" : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={nested ? "text-xs font-medium text-zinc-900" : "text-sm font-medium text-zinc-900"}>
            {author}
            {comment.fromPhotographer && <span className="ml-1.5 font-normal text-zinc-400">(studio)</span>}
          </p>
          <p className="text-xs text-zinc-400">
            {headerExtra}
            {new Date(comment.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {depth < MAX_DEPTH && (
            <button onClick={() => setReplying((v) => !v)} className="text-xs font-medium text-zinc-500 hover:text-zinc-900">
              Reply
            </button>
          )}
          <button
            onClick={remove}
            disabled={deleting}
            className="text-xs font-medium text-zinc-400 hover:text-red-600 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
      <p className="mt-2 text-sm text-zinc-700">{comment.body}</p>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {replying && (
        <div className="mt-3 flex flex-col gap-2">
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

      {comment.replies.length > 0 && (
        <div className={`mt-3 flex flex-col gap-2 ${depth < MAX_INDENT ? "border-l-2 border-zinc-100 pl-4" : ""}`}>
          {comment.replies.map((r) => (
            <CommentNode key={r.id} comment={r} galleryId={galleryId} onChanged={onChanged} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
