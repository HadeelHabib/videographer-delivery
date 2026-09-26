import { SignJWT, jwtVerify } from "jose";

const TTL_SECONDS = 60 * 60 * 6; // 6 hours

function secret() {
  const value = process.env.GALLERY_TOKEN_SECRET;
  if (!value) throw new Error("GALLERY_TOKEN_SECRET is not set");
  return new TextEncoder().encode(value);
}

export async function createGalleryAccessToken(galleryId: number, slug: string) {
  return new SignJWT({ galleryId, slug })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifyGalleryAccessToken(token: string, slug: string) {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.slug !== slug) return null;
    return { galleryId: payload.galleryId as number, slug: payload.slug as string };
  } catch {
    return null;
  }
}
