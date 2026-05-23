import { NextResponse } from "next/server";
import { z } from "zod";
import { approveOutreach } from "@/lib/notion/linkedin";
import { HttpError, requireRole } from "@/lib/auth/session";
import { bust, TAG } from "@/lib/utils/revalidate";

const Body = z.object({
  editedDM: z.string().max(2000).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["Admin", "Staff"]);
    const body = Body.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    await approveOutreach(params.id, body.data.editedDM);
    bust(TAG.linkedin, TAG.activity);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[/api/linkedin/approve]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
