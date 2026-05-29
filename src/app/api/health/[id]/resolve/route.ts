import { NextResponse } from "next/server";
import { notion } from "@/lib/notion/client";
import { HttpError, requireSession } from "@/lib/auth/session";
import { bust, TAG } from "@/lib/utils/revalidate";
import { z } from "zod";

const bodySchema = z.object({
  resolutionNotes: z.string().max(2000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireSession();
    const { id } = params;
    const body = bodySchema.parse(await req.json().catch(() => ({})));

    const properties: Record<string, unknown> = {
      Resolved: { checkbox: true },
    };
    if (body.resolutionNotes) {
      properties["Resolution Notes"] = {
        rich_text: [{ type: "text", text: { content: body.resolutionNotes } }],
      };
    }

    await notion.pages.update({ page_id: id, properties: properties as never });
    bust(TAG.health);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[/api/health/[id]/resolve]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
