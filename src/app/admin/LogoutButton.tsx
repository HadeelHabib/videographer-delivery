"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await api.post("/api/auth/logout");
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-md border border-[#e3e0d8] px-3 py-1.5 text-sm font-medium text-[#1d1c1a] transition hover:bg-[#f0eee9]"
    >
      Sign out
    </button>
  );
}
