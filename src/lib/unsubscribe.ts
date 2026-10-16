import { SignJWT, jwtVerify } from "jose";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(value);
}

// Stateless link token so the unsubscribe link in an email works without signing in.
export async function createUnsubscribeToken(userId: number) {
  return new SignJWT({ userId, purpose: "unsubscribe" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2y")
    .sign(secret());
}

export async function readUnsubscribeToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.purpose === "unsubscribe" && typeof payload.userId === "number" ? payload.userId : null;
  } catch {
    return null;
  }
}
