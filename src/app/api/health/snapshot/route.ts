import { NextResponse } from "next/server";
import { getHealthSnapshot } from "@/lib/notion/health";
import { getProductionConfig } from "@/lib/notion/config";
import { HttpError, requireSession } from "@/lib/auth/session";

export async function GET() {
  try {
    await requireSession();
    const [snapshot, config] = await Promise.all([
      getHealthSnapshot(),
      getProductionConfig(),
    ]);
    return NextResponse.json({
      ...snapshot,
      globalPause: config?.globalPause ?? false,
      lastPauseEvent: config?.lastPauseEvent ?? null,
      lastResumeEvent: config?.lastResumeEvent ?? null,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[/api/health/snapshot]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
