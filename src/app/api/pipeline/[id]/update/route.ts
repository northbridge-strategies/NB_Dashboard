import { NextResponse } from "next/server";
import { z } from "zod";
import { updatePipelineEntry } from "@/lib/notion/pipeline";
import { HttpError, requireRole } from "@/lib/auth/session";
import { bust, TAG } from "@/lib/utils/revalidate";
import { ALL_PIPELINE_STAGES, type PipelineStage } from "@/lib/types/domain";

/**
 * Fire Agent 6 via Make.com webhook when Doug marks a Call Outcome on a
 * Call Completed pipeline entry. The webhook payload mirrors what Agent 6
 * expects: entryId, callOutcome, and the lead's stage.
 */
async function triggerAgent6(entryId: string, callOutcome: string, stage: string) {
  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "post_call_outcome",
      entryId,
      callOutcome,
      stage,
    }),
  }).catch((err) => {
    console.warn("[pipeline/update] Agent 6 webhook failed:", err);
  });
}

const bodySchema = z.object({
  stage: z.enum(ALL_PIPELINE_STAGES as [PipelineStage, ...PipelineStage[]]).optional(),
  priority: z.enum(["Hot", "Warm", "Cold"]).optional(),
  callOutcome: z.enum(["Interested-Moving to Purchase", "Needs More Time", "Not a Fit", "No Show"]).nullable().optional(),
  meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  notes: z.string().max(5000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireRole(["Admin", "Staff"]);

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    await updatePipelineEntry(params.id, parsed.data);
    bust(TAG.pipeline, TAG.activity);

    // Trigger Agent 6 when a Call Outcome is set and the stage is Call Completed
    if (
      parsed.data.callOutcome &&
      (parsed.data.stage === "Call Completed" ||
        // Also fire if the stage wasn't changed but caller passed the current stage as context
        parsed.data.stage === undefined)
    ) {
      // Only fire if callOutcome was explicitly set in this update
      if ("callOutcome" in parsed.data && parsed.data.callOutcome) {
        void triggerAgent6(
          params.id,
          parsed.data.callOutcome,
          parsed.data.stage ?? "Call Completed",
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const msg =
      err instanceof Error ? err.message : "Internal error";
    console.error("[/api/pipeline/[id]/update]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
