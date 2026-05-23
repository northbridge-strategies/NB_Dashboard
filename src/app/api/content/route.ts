import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createContent,
  type ContentPlatform,
  type ContentStatus,
  type ContentType,
} from "@/lib/notion/content";
import { HttpError, requireRole } from "@/lib/auth/session";
import { bust, TAG } from "@/lib/utils/revalidate";

const Body = z.object({
  title: z.string().min(1).max(200),
  topic: z.string().max(500).optional(),
  contentType: z
    .enum(["LinkedIn Post", "Substack Article", "Video Script", "Ad Copy"])
    .optional(),
  status: z
    .enum(["Draft", "Ready to Publish", "Published", "Archived"])
    .optional(),
  publishDate: z.string().nullable().optional(),
  platform: z.enum(["LinkedIn", "Substack", "YouTube", "Other"]).optional(),
  utmLink: z.string().url().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    await requireRole(["Admin", "Staff"]);
    const body = Body.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json(
        { error: "Invalid body", issues: body.error.issues },
        { status: 400 },
      );
    }
    const id = await createContent({
      title: body.data.title,
      topic: body.data.topic,
      contentType: body.data.contentType as ContentType | undefined,
      status: (body.data.status ?? "Draft") as ContentStatus,
      publishDate: body.data.publishDate ?? null,
      platform: body.data.platform as ContentPlatform | undefined,
      utmLink: body.data.utmLink ?? null,
    });
    bust(TAG.content, TAG.activity);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[/api/content]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
