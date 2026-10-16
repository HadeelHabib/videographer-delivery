"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";

type AccountType = "admin" | "user";

const INPUT =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900";
const BUTTON =
  "mt-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50";

const LOGIN_HREF: Record<AccountType, string> = { admin: "/admin/login", user: "/account/login" };

function Shell({ type, title, subtitle, children }: { type: AccountType; title: string; subtitle?: string; children: React.ReactNode }) {
  const body = (
    <>
      <h1
        className={type === "admin" ? "text-xl font-semibold text-zinc-900" : "text-2xl text-zinc-900"}
        style={type === "user" ? { fontFamily: "var(--font-display)" } : undefined}
      >
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      {children}
    </>
  );

  if (type === "admin") {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">{body}</div>
      </div>
    );
  }
  return <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-16">{body}</div>;
}

export function ForgotPasswordForm({ type }: { type: AccountType }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/auth/forgot-password", { email, type });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell type={type} title="Forgot your password?" subtitle="Enter your email and we'll send you a link to choose a new one.">
      {sent ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          If an account exists for <strong>{email}</strong>, a reset link is on its way. It expires in 1 hour.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Email</label>
            <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className={BUTTON}>
            {busy ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-6 text-sm text-zinc-500">
        <Link href={LOGIN_HREF[type]} className="font-medium text-zinc-900 underline">
          Back to sign in
        </Link>
      </p>
    </Shell>
  );
}

export function ResetPasswordForm({ type }: { type: AccountType }) {
  return (
    <Suspense>
      <ResetPasswordInner type={type} />
    </Suspense>
  );
}

function ResetPasswordInner({ type }: { type: AccountType }) {
  const token = useSearchParams().get("token") ?? "";
  const [valid, setValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setValid(false);
      return;
    }
    api
      .get<{ valid: boolean }>(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => setValid(r.valid))
      .catch(() => setValid(false));
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (valid === null) {
    return (
      <Shell type={type} title="Reset password">
        <p className="mt-4 text-sm text-zinc-500">Checking your link...</p>
      </Shell>
    );
  }

  if (!valid && !done) {
    return (
      <Shell type={type} title="Link expired" subtitle="This reset link is invalid, already used, or older than 1 hour.">
        <p className="mt-6 text-sm">
          <Link
            href={type === "admin" ? "/admin/forgot-password" : "/account/forgot-password"}
            className="font-medium text-zinc-900 underline"
          >
            Request a new link
          </Link>
        </p>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell type={type} title="Password updated" subtitle="You can now sign in with your new password.">
        <Link href={LOGIN_HREF[type]} className={`${BUTTON} mt-6 block text-center`}>
          Go to sign in
        </Link>
      </Shell>
    );
  }

  return (
    <Shell type={type} title="Choose a new password" subtitle="At least 8 characters.">
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">New password</label>
          <input
            type="password"
            required
            minLength={8}
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Confirm password</label>
          <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={INPUT} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className={BUTTON}>
          {busy ? "Saving..." : "Update password"}
        </button>
      </form>
    </Shell>
  );
}
