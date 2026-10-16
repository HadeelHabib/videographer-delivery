import { describe, expect, it } from "vitest";
import { isSessionStale } from "@/lib/session-staleness";

const changed = new Date("2026-10-17T10:00:00.500Z");
const sec = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

describe("isSessionStale", () => {
  it("never expires sessions for accounts that never changed their password", () => {
    expect(isSessionStale(sec("2020-01-01T00:00:00Z"), null)).toBe(false);
  });

  it("rejects a session issued before the password change", () => {
    expect(isSessionStale(sec("2026-10-17T09:59:59Z"), changed)).toBe(true);
  });

  it("accepts a login in the same second as the change, and anything later", () => {
    expect(isSessionStale(sec("2026-10-17T10:00:00Z"), changed)).toBe(false);
    expect(isSessionStale(sec("2026-10-17T10:05:00Z"), changed)).toBe(false);
  });

  it("rejects a token with no issued-at once a password has changed", () => {
    expect(isSessionStale(undefined, changed)).toBe(true);
  });
});
