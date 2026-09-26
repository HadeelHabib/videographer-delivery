import "dotenv/config";
import fs_promises from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import sharp from "sharp";
import { prisma } from "../../src/lib/prisma";
import { downloadObjectToFile, uploadObjectFromFile } from "../../src/lib/r2";
import {
  VIDEO_RENDITION_SETTINGS,
  PHOTO_RENDITION_SETTINGS,
  isVideoQuality,
  isPhotoQuality,
} from "../../src/lib/constants";

if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}

const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 5000);
const TMP_DIR = process.env.WORKER_TMP_DIR ?? path.join(os.tmpdir(), "photo-delivery-worker");
const MAX_ATTEMPTS = 3;

async function ensureTmpDir() {
  await fs_promises.mkdir(TMP_DIR, { recursive: true });
}

function transcodeVideo(inputPath: string, outputPath: string, quality: string) {
  if (!isVideoQuality(quality)) throw new Error(`Not a video quality: ${quality}`);
  const settings = VIDEO_RENDITION_SETTINGS[quality];
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec("libx264")
      .size(settings.size)
      .outputOptions([`-crf ${settings.crf}`, "-preset fast"])
      .audioCodec("aac")
      .audioBitrate("128k")
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
}

async function resizePhoto(inputPath: string, outputPath: string, quality: string) {
  if (!isPhotoQuality(quality)) throw new Error(`Not a photo quality: ${quality}`);
  const settings = PHOTO_RENDITION_SETTINGS[quality];
  await sharp(inputPath)
    .rotate() // apply EXIF orientation before resizing, then strip it
    .resize({
      width: settings.longEdge,
      height: settings.longEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: settings.jpegQuality, mozjpeg: true })
    .toFile(outputPath);
}

async function processJob(jobId: number) {
  const job = await prisma.processingJob.update({
    where: { id: jobId },
    data: { status: "processing", startedAt: new Date(), attempts: { increment: 1 } },
    include: { rendition: { include: { media: true } } },
  });

  const rendition = job.rendition;
  await prisma.mediaRendition.update({ where: { id: rendition.id }, data: { status: "processing" } });

  const original = await prisma.mediaRendition.findFirst({
    where: { mediaId: rendition.mediaId, quality: "original" },
  });
  if (!original) throw new Error(`No original rendition found for media ${rendition.mediaId}`);

  const isPhoto = rendition.media.type === "photo";
  const inputPath = path.join(TMP_DIR, `${rendition.id}-input${path.extname(original.storageKey) || ".mov"}`);
  const outputPath = path.join(TMP_DIR, `${rendition.id}-output${isPhoto ? ".jpg" : ".mp4"}`);

  try {
    console.log(`[job ${jobId}] downloading original for media ${rendition.mediaId}`);
    await downloadObjectToFile(original.storageKey, inputPath);

    console.log(`[job ${jobId}] ${isPhoto ? "resizing" : "transcoding"} to ${rendition.quality}`);
    if (isPhoto) {
      await resizePhoto(inputPath, outputPath, rendition.quality);
    } else {
      await transcodeVideo(inputPath, outputPath, rendition.quality);
    }

    console.log(`[job ${jobId}] uploading ${rendition.storageKey}`);
    await uploadObjectFromFile(rendition.storageKey, outputPath, isPhoto ? "image/jpeg" : "video/mp4");

    const stats = await fs_promises.stat(outputPath);

    await prisma.mediaRendition.update({
      where: { id: rendition.id },
      data: { status: "ready", fileSizeBytes: BigInt(stats.size) },
    });
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: "completed", completedAt: new Date() },
    });

    const remainingPending = await prisma.mediaRendition.count({
      where: { mediaId: rendition.mediaId, status: { in: ["queued", "processing"] } },
    });
    if (remainingPending === 0) {
      await prisma.media.update({ where: { id: rendition.mediaId }, data: { status: "ready" } });
    }

    console.log(`[job ${jobId}] done`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[job ${jobId}] failed: ${message}`);

    const shouldRetry = job.attempts < MAX_ATTEMPTS;
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: shouldRetry ? "queued" : "failed", errorMessage: message },
    });
    await prisma.mediaRendition.update({
      where: { id: rendition.id },
      data: { status: shouldRetry ? "queued" : "failed" },
    });
    if (!shouldRetry) {
      await prisma.media.update({ where: { id: rendition.mediaId }, data: { status: "failed" } });
    }
  } finally {
    await fs_promises.rm(inputPath, { force: true });
    await fs_promises.rm(outputPath, { force: true });
  }
}

async function pollOnce() {
  const job = await prisma.processingJob.findFirst({
    where: { status: "queued" },
    orderBy: { createdAt: "asc" },
  });
  if (!job) return false;
  await processJob(job.id);
  return true;
}

async function main() {
  await ensureTmpDir();
  console.log(`Worker started. Polling every ${POLL_INTERVAL_MS}ms.`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const processed = await pollOnce();
      if (!processed) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    } catch (err) {
      console.error("Worker loop error:", err);
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
}

main();
