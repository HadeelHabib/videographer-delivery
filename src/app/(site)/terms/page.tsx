import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro={(name) => `By using this site or opening a gallery delivered by ${name}, you agree to these terms.`}
      sections={(studio) => [
        {
          heading: "Galleries and downloads",
          body: (
            <>
              <p>
                Photos and videos in a gallery are delivered for the client named on it. Private galleries are protected by a password and may
                expire; after expiry the files may no longer be available, so download what you need in time.
              </p>
              <p>
                Previews carry a watermark. Downloads are for your personal use and for sharing with the people involved in the occasion shown.
              </p>
            </>
          ),
        },
        {
          heading: "Ownership",
          body: (
            <p>
              {studio.name} keeps the copyright in all photos, videos, and site content unless a separate written agreement says otherwise.
              You may not sell, license, or republish the work, or remove watermarks or credits, without permission.
            </p>
          ),
        },
        {
          heading: "Accounts and comments",
          body: (
            <>
              <p>You are responsible for keeping your password safe and for what you post under your account.</p>
              <p>
                Comments appear immediately. Keep them respectful and lawful — the studio may remove any comment, and may close accounts that
                abuse the site.
              </p>
            </>
          ),
        },
        {
          heading: "Availability",
          body: (
            <p>
              We work to keep the site available, but it is provided as is, and we can&apos;t guarantee uninterrupted access or that files will be
              kept indefinitely. See the <Link href="/privacy" className="underline">Privacy Policy</Link> for how your data is handled.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Questions about these terms
              {studio.email ? (
                <>
                  : <a href={`mailto:${studio.email}`} className="underline">{studio.email}</a>
                </>
              ) : (
                ": please use the contact section on the home page"
              )}
              .
            </p>
          ),
        },
      ]}
    />
  );
}
