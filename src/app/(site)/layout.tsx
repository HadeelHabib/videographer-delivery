import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { getStudioProfile } from "@/lib/studio";
import { getUserSession } from "@/lib/user-session";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "./SiteHeader";

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [studio, userSession] = await Promise.all([getStudioProfile(), getUserSession()]);
  const user = userSession
    ? await prisma.user.findUnique({ where: { id: userSession.userId }, select: { name: true, email: true } })
    : null;

  return (
    <div className={`${display.variable} flex min-h-screen flex-col bg-[#fafaf8]`}>
      <SiteHeader
        studio={{ name: studio.name, logoUrl: studio.logoUrl }}
        user={user}
      />

      <main className="flex-1">{children}</main>

      <footer className="border-t border-black/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center sm:px-10">
          <div className="flex gap-6 text-sm text-zinc-500">
            <Link href="/#services" className="hover:text-zinc-900">
              Services
            </Link>
            <Link href="/portfolio" className="hover:text-zinc-900">
              Work
            </Link>
            <Link href="/#about" className="hover:text-zinc-900">
              About
            </Link>
            <Link href="/#contact" className="hover:text-zinc-900">
              Contact
            </Link>
          </div>
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} {studio.name}. All rights reserved.
          </p>
          <Link href="/admin/login" className="text-xs text-zinc-300 hover:text-zinc-500">
            Client login
          </Link>
        </div>
      </footer>
    </div>
  );
}
