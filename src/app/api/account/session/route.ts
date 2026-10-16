import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-session";

export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, emailVerifiedAt: true },
  });
  if (!user) return NextResponse.json({ user: null });

  const { emailVerifiedAt, ...rest } = user;
  return NextResponse.json({ user: { ...rest, emailVerified: Boolean(emailVerifiedAt) } });
}
