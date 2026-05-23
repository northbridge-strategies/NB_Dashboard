import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserById, updateUserProfile } from "@/lib/notion/users";
import { HttpError, requireSession } from "@/lib/auth/session";
import { bust, TAG } from "@/lib/utils/revalidate";

const Body = z.object({
  name: z.string().min(1).max(120).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const user = await findUserById(session.id);
    if (!user) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: user.pageId,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdTime: user.createdTime,
      lastSignIn: user.lastSignIn,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[/api/profile GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = Body.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json(
        { error: "Invalid body", issues: body.error.issues },
        { status: 400 },
      );
    }
    // Users can only edit their OWN profile via this route — page id from session.
    await updateUserProfile(session.id, body.data);
    bust(TAG.users);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[/api/profile PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
