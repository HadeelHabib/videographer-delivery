"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { PasswordInput } from "@/components/PasswordInput";
import { validatePasswordChange, type PasswordChangeErrors } from "@/lib/login-validation";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState<PasswordChangeErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const currentRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLInputElement>(null);

  // A disabled input can't take focus, so focus requested while saving is applied once it's enabled again.
  const pendingFocus = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!busy && pendingFocus.current) {
      pendingFocus.current.focus();
      pendingFocus.current = null;
    }
  });

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);
    setSaved(false);

    const found = validatePasswordChange(currentPassword, newPassword);
    setErrors(found);
    if (found.current || found.next) {
      (found.current ? currentRef : newRef).current?.focus();
      return;
    }

    setBusy(true);
    try {
      await api.patch("/api/settings", { currentPassword, newPassword });
      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "";
      if (/current password/i.test(message)) {
        setErrors({ current: "That isn't your current password. Check it and try again." });
        pendingFocus.current = currentRef.current;
      } else {
        setFormError(message || "We couldn't update your password. Check your connection and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-zinc-900">Settings</h1>

      {saved && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Password updated. Other devices have been signed out.
        </p>
      )}
      {formError && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}

      <form
        onSubmit={changePassword}
        noValidate
        className="mt-6 flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-6"
      >
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Change password</h2>

        <PasswordInput
          id="current-password"
          label="Current password"
          value={currentPassword}
          inputRef={currentRef}
          disabled={busy}
          error={errors.current}
          onChange={(v) => {
            setCurrentPassword(v);
            if (errors.current) setErrors((er) => ({ ...er, current: undefined }));
          }}
        />

        <PasswordInput
          id="new-password"
          label="New password"
          value={newPassword}
          inputRef={newRef}
          disabled={busy}
          error={errors.next}
          autoComplete="new-password"
          onChange={(v) => {
            setNewPassword(v);
            if (errors.next) setErrors((er) => ({ ...er, next: validatePasswordChange(currentPassword || "x", v).next }));
          }}
        />
        <p className="-mt-1 text-xs text-zinc-500">At least 8 characters. A short sentence you&apos;ll remember beats a complicated word.</p>

        <button
          type="submit"
          disabled={busy}
          className="mt-4 self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60"
        >
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
