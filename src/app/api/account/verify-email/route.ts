import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailToken } from "@/lib/email-verification";
import { clientIp } from "@/lib/request-ip";
import { isRateLimited } from "@/lib/rate-limit";

const bodySchema = z.object({ token: z.string().min(1) });

// POST (not GET) so mail scanners that prefetch links can't burn the token.
export async function POST(req: NextRequest) {
  const ip = clientIp(req) ?? "unknown";
  if (isRateLimited(`verify-email:${ip}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts, please try again later" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  if (!(await verifyEmailToken(parsed.data.token))) {
    return NextResponse.json({ error: "This confirmation link is invalid or has expired" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
