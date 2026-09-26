import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { mediaStorageKey, createMultipartUpload } from "@/lib/r2";

const bodySchema = z.object({
  type: z.enum(["video", "photo"]),
  originalFilename: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
  contentType: z.string().min(1),
  durationSeconds: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

// Registers a new upload: creates the Media row and opens an R2 multipart upload
// for the original file. The client then requests presigned part URLs and uploads
// directly to R2, never through this server.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const galleryId = Number((await params).id);
  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery || gallery.photographerId !== session.photographerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const media = await prisma.media.create({
    data: {
      galleryId,
      type: data.type,
      originalFilename: data.originalFilename,
      fileSizeBytes: BigInt(data.fileSizeBytes),
      durationSeconds: data.durationSeconds,
      width: data.width,
      height: data.height,
      status: "uploading",
    },
  });

  const ext = data.originalFilename.includes(".") ? data.originalFilename.split(".").pop() : "bin";
  const storageKey = mediaStorageKey(galleryId, media.id, `original.${ext}`);
  const uploadId = await createMultipartUpload(storageKey, data.contentType);

  return NextResponse.json({ media, storageKey, uploadId }, { status: 201 });
}
