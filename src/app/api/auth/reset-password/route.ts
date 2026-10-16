import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { completePasswordReset, validateResetToken } from "@/lib/password-reset";
import { clientIp } from "@/lib/request-ip";
import { isRateLimited } from "@/lib/rate-limit";

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// GET ?token=... lets the reset page show "link expired" before the user types anything.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const row = token ? await validateResetToken(token) : null;
  return NextResponse.json({ valid: Boolean(row) });
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req) ?? "unknown";
  if (isRateLimited(`reset:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts, please try again later" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).find((m) => m?.length)?.[0];
    return NextResponse.json({ error: first ?? "Invalid request" }, { status: 400 });
  }

  const ok = await completePasswordReset(parsed.data.token, parsed.data.password);
  if (!ok) {
    return NextResponse.json({ error: "This reset link is invalid or has expired" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
