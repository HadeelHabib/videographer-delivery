"use client";

import { useEffect, useState } from "react";

export const GOOGLE_ERRORS: Record<string, string> = {
  google_failed: "Google sign-in didn't work. Please try again.",
  google_cancelled: "Google sign-in was cancelled.",
  google_unverified: "Your Google email address isn't verified.",
  google_unavailable: "Google sign-in isn't available right now.",
  too_many_attempts: "Too many attempts, please try again later.",
};

// Renders nothing until the server confirms Google credentials are configured,
// so the button never appears on a deployment that can't complete the flow.
export function GoogleButton({ next, label = "Continue with Google" }: { next: string; label?: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((d) => setEnabled(Boolean(d.google)))
      .catch(() => setEnabled(false));
  }, []);

  if (!enabled) return null;

  return (
    <>
      <a
        href={`/api/auth/google/start?next=${encodeURIComponent(next)}`}
        className="flex items-center justify-center gap-2.5 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
      >
        <svg viewBox="0 0 48 48" className="h-4.5 w-4.5" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
          <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
        {label}
      </a>
      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200" />
        or
        <span className="h-px flex-1 bg-zinc-200" />
      </div>
    </>
  );
}
