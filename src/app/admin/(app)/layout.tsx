import { AdminTopNav } from "./AdminTopNav";
import { getStudioProfile } from "@/lib/studio";

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const studio = await getStudioProfile();

  return (
    <div className="min-h-screen bg-[#f6f5f2] text-[#1d1c1a]">
      <AdminTopNav studioName={studio.name} logoUrl={studio.logoUrl} />
      <main className="mx-auto max-w-[1100px] px-6 py-8">{children}</main>
    </div>
  );
}
