import { describe, expect, it } from "vitest";
import {
  adminRedirectTarget,
  loginFailureMessage,
  validateEmail,
  validateLogin,
  validatePassword,
} from "@/lib/login-validation";

describe("validateEmail", () => {
  it("accepts ordinary addresses, ignoring surrounding spaces", () => {
    expect(validateEmail("hadeel@example.com")).toBeUndefined();
    expect(validateEmail("  first.last+tag@sub.domain.co  ")).toBeUndefined();
  });

  it("explains what's wrong", () => {
    expect(validateEmail("")).toMatch(/enter your email/i);
    expect(validateEmail("   ")).toMatch(/enter your email/i);
    for (const bad of ["plain", "a@b", "a b@c.com", "@x.com", "a@@x.com"]) {
      expect(validateEmail(bad)).toMatch(/doesn't look like an email/i);
    }
  });
});

describe("validatePassword / validateLogin", () => {
  it("only requires something to be typed (the server decides if it's right)", () => {
    expect(validatePassword("")).toMatch(/enter your password/i);
    expect(validatePassword("x")).toBeUndefined();
  });

  it("collects every problem at once", () => {
    expect(validateLogin("", "")).toEqual({ email: expect.any(String), password: expect.any(String) });
    expect(validateLogin("a@b.co", "pw")).toEqual({});
  });
});

describe("loginFailureMessage", () => {
  it("gives a recovery path for each failure", () => {
    expect(loginFailureMessage(401)).toMatch(/incorrect email or password.*reset/i);
    expect(loginFailureMessage(429)).toMatch(/wait a few minutes/i);
    expect(loginFailureMessage(null)).toMatch(/internet connection/i);
    expect(loginFailureMessage(500)).toMatch(/try again/i);
  });

  it("never says which of the two was wrong", () => {
    expect(loginFailureMessage(401)).not.toMatch(/only the (email|password)/i);
  });
});

describe("adminRedirectTarget", () => {
  it("keeps admin pages and refuses everything else", () => {
    expect(adminRedirectTarget("/admin/dashboard?gallery=3")).toBe("/admin/dashboard?gallery=3");
    expect(adminRedirectTarget(null)).toBe("/admin/overview");
    expect(adminRedirectTarget("/")).toBe("/admin/overview");
    expect(adminRedirectTarget("https://evil.com")).toBe("/admin/overview");
    expect(adminRedirectTarget("//evil.com")).toBe("/admin/overview");
    expect(adminRedirectTarget("/admin/login")).toBe("/admin/overview");
  });
});
