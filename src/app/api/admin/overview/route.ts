import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { RANGE_OPTIONS, getOverview } from "@/lib/admin-overview";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requested = Number(req.nextUrl.searchParams.get("days"));
  const days = (RANGE_OPTIONS as readonly number[]).includes(requested) ? requested : 30;

  return NextResponse.json(await getOverview(session.photographerId, days));
}
