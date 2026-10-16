import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_OAUTH_COOKIE,
  fetchGoogleProfile,
  googleConfigured,
  googleRedirectUri,
  readOAuthCookie,
  signInWithGoogleProfile,
} from "@/lib/google-auth";
import { createUserSession } from "@/lib/user-session";

export async function GET(req: NextRequest) {
  const fail = (error: string) => {
    const res = NextResponse.redirect(new URL(`/account/login?error=${error}`, req.url));
    res.cookies.delete({ name: GOOGLE_OAUTH_COOKIE, path: "/api/auth/google" });
    return res;
  };

  if (!googleConfigured()) return fail("google_unavailable");
  // The user pressed "Cancel" on Google's consent screen.
  if (req.nextUrl.searchParams.get("error")) return fail("google_cancelled");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const saved = await readOAuthCookie(req.cookies.get(GOOGLE_OAUTH_COOKIE)?.value);
  if (!code || !state || !saved || saved.state !== state) return fail("google_failed");

  try {
    const profile = await fetchGoogleProfile(code, saved.verifier, googleRedirectUri(req.nextUrl.origin));
    const user = await signInWithGoogleProfile(profile);
    await createUserSession({ userId: user.id, email: user.email });

    const res = NextResponse.redirect(new URL(saved.next, req.url));
    res.cookies.delete({ name: GOOGLE_OAUTH_COOKIE, path: "/api/auth/google" });
    return res;
  } catch (err) {
    console.error("[google-auth]", err);
    return fail(err instanceof Error && err.message.includes("isn't verified") ? "google_unverified" : "google_failed");
  }
}
