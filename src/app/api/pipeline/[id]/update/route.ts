import { NextResponse } from "next/server";
import { z } from "zod";
import { updatePipelineEntry } from "@/lib/notion/pipeline";
import { HttpError, requireRole } from "@/lib/auth/session";
import { bust, TAG } from "@/lib/utils/revalidate";
import { ALL_PIPELINE_STAGES, type PipelineStage } from "@/lib/types/domain";

const bodySchema = z.object({
  stage: z.enum(ALL_PIPELINE_STAGES as [PipelineStage, ...PipelineStage[]]).optional(),
  priority: z.enum(["Hot", "Warm", "Cold"]).optional(),
  callOutcome: z.string().max(100).nullable().optional(),
  nextAction: z.string().max(100).nullable().optional(),
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

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[/api/pipeline/[id]/update]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
