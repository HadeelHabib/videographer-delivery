import type { Metadata } from "next";
import { Suspense } from "react";
import { Playfair_Display } from "next/font/google";
import { getStudioProfile } from "@/lib/studio";
import { LoginExperience } from "./LoginExperience";

// Same display face as the public site, so the studio's front and back doors match.
const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sign in · Studio",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const studio = await getStudioProfile();

  return (
    <div className={`${display.variable} flex flex-1 flex-col`}>
      <Suspense>
        <LoginExperience studio={{ name: studio.name, tagline: studio.tagline, logoUrl: studio.logoUrl }} />
      </Suspense>
    </div>
  );
}
