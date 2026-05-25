import { NextRequest, NextResponse } from "next/server";
import { generateReport } from "@/lib/report/generate";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const secret = process.env.REPORT_WEBHOOK_SECRET;
  if (!secret || body.secret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lead_id, score_id } = body as { lead_id?: string; score_id?: string };
  if (!lead_id || !score_id) {
    return NextResponse.json({ error: "lead_id and score_id are required" }, { status: 400 });
  }

  try {
    const result = await generateReport(lead_id, score_id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
