import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, response: null };
}
