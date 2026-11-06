import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { clientIp } from "@/lib/request-ip";
import { isRateLimited } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  // The admin login is public on the internet — slow down password guessing.
  if (isRateLimited(`admin-login:${clientIp(req) ?? "unknown"}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts, please try again later" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const photographer = await prisma.photographer.findUnique({ where: { email } });
  if (!photographer) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(password, photographer.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await createSession({ photographerId: photographer.id, email: photographer.email });

  return NextResponse.json({ ok: true });
}
