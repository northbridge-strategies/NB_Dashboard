import { NextResponse } from "next/server";
import { setGlobalPause } from "@/lib/notion/config";
import { HttpError, requireRole } from "@/lib/auth/session";
import { bust, TAG } from "@/lib/utils/revalidate";

export async function POST() {
  try {
    await requireRole(["Admin"]);
    await setGlobalPause(false);
    bust(TAG.config, TAG.health);
    return NextResponse.json({ ok: true, paused: false });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[/api/system/resume]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
