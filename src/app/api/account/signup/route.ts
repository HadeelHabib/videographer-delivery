import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createUserSession } from "@/lib/user-session";
import { sendVerificationEmail } from "@/lib/email-verification";
import { clientIp } from "@/lib/request-ip";
import { isRateLimited } from "@/lib/rate-limit";

const bodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req) ?? "unknown";
  if (isRateLimited(`signup:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts, please try again later" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const message = parsed.error.flatten().fieldErrors;
    const first = Object.values(message).find((m) => m?.length)?.[0];
    return NextResponse.json({ error: first ?? "Invalid request" }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { email, name, passwordHash: await hashPassword(password) },
  });

  await sendVerificationEmail(user);
  await createUserSession({ userId: user.id, email: user.email });

  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } }, { status: 201 });
}
