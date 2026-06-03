import { NextResponse } from "next/server";
import { z } from "zod";
import { notion } from "@/lib/notion/client";
import { HttpError, requireRole } from "@/lib/auth/session";
import { bust, TAG } from "@/lib/utils/revalidate";

const bodySchema = z.object({
  scoreRecordId: z.string().min(1),
});

/**
 * POST /api/tier1/complete
 *
 * Marks scoring as complete by setting Tier I Draft Requested = true on the
 * Diagnostic Score record. This triggers Agent 3 in Make.com via an Airtable
 * automation webhook (or can be wired to the Make.com webhook directly).
 */
export async function POST(req: Request) {
  try {
    await requireRole(["Admin", "Staff"]);

    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "scoreRecordId required" }, { status: 400 });
    }

    // Set Tier I Draft Requested checkbox on the Diagnostic Scores record
    await notion.pages.update({
      page_id: parsed.data.scoreRecordId,
      properties: {
        "Tier I Draft Requested": { checkbox: true },
        "Tier I Draft Requested At": { date: { start: new Date().toISOString() } },
      } as never,
    });

    bust(TAG.scores, TAG.tier1);

    // If MAKE_WEBHOOK_URL is configured, fire Agent 3 trigger
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tier1_draft_requested",
          scoreRecordId: parsed.data.scoreRecordId,
        }),
      }).catch(err => console.warn("[/api/tier1/complete] webhook failed:", err));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[/api/tier1/complete]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
