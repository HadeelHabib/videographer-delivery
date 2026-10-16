import { redirect } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { getSession } from "@/lib/session";
import { getStudioProfile } from "@/lib/studio";

export const dynamic = "force-dynamic";

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  if (!(await getSession())) redirect("/admin/login");
  const studio = await getStudioProfile();

  return (
    <div className="min-h-screen bg-[#f6f5f2] text-[#1d1c1a] md:flex">
      <AdminSidebar studioName={studio.name} logoUrl={studio.logoUrl} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
