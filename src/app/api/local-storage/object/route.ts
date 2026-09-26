import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { verifyLocalStorageToken, objectPath, guessContentType } from "@/lib/local-storage";

// Stands in for an R2 presigned GET URL. Supports Range requests so video
// scrubbing works the same way it would against real object storage.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const payload = token ? await verifyLocalStorageToken(token) : null;
  if (!payload || payload.action !== "get") {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 401 });
  }

  const filePath = objectPath(payload.key);
  const stat = await fsp.stat(filePath).catch(() => null);
  if (!stat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = guessContentType(payload.key);
  const headers = new Headers({
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=0",
  });
  if (payload.filename) {
    headers.set("Content-Disposition", `attachment; filename="${payload.filename.replace(/"/g, "")}"`);
  }

  const range = req.headers.get("range");
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Number(match[2]) : stat.size - 1;
    const chunkSize = end - start + 1;

    headers.set("Content-Range", `bytes ${start}-${end}/${stat.size}`);
    headers.set("Content-Length", String(chunkSize));

    const stream = fs.createReadStream(filePath, { start, end });
    return new NextResponse(webStreamFrom(stream), { status: 206, headers });
  }

  headers.set("Content-Length", String(stat.size));
  const stream = fs.createReadStream(filePath);
  return new NextResponse(webStreamFrom(stream), { status: 200, headers });
}

function webStreamFrom(nodeStream: fs.ReadStream): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });
}
