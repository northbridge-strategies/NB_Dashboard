/**
 * Internal route: called from the dashboard UI (authenticated session).
 * No webhook secret needed — session auth is sufficient.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.lead_id || !body?.score_id) {
    return NextResponse.json({ error: "lead_id and score_id required" }, { status: 400 });
  }

  // Forward to the main generate-report route internally with the server secret
  const secret = process.env.REPORT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "REPORT_WEBHOOK_SECRET not configured" }, { status: 500 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/generate-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lead_id: body.lead_id,
      score_id: body.score_id,
      secret,
    }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
