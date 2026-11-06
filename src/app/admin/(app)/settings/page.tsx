"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await api.patch("/api/settings", { currentPassword, newPassword });
      setMessage("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update password");
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-zinc-900">Settings</h1>

      {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={changePassword}
        className="mt-6 flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6"
      >
        <h2 className="text-sm font-semibold text-zinc-900">Change password</h2>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="mt-2 self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Update password
        </button>
      </form>
    </div>
  );
}
