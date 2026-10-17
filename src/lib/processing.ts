// NEXT_PUBLIC_PROCESSING="none" runs the platform with no conversion server at all: videos
// are delivered exactly as uploaded and each photo gets one 2048px preview made in the
// admin's browser. Any other value (default) keeps the ffmpeg/sharp worker pipeline.
// It's NEXT_PUBLIC_ so the upload UI and the API agree; changing it needs a rebuild.
export const WORKER_ENABLED = process.env.NEXT_PUBLIC_PROCESSING !== "none";
