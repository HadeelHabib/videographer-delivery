import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const comments = await prisma.comment.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ comments });
}
