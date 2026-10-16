import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/password-reset";
import { clientIp } from "@/lib/request-ip";
import { isRateLimited } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  type: z.enum(["admin", "user"]),
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req) ?? "unknown";
  if (isRateLimited(`forgot:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts, please try again later" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });

  const { email, type } = parsed.data;
  if (isRateLimited(`forgot-email:${type}:${email.toLowerCase()}`, 3, 60 * 60 * 1000)) {
    // Same success shape: don't let the limiter reveal which emails exist.
    return NextResponse.json({ ok: true });
  }

  await requestPasswordReset(type, email);
  return NextResponse.json({ ok: true });
}
