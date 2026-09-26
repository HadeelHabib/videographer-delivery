"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";

type Photographer = {
  name: string | null;
  tagline: string | null;
  bio: string | null;
  defaultLogoUrl: string | null;
  defaultBrandColor: string | null;
};

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("#111827");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ photographer: Photographer }>("/api/settings").then(({ photographer }) => {
      setName(photographer.name ?? "");
      setTagline(photographer.tagline ?? "");
      setBio(photographer.bio ?? "");
      setLogoUrl(photographer.defaultLogoUrl ?? "");
      setBrandColor(photographer.defaultBrandColor ?? "#111827");
    });
  }, []);

  async function saveBranding(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await api.patch("/api/settings", {
        name,
        tagline,
        bio,
        defaultLogoUrl: logoUrl,
        defaultBrandColor: brandColor,
      });
      setMessage("Branding saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    }
  }

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

      <form onSubmit={saveBranding} className="mt-6 flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Default branding</h2>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Studio name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Tagline</label>
          <p className="mt-0.5 text-xs text-zinc-400">Shown as the headline on your public landing page.</p>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Cinematic wedding & event films that feel like you."
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Bio</label>
          <p className="mt-0.5 text-xs text-zinc-400">Shown in the About section of your landing page.</p>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Default logo URL</label>
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Default brand color</label>
          <input
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="mt-1 h-10 w-20 rounded-lg border border-zinc-300"
          />
        </div>
        <button
          type="submit"
          className="mt-2 self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Save
        </button>
      </form>

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
