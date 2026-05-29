import { NextResponse } from "next/server";
import { notion } from "@/lib/notion/client";
import { HttpError, requireRole } from "@/lib/auth/session";
import { bust, TAG } from "@/lib/utils/revalidate";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireRole(["Admin", "Staff"]);

    await notion.pages.update({
      page_id: params.id,
      properties: {
        "Report Delivered": { checkbox: true },
      } as never,
    });

    bust(TAG.scores, TAG.activity);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[/api/scores/[id]/deliver]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
