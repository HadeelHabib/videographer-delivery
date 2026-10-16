import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-session";
import { sendVerificationEmail } from "@/lib/email-verification";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  if (isRateLimited(`resend-verification:${session.userId}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests, please try again later" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, emailVerifiedAt: true },
  });
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  if (user.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true });

  await sendVerificationEmail(user);
  return NextResponse.json({ ok: true });
}
