import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/request-ip";
import { isRateLimited } from "@/lib/rate-limit";

const bodySchema = z.object({
  name: z.string().max(255).optional(),
  body: z.string().min(1).max(2000),
  // Honeypot field: real visitors never fill this in (it's hidden via CSS),
  // bots that auto-fill every input do — silently drop those instead of erroring.
  website: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;

  const ip = clientIp(req) ?? "unknown";
  if (isRateLimited(`comment:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many comments, please try again later" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.website) {
    // Honeypot tripped — pretend success so the bot doesn't learn anything.
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const comment = await prisma.comment.create({
    data: {
      category,
      visitorName: parsed.data.name || null,
      body: parsed.data.body,
      status: "pending",
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
