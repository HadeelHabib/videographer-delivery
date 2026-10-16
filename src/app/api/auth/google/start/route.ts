import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_OAUTH_COOKIE,
  createOAuthChallenge,
  googleConfigured,
  googleRedirectUri,
  safeNextPath,
} from "@/lib/google-auth";
import { clientIp } from "@/lib/request-ip";
import { isRateLimited } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const loginUrl = (error: string) => new URL(`/account/login?error=${error}`, req.url);

  if (!googleConfigured()) return NextResponse.redirect(loginUrl("google_unavailable"));
  if (isRateLimited(`google-start:${clientIp(req) ?? "unknown"}`, 20, 15 * 60 * 1000)) {
    return NextResponse.redirect(loginUrl("too_many_attempts"));
  }

  const next = safeNextPath(req.nextUrl.searchParams.get("next"));
  const { state, challenge, cookie } = await createOAuthChallenge(next);

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(req.nextUrl.origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  const res = NextResponse.redirect(url);
  res.cookies.set(GOOGLE_OAUTH_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
