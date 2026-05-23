import { NextResponse } from "next/server";
import { updateScoreHITL } from "@/lib/notion/scores";
import { HttpError, requireRole } from "@/lib/auth/session";
import { bust, TAG } from "@/lib/utils/revalidate";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["Admin", "Staff"]);
    await updateScoreHITL(params.id, "Approved");
    bust(TAG.scores, TAG.activity);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[/api/scores/approve]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
