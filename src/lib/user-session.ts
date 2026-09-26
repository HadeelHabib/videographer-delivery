import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Separate cookie/JWT from the photographer's admin session (src/lib/session.ts)
// — visitors who sign up to comment are a completely different principal.
const USER_SESSION_COOKIE = "user_session";
const USER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(value);
}

export type UserSessionPayload = {
  userId: number;
  email: string;
};

export async function createUserSession(payload: UserSessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${USER_SESSION_TTL_SECONDS}s`)
    .sign(secret());

  const store = await cookies();
  store.set(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: USER_SESSION_TTL_SECONDS,
  });
}

export async function destroyUserSession() {
  const store = await cookies();
  store.delete(USER_SESSION_COOKIE);
}

export async function getUserSession(): Promise<UserSessionPayload | null> {
  const store = await cookies();
  const token = store.get(USER_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: payload.userId as number, email: payload.email as string };
  } catch {
    return null;
  }
}
