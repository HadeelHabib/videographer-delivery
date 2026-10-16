import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { readUnsubscribeToken } from "@/lib/unsubscribe";
import { clientIp } from "@/lib/request-ip";
import { isRateLimited } from "@/lib/rate-limit";

const bodySchema = z.object({ token: z.string().min(1) });

// POST only, so mail scanners that prefetch links can't unsubscribe people by accident.
export async function POST(req: NextRequest) {
  if (isRateLimited(`unsubscribe:${clientIp(req) ?? "unknown"}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts, please try again later" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const userId = await readUnsubscribeToken(parsed.data.token);
  if (userId === null) return NextResponse.json({ error: "This unsubscribe link is invalid" }, { status: 400 });

  await prisma.user.updateMany({ where: { id: userId }, data: { newWorkEmails: false } });
  return NextResponse.json({ ok: true });
}
