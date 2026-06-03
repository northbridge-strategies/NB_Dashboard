import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, requireRole } from "@/lib/auth/session";
import { upsertResponse } from "@/lib/notion/tier1";
import { bust, TAG } from "@/lib/utils/revalidate";

const bodySchema = z.object({
  responsePageId: z.string().optional(),
  leadId: z.string().min(1),
  scoreRecordId: z.string().min(1),
  criterionPageId: z.string().min(1),
  criterionCode: z.string().regex(/^G[1-5]C\d+$/),
  gate: z.string().min(1),
  gateWeight: z.number().positive(),
  score: z.number().int().min(1).max(4).nullable().optional(),
  fieldNote: z.string().max(5000).optional(),
  evidenceRequested: z.string().max(2000).optional(),
  residualRiskFlag: z.boolean().optional(),
  severity: z.enum(["Critical", "Weakness", "Acceptable", "Premium"]).optional(),
  priority: z.enum(["Immediate", "90-Day", "12-Month", "Monitor"]).optional(),
  criticalCriterion: z.boolean().optional(),
});

export async function POST(req: Request) {
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

    const pageId = await upsertResponse(parsed.data);
    bust(TAG.tier1);

    return NextResponse.json({ ok: true, pageId });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[/api/tier1/responses]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
