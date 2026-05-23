import "server-only";
import { compare } from "bcryptjs";
import {
  findUserByEmail,
  listUsersFromNotion,
  recordSignIn,
} from "@/lib/notion/users";
import type { SessionUser } from "@/lib/types/auth";

/**
 * Authoritative user store is the Notion "Dashboard Users" database.
 * config/users.json is no longer read at runtime — it remains only as a
 * historical seed input for scripts/notion-migrate-v2-users.py.
 */

export async function listUsers(): Promise<SessionUser[]> {
  const users = await listUsersFromNotion();
  return users
    .filter((u) => u.active)
    .map((u) => ({
      id: u.pageId,
      name: u.name,
      email: u.email,
      role: u.role,
    }));
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const user = await findUserByEmail(email);
  if (!user || !user.active) return null;
  const ok = await compare(password, user.passwordHash);
  if (!ok) return null;
  // Record sign-in async — don't block login on a Notion write.
  void recordSignIn(user.pageId);
  return {
    id: user.pageId,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
