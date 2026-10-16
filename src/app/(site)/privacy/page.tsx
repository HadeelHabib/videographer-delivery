import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={(name) => `This policy explains what ${name} collects when you visit this site, sign in, or open a gallery, and what happens to it.`}
      sections={(studio) => [
        {
          heading: "What we collect",
          body: (
            <>
              <p>
                <strong>Account details</strong> — your email address and name, plus either a password (stored only as a one-way hash) or, if you
                use Google sign-in, your Google account identifier.
              </p>
              <p>
                <strong>Comments</strong> you post on galleries, and the replies to them.
              </p>
              <p>
                <strong>Gallery access records</strong> — when a gallery is opened or its files are downloaded we log the time and your IP address.
                The studio uses this to see that a delivery was received.
              </p>
            </>
          ),
        },
        {
          heading: "Cookies",
          body: (
            <p>
              We use only the cookies needed to keep you signed in and to complete sign-in with Google. We don&apos;t use advertising or analytics
              cookies.
            </p>
          ),
        },
        {
          heading: "How we use it",
          body: (
            <>
              <p>To let you sign in, to show your comments, and to send you email about your account: confirming your address, resetting your password, and replies to your comments.</p>
              <p>If you create an account, we may also email you when the studio publishes new public work.</p>
            </>
          ),
        },
        {
          heading: "Who else handles your data",
          body: (
            <p>
              We rely on service providers to run the site: a database host, a file-storage provider for photos and videos, an email delivery
              service, and Google when you choose to sign in with it. They process data only to provide those services.
            </p>
          ),
        },
        {
          heading: "Your choices",
          body: (
            <p>
              You can ask to see, correct, or delete your account and comments at any time
              {studio.email ? (
                <>
                  {" "}
                  by emailing <a href={`mailto:${studio.email}`} className="underline">{studio.email}</a>
                </>
              ) : (
                " by contacting the studio"
              )}
              . Private galleries stop being accessible after their expiry date, and the studio may archive or delete the files afterwards.
            </p>
          ),
        },
      ]}
    />
  );
}
