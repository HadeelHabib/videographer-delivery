// Best-effort in-memory rate limit for a single-instance deployment. Resets on
// restart and won't coordinate across multiple app instances — fine at this
// scale, and cheap insurance against a comment-spam bot hammering one endpoint.
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  hits.set(key, timestamps);
  return timestamps.length > limit;
}
