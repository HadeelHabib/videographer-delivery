// Disk-backed stand-in for R2, used when STORAGE_PROVIDER=local (no Cloudflare
// account needed for local dev/testing). Mirrors the same key-based object model:
// presigned upload/download URLs are replaced with short-lived signed links into
// the /api/local-storage routes, and multipart parts are assembled on disk.
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

const STORAGE_ROOT = path.join(os.tmpdir(), "photo-delivery-storage");
const OBJECTS_ROOT = path.join(STORAGE_ROOT, "objects");
const MULTIPART_ROOT = path.join(STORAGE_ROOT, "multipart");

function secret() {
  const value = process.env.GALLERY_TOKEN_SECRET;
  if (!value) throw new Error("GALLERY_TOKEN_SECRET is not set");
  return new TextEncoder().encode(value);
}

type TokenPayload =
  | { action: "get"; key: string; filename?: string }
  | { action: "put-part"; uploadId: string; partNumber: number };

async function sign(payload: TokenPayload, expiresInSeconds: number) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(secret());
}

export async function verifyLocalStorageToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// Keys are always server-generated (gallery-{id}/media-{id}/...), but resolve
// defensively so a malformed key can never escape the objects root.
export function objectPath(key: string) {
  const resolved = path.resolve(OBJECTS_ROOT, key);
  if (resolved !== OBJECTS_ROOT && !resolved.startsWith(OBJECTS_ROOT + path.sep)) {
    throw new Error("Invalid storage key");
  }
  return resolved;
}

function partPath(uploadId: string, partNumber: number) {
  if (!/^[0-9a-f-]{36}$/.test(uploadId)) throw new Error("Invalid uploadId");
  return path.join(MULTIPART_ROOT, uploadId, `part-${partNumber}`);
}

export async function localCreateMultipartUpload() {
  const uploadId = crypto.randomUUID();
  await fsp.mkdir(path.join(MULTIPART_ROOT, uploadId), { recursive: true });
  return uploadId;
}

export async function localPresignUploadPart(uploadId: string, partNumber: number, expiresInSeconds = 3600) {
  const token = await sign({ action: "put-part", uploadId, partNumber }, expiresInSeconds);
  return `/api/local-storage/part?token=${encodeURIComponent(token)}`;
}

export async function localWritePart(uploadId: string, partNumber: number, data: Buffer) {
  await fsp.writeFile(partPath(uploadId, partNumber), data);
  return `"${crypto.createHash("md5").update(data).digest("hex")}"`;
}

export async function localCompleteMultipartUpload(
  key: string,
  uploadId: string,
  parts: { partNumber: number; etag: string }[]
) {
  const dest = objectPath(key);
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  const out = fs.createWriteStream(dest);
  for (const p of [...parts].sort((a, b) => a.partNumber - b.partNumber)) {
    const data = await fsp.readFile(partPath(uploadId, p.partNumber));
    await new Promise<void>((resolve, reject) => out.write(data, (err) => (err ? reject(err) : resolve())));
  }
  await new Promise<void>((resolve) => out.end(resolve));
  await fsp.rm(path.join(MULTIPART_ROOT, uploadId), { recursive: true, force: true });
}

export async function localAbortMultipartUpload(uploadId: string) {
  await fsp.rm(path.join(MULTIPART_ROOT, uploadId), { recursive: true, force: true });
}

export async function localCreateDownloadUrl(key: string, expiresInSeconds = 3600, filename?: string) {
  const token = await sign({ action: "get", key, filename }, expiresInSeconds);
  return `/api/local-storage/object?token=${encodeURIComponent(token)}`;
}

export async function localDeleteObject(key: string) {
  await fsp.rm(objectPath(key), { force: true });
}

export async function localMoveObject(sourceKey: string, destKey: string) {
  const dest = objectPath(destKey);
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await fsp.rename(objectPath(sourceKey), dest);
}

export async function localDownloadObjectToFile(key: string, destPath: string) {
  await fsp.copyFile(objectPath(key), destPath);
}

export async function localUploadObjectFromFile(key: string, srcPath: string) {
  const dest = objectPath(key);
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await fsp.copyFile(srcPath, dest);
}

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
};

export function guessContentType(key: string) {
  return CONTENT_TYPES[path.extname(key).toLowerCase()] ?? "application/octet-stream";
}
