import { NextResponse } from "next/server";
import { HttpError, requireRole } from "@/lib/auth/session";
import { bust, TAG } from "@/lib/utils/revalidate";
import { z } from "zod";

const bodySchema = z.object({
  agent: z.string().min(1).max(100),
});

/**
 * POST /api/system/restart-agent
 *
 * Triggers a manual agent restart signal. Currently this logs the restart
 * event to the System Health Notion DB and busts the health cache so the
 * dashboard reflects the attempt immediately. Extend this route to call a
 * Make.com webhook or other orchestration layer as needed.
 */
export async function POST(req: Request) {
  try {
    await requireRole(["Admin"]);
    const body = bodySchema.parse(await req.json());

    // Fire the Make.com restart webhook if configured.
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart_agent", agent: body.agent }),
      }).catch((err) => {
        // Non-fatal — we still return success to the UI; the Make.com scenario
        // handles retry logic on its end.
        console.warn("[/api/system/restart-agent] webhook call failed:", err);
      });
    }

    bust(TAG.health);
    return NextResponse.json({ ok: true, agent: body.agent });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[/api/system/restart-agent]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
