import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
export { safeNextPath } from "@/lib/safe-redirect";

export const GOOGLE_OAUTH_COOKIE = "google_oauth";

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(requestOrigin: string) {
  const base = process.env.APP_URL || requestOrigin;
  return `${base.replace(/\/$/, "")}/api/auth/google/callback`;
}

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(value);
}

type OAuthState = { state: string; verifier: string; next: string };

export async function createOAuthChallenge(next: string) {
  const state = randomBytes(24).toString("hex");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const cookie = await new SignJWT({ state, verifier, next } satisfies OAuthState)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m")
    .sign(secret());
  return { state, challenge, cookie };
}

export async function readOAuthCookie(value: string | undefined): Promise<OAuthState | null> {
  if (!value) return null;
  try {
    const { payload } = await jwtVerify(value, secret());
    return { state: payload.state as string, verifier: payload.verifier as string, next: payload.next as string };
  } catch {
    return null;
  }
}

export type GoogleProfile = { sub: string; email: string; emailVerified: boolean; name: string | null };

export async function fetchGoogleProfile(code: string, verifier: string, redirectUri: string): Promise<GoogleProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  if (!tokenRes.ok) throw new Error(`Google token exchange failed (${tokenRes.status})`);
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) throw new Error("Google returned no access token");

  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!infoRes.ok) throw new Error(`Google userinfo failed (${infoRes.status})`);
  const info = (await infoRes.json()) as { sub?: string; email?: string; email_verified?: boolean; name?: string };
  if (!info.sub || !info.email) throw new Error("Google profile is missing sub/email");
  return { sub: info.sub, email: info.email.toLowerCase(), emailVerified: info.email_verified === true, name: info.name ?? null };
}

// Finds, links, or creates the visitor account for a verified Google identity.
// Linking by email is only safe because Google asserts the address is verified.
export async function signInWithGoogleProfile(profile: GoogleProfile) {
  if (!profile.emailVerified) throw new Error("Your Google email address isn't verified");

  const bySub = await prisma.user.findUnique({ where: { googleId: profile.sub } });
  if (bySub) return bySub;

  const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { googleId: profile.sub, emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(), name: byEmail.name ?? profile.name },
    });
  }

  return prisma.user.create({
    data: { email: profile.email, name: profile.name, googleId: profile.sub, emailVerifiedAt: new Date() },
  });
}
