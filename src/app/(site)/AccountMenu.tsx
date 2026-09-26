"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AccountMenu({
  user,
  light = false,
}: {
  user: { name: string | null; email: string | null } | null;
  light?: boolean;
}) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/account/logout", { method: "POST" });
    router.refresh();
  }

  const idle = light
    ? "text-white/70 hover:text-white"
    : "text-zinc-600 hover:text-zinc-900";
  const subtle = light ? "text-white/50" : "text-zinc-500";

  if (!user) {
    return (
      <Link href="/account/login" className={`text-sm transition ${idle}`}>
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`hidden sm:inline ${subtle}`}>
        {user.name || user.email || "My account"}
      </span>
      <button onClick={signOut} className={`transition ${idle}`}>
        Sign out
      </button>
    </div>
  );
}
