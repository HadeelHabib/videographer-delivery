import { NextRequest, NextResponse } from "next/server";
import { verifyLocalStorageToken, localWritePart } from "@/lib/local-storage";

// Stands in for an R2 presigned part-upload URL: the browser PUTs raw bytes
// here (same-origin, no CORS setup needed) and gets an ETag back, exactly like
// chunked-upload.ts expects from a real S3 UploadPart response.
export async function PUT(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const payload = token ? await verifyLocalStorageToken(token) : null;
  if (!payload || payload.action !== "put-part") {
    return NextResponse.json({ error: "Invalid or expired upload link" }, { status: 401 });
  }

  const buffer = Buffer.from(await req.arrayBuffer());
  const etag = await localWritePart(payload.uploadId, payload.partNumber, buffer);

  return new NextResponse(null, { status: 200, headers: { ETag: etag } });
}
