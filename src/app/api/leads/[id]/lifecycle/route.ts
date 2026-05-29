import { NextResponse } from "next/server";
import { z } from "zod";
import { updateLeadLifecycle } from "@/lib/notion/leads";
import { HttpError, requireRole } from "@/lib/auth/session";
import { bust, TAG } from "@/lib/utils/revalidate";

const LIFECYCLE_STATES = [
  "Lead",
  "Qualified",
  "Engaged",
  "Paid",
  "Active",
  "Complete",
  "Closed Lost",
] as const;

const bodySchema = z.object({
  lifecycleState: z.enum(LIFECYCLE_STATES),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireRole(["Admin", "Staff"]);

    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    await updateLeadLifecycle(params.id, parsed.data.lifecycleState);
    bust(TAG.leads, TAG.activity);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[/api/leads/[id]/lifecycle]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
