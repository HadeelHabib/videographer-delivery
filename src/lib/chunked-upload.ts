import { api } from "@/lib/api-client";

const PART_SIZE = 8 * 1024 * 1024; // 8MB per part

export type UploadProgress = { uploadedBytes: number; totalBytes: number };

// Uploads a file directly to R2 in parts. Each part is retried on its own, so a
// dropped connection only costs the in-flight part, not the whole file — the
// caller can call this again with the same mediaId/uploadId and it will pick up
// from `resumeFromPart` instead of re-uploading everything.
export async function uploadFileInParts(
  file: File,
  mediaId: number,
  uploadId: string,
  onProgress: (p: UploadProgress) => void,
  resumeFromPart = 1
) {
  const totalParts = Math.ceil(file.size / PART_SIZE);
  const parts: { partNumber: number; etag: string }[] = [];
  let uploadedBytes = (resumeFromPart - 1) * PART_SIZE;

  for (let partNumber = resumeFromPart; partNumber <= totalParts; partNumber++) {
    const start = (partNumber - 1) * PART_SIZE;
    const end = Math.min(start + PART_SIZE, file.size);
    const blob = file.slice(start, end);

    const { url } = await api.post<{ url: string }>(`/api/media/${mediaId}/upload-part-url`, {
      uploadId,
      partNumber,
    });

    const res = await fetch(url, { method: "PUT", body: blob });
    if (!res.ok) throw new Error(`Failed to upload part ${partNumber}`);
    const etag = res.headers.get("ETag");
    if (!etag) throw new Error("R2 did not return an ETag for the uploaded part");
    parts.push({ partNumber, etag });

    uploadedBytes = end;
    onProgress({ uploadedBytes, totalBytes: file.size });
  }

  await api.post(`/api/media/${mediaId}/complete-upload`, { uploadId, parts });
}
