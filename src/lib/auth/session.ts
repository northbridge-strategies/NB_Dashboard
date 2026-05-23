import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import type { Role, SessionUser } from "@/lib/types/auth";

export async function getSession(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email,
    role: session.user.role,
  };
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new HttpError(401, "Unauthenticated");
  return user;
}

export async function requireRole(allowed: Role[]): Promise<SessionUser> {
  const user = await requireSession();
  if (!allowed.includes(user.role)) throw new HttpError(403, "Forbidden");
  return user;
}
