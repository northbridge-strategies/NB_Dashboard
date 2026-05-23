import { NextResponse } from "next/server";
import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { findUserById, updateUserPasswordHash } from "@/lib/notion/users";
import { HttpError, requireSession } from "@/lib/auth/session";
import { bust, TAG } from "@/lib/utils/revalidate";

const Body = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export async function PUT(req: Request) {
  try {
    const session = await requireSession();
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.path[0] === "newPassword"
              ? "New password must be at least 8 characters"
              : "Invalid body",
        },
        { status: 400 },
      );
    }
    const { currentPassword, newPassword } = parsed.data;

    const user = await findUserById(session.id);
    if (!user) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const ok = await compare(currentPassword, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    const newHash = await hash(newPassword, 10);
    await updateUserPasswordHash(session.id, newHash);
    bust(TAG.users);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[/api/profile/password PUT]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
