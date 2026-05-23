import "server-only";
import { notion } from "./client";
import { DB } from "./ids";
import { cached, TAG } from "./cache";
import {
  getCheckbox,
  getDate,
  getRichText,
  getSelect,
  getTitle,
  getUrl,
  isFullPage,
  type Page,
} from "./parsers";
import type { Role } from "@/lib/types/auth";

export interface DashboardUser {
  pageId: string;
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  avatarUrl: string | null;
  active: boolean;
  createdTime: string;
  lastSignIn: string | null;
}

export function parseUser(page: Page): DashboardUser {
  return {
    pageId: page.id,
    email: getTitle(page, "Email").toLowerCase().trim(),
    name: getRichText(page, "Name"),
    role: (getSelect(page, "Role") as Role | null) ?? "Staff",
    passwordHash: getRichText(page, "Password Hash"),
    avatarUrl: getUrl(page, "Avatar URL"),
    active: getCheckbox(page, "Active"),
    createdTime: page.created_time,
    lastSignIn: getDate(page, "Last Sign-In"),
  };
}

/**
 * Find a user by email. Email is the title field, queried with `title.equals`.
 * Cached briefly so login attempts don't hammer Notion on every keystroke.
 */
export const findUserByEmail = cached(
  async (email: string): Promise<DashboardUser | null> => {
    const normalized = email.toLowerCase().trim();
    const res = await notion.databases.query({
      database_id: DB.users,
      filter: { property: "Email", title: { equals: normalized } },
      page_size: 1,
    });
    const page = res.results[0];
    if (!page || !isFullPage(page)) return null;
    return parseUser(page);
  },
  ["users:by-email"],
  { tags: [TAG.users], revalidate: 30 },
);

export const findUserById = cached(
  async (pageId: string): Promise<DashboardUser | null> => {
    const page = await notion.pages.retrieve({ page_id: pageId });
    if (!isFullPage(page)) return null;
    return parseUser(page);
  },
  ["users:by-id"],
  { tags: [TAG.users], revalidate: 30 },
);

export const listUsersFromNotion = cached(
  async (): Promise<DashboardUser[]> => {
    const res = await notion.databases.query({
      database_id: DB.users,
      page_size: 100,
      sorts: [{ timestamp: "created_time", direction: "ascending" }],
    });
    return res.results.filter(isFullPage).map(parseUser);
  },
  ["users:list"],
  { tags: [TAG.users] },
);

export async function updateUserProfile(
  pageId: string,
  patch: { name?: string; avatarUrl?: string | null },
): Promise<void> {
  const props: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    props.Name = {
      rich_text: [{ type: "text", text: { content: patch.name } }],
    };
  }
  if (patch.avatarUrl !== undefined) {
    props["Avatar URL"] = { url: patch.avatarUrl || null };
  }
  if (Object.keys(props).length === 0) return;
  await notion.pages.update({ page_id: pageId, properties: props as never });
}

export async function updateUserPasswordHash(
  pageId: string,
  newHash: string,
): Promise<void> {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      "Password Hash": {
        rich_text: [{ type: "text", text: { content: newHash } }],
      },
    } as never,
  });
}

export async function recordSignIn(pageId: string): Promise<void> {
  // Best-effort — never block the login flow on this.
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        "Last Sign-In": {
          date: { start: new Date().toISOString() },
        },
      } as never,
    });
  } catch (e) {
    console.error("[recordSignIn] failed:", e);
  }
}
