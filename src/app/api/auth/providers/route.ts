import { NextResponse } from "next/server";
import { googleConfigured } from "@/lib/google-auth";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ google: googleConfigured() });
}
