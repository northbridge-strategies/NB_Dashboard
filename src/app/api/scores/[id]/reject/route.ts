import { NextResponse } from "next/server";
import { z } from "zod";
import { updateScoreHITL } from "@/lib/notion/scores";
import { HttpError, requireRole } from "@/lib/auth/session";
import { bust, TAG } from "@/lib/utils/revalidate";

const Body = z.object({
  notes: z.string().max(2000).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["Admin", "Staff"]);
    const body = Body.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    await updateScoreHITL(params.id, "Rejected-Manual Review", body.data.notes);
    bust(TAG.scores, TAG.activity);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[/api/scores/reject]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
