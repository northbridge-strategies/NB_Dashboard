import { NextResponse } from "next/server";
import { approveBroker } from "@/lib/notion/brokers";
import { HttpError, requireRole } from "@/lib/auth/session";
import { bust, TAG } from "@/lib/utils/revalidate";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["Admin", "Staff"]);
    await approveBroker(params.id);
    bust(TAG.brokers, TAG.activity);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[/api/brokers/approve]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
