import fs from "node:fs";
import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as local from "@/lib/local-storage";

// STORAGE_PROVIDER=local swaps every function below for a disk-backed
// implementation (src/lib/local-storage.ts) — same key-based object model, no
// Cloudflare account needed. Every call site below is unaware of the switch.
const USE_LOCAL = process.env.STORAGE_PROVIDER === "local";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export const R2_BUCKET = () => env("R2_BUCKET_NAME");

export function r2Client() {
  return new S3Client({
    region: "auto",
    endpoint: env("R2_ENDPOINT"),
    credentials: {
      accessKeyId: env("R2_ACCESS_KEY_ID"),
      secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    },
  });
}

export function mediaStorageKey(galleryId: number, mediaId: number, filename: string) {
  return `gallery-${galleryId}/media-${mediaId}/${filename}`;
}

export async function createUploadUrl(key: string, contentType: string, expiresInSeconds = 3600) {
  if (USE_LOCAL) return local.localCreateDownloadUrl(key, expiresInSeconds); // unused in practice (multipart-only)
  const client = r2Client();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function createDownloadUrl(key: string, expiresInSeconds = 3600, filename?: string) {
  if (USE_LOCAL) return local.localCreateDownloadUrl(key, expiresInSeconds, filename);
  const client = r2Client();
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key: key,
    ResponseContentDisposition: filename ? `attachment; filename="${filename}"` : undefined,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

// Resumable/chunked upload support: the browser uploads each part directly to R2
// via its own presigned URL, so a dropped connection only needs to resume the
// parts that never got an ETag back, not the whole file.
export async function createMultipartUpload(key: string, contentType: string) {
  if (USE_LOCAL) return local.localCreateMultipartUpload();
  const client = r2Client();
  const res = await client.send(
    new CreateMultipartUploadCommand({ Bucket: R2_BUCKET(), Key: key, ContentType: contentType })
  );
  if (!res.UploadId) throw new Error("R2 did not return an UploadId");
  return res.UploadId;
}

export async function presignUploadPart(key: string, uploadId: string, partNumber: number, expiresInSeconds = 3600) {
  if (USE_LOCAL) return local.localPresignUploadPart(uploadId, partNumber, expiresInSeconds);
  const client = r2Client();
  const command = new UploadPartCommand({
    Bucket: R2_BUCKET(),
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { partNumber: number; etag: string }[]
) {
  if (USE_LOCAL) return local.localCompleteMultipartUpload(key, uploadId, parts);
  const client = r2Client();
  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: R2_BUCKET(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
          .sort((a, b) => a.partNumber - b.partNumber)
          .map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
      },
    })
  );
}

export async function abortMultipartUpload(key: string, uploadId: string) {
  if (USE_LOCAL) return local.localAbortMultipartUpload(uploadId);
  const client = r2Client();
  await client.send(new AbortMultipartUploadCommand({ Bucket: R2_BUCKET(), Key: key, UploadId: uploadId }));
}

export async function deleteObject(key: string) {
  if (USE_LOCAL) return local.localDeleteObject(key);
  const client = r2Client();
  await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET(), Key: key }));
}

// R2 has no native cold-storage tier, so Vault archiving is simulated by moving
// objects to a `vault/` prefix in the same bucket (copy + delete of the source key).
// Swapping in a second provider (e.g. Backblaze B2) later only means changing this
// function's destination client/bucket — callers just deal in storage keys.
export function vaultKey(key: string) {
  return key.startsWith("vault/") ? key : `vault/${key}`;
}

export function unvaultKey(key: string) {
  return key.startsWith("vault/") ? key.slice("vault/".length) : key;
}

export async function moveObject(sourceKey: string, destKey: string) {
  if (USE_LOCAL) return local.localMoveObject(sourceKey, destKey);
  const client = r2Client();
  const bucket = R2_BUCKET();
  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${encodeURIComponent(sourceKey)}`,
      Key: destKey,
    })
  );
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: sourceKey }));
}

// Worker-only helpers: download the source to a local temp file, and upload a
// transcoded rendition back. Kept here (rather than inline S3 calls in the
// worker) so the worker doesn't need to know which storage provider is active.
export async function downloadObjectToFile(key: string, destPath: string) {
  if (USE_LOCAL) return local.localDownloadObjectToFile(key, destPath);
  const client = r2Client();
  const res = await client.send(new GetObjectCommand({ Bucket: R2_BUCKET(), Key: key }));
  const body = res.Body;
  if (!body) throw new Error(`Empty response body for ${key}`);
  await new Promise<void>((resolve, reject) => {
    const writeStream = fs.createWriteStream(destPath);
    // @ts-expect-error - Body is a Node Readable stream at runtime in this SDK setup
    body.pipe(writeStream);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
}

// Small objects the server receives directly (e.g. a browser-made photo preview).
export async function putObject(key: string, body: Buffer, contentType: string) {
  if (USE_LOCAL) return local.localPutObject(key, body);
  const client = r2Client();
  await client.send(new PutObjectCommand({ Bucket: R2_BUCKET(), Key: key, Body: body, ContentType: contentType }));
}

export async function uploadObjectFromFile(key: string, sourcePath: string, contentType: string) {
  if (USE_LOCAL) return local.localUploadObjectFromFile(key, sourcePath);
  const client = r2Client();
  const body = await fs.promises.readFile(sourcePath);
  await client.send(new PutObjectCommand({ Bucket: R2_BUCKET(), Key: key, Body: body, ContentType: contentType }));
}
