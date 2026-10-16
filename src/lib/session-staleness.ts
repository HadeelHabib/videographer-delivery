// A session JWT issued before the account's last password change must stop working,
// so resetting a leaked password also logs out whoever had the old session.
// iat is in whole seconds, so compare against the change time floored to seconds:
// a login right after the change (same second) stays valid.
export function isSessionStale(iatSeconds: number | undefined, passwordChangedAt: Date | null) {
  if (!passwordChangedAt) return false;
  if (typeof iatSeconds !== "number") return true;
  return iatSeconds < Math.floor(passwordChangedAt.getTime() / 1000);
}
