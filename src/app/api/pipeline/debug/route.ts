import { NextResponse } from "next/server";
import { notion } from "@/lib/notion/client";
import { DB } from "@/lib/notion/ids";
import { requireRole, HttpError } from "@/lib/auth/session";

/**
 * Temporary diagnostic route — Admin only.
 * GET /api/pipeline/debug
 * Returns the raw Notion schema for the Pipeline database so we can see
 * exact property names and select option values.
 */
export async function GET() {
  try {
    await requireRole(["Admin"]);

    const db = await notion.databases.retrieve({ database_id: DB.pipeline });

    // Extract just property names + types + select options (safe to expose to Admin)
    const props = Object.entries(
      (db as { properties: Record<string, { type: string; select?: { options: { name: string }[] } }> }).properties
    ).map(([name, prop]) => ({
      name,
      type: prop.type,
      options: prop.select?.options?.map((o) => o.name) ?? undefined,
    }));

    return NextResponse.json({ ok: true, properties: props });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
