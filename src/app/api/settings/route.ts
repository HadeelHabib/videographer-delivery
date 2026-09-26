import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";

const PROFILE_SELECT = {
  id: true,
  email: true,
  name: true,
  tagline: true,
  bio: true,
  defaultLogoUrl: true,
  defaultBrandColor: true,
} as const;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const photographer = await prisma.photographer.findUnique({
    where: { id: session.photographerId },
    select: PROFILE_SELECT,
  });
  return NextResponse.json({ photographer });
}

const bodySchema = z.object({
  name: z.string().min(1).optional(),
  tagline: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  defaultLogoUrl: z.string().url().optional().or(z.literal("")),
  defaultBrandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const photographer = await prisma.photographer.findUnique({ where: { id: session.photographerId } });
  if (!photographer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let passwordHash: string | undefined;
  if (data.newPassword) {
    if (!data.currentPassword || !(await verifyPassword(data.currentPassword, photographer.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    passwordHash = await hashPassword(data.newPassword);
  }

  const updated = await prisma.photographer.update({
    where: { id: session.photographerId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.tagline !== undefined ? { tagline: data.tagline || null } : {}),
      ...(data.bio !== undefined ? { bio: data.bio || null } : {}),
      ...(data.defaultLogoUrl !== undefined ? { defaultLogoUrl: data.defaultLogoUrl || null } : {}),
      ...(data.defaultBrandColor !== undefined ? { defaultBrandColor: data.defaultBrandColor } : {}),
      ...(passwordHash ? { passwordHash } : {}),
    },
    select: PROFILE_SELECT,
  });

  return NextResponse.json({ photographer: updated });
}
