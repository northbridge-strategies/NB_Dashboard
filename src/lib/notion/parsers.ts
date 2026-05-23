import "server-only";
import type {
  DatabaseObjectResponse,
  PageObjectResponse,
  PartialDatabaseObjectResponse,
  PartialPageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

/**
 * Generic, defensive parsers for Notion property values.
 * Every helper returns null/empty on missing or wrong-typed properties — never throws.
 * The caller already trusts the page came from a known DB; these helpers absorb shape drift.
 */

export type Page = PageObjectResponse;

type AnyResponse =
  | PageObjectResponse
  | PartialPageObjectResponse
  | DatabaseObjectResponse
  | PartialDatabaseObjectResponse;

export function isFullPage(page: AnyResponse): page is PageObjectResponse {
  return page.object === "page" && "properties" in page;
}

function prop(page: Page, name: string): unknown {
  return (page.properties as Record<string, unknown>)[name];
}

export function getTitle(page: Page, name: string): string {
  const p = prop(page, name) as { type?: string; title?: { plain_text: string }[] };
  if (p?.type !== "title") return "";
  return (p.title ?? []).map((t) => t.plain_text).join("");
}

export function getRichText(page: Page, name: string): string {
  const p = prop(page, name) as {
    type?: string;
    rich_text?: { plain_text: string }[];
  };
  if (p?.type !== "rich_text") return "";
  return (p.rich_text ?? []).map((t) => t.plain_text).join("");
}

export function getNumber(page: Page, name: string): number | null {
  const p = prop(page, name) as { type?: string; number?: number | null };
  if (p?.type !== "number") return null;
  return p.number ?? null;
}

export function getSelect(page: Page, name: string): string | null {
  const p = prop(page, name) as {
    type?: string;
    select?: { name: string } | null;
  };
  if (p?.type !== "select") return null;
  return p.select?.name ?? null;
}

export function getMultiSelect(page: Page, name: string): string[] {
  const p = prop(page, name) as {
    type?: string;
    multi_select?: { name: string }[];
  };
  if (p?.type !== "multi_select") return [];
  return (p.multi_select ?? []).map((s) => s.name);
}

export function getCheckbox(page: Page, name: string): boolean {
  const p = prop(page, name) as { type?: string; checkbox?: boolean };
  if (p?.type !== "checkbox") return false;
  return Boolean(p.checkbox);
}

export function getDate(page: Page, name: string): string | null {
  const p = prop(page, name) as {
    type?: string;
    date?: { start: string } | null;
  };
  if (p?.type !== "date") return null;
  return p.date?.start ?? null;
}

export function getEmail(page: Page, name: string): string | null {
  const p = prop(page, name) as { type?: string; email?: string | null };
  if (p?.type !== "email") return null;
  return p.email ?? null;
}

export function getPhone(page: Page, name: string): string | null {
  const p = prop(page, name) as { type?: string; phone_number?: string | null };
  if (p?.type !== "phone_number") return null;
  return p.phone_number ?? null;
}

export function getUrl(page: Page, name: string): string | null {
  const p = prop(page, name) as { type?: string; url?: string | null };
  if (p?.type !== "url") return null;
  return p.url ?? null;
}

export function getRelationIds(page: Page, name: string): string[] {
  const p = prop(page, name) as {
    type?: string;
    relation?: { id: string }[];
  };
  if (p?.type !== "relation") return [];
  return (p.relation ?? []).map((r) => r.id);
}

export function getCreatedTime(page: Page, name: string): string | null {
  const p = prop(page, name) as { type?: string; created_time?: string };
  if (p?.type !== "created_time") return null;
  return p.created_time ?? null;
}

/**
 * Rollup that returns a single select-like value (e.g., the `Priority` rollup
 * over Pipeline's Priority select with `show_original`).
 *
 * Notion returns rollup results as `array` of property values when source is
 * a select — we extract the first one's name.
 */
export function getRollupSelect(page: Page, name: string): string | null {
  const p = prop(page, name) as {
    type?: string;
    rollup?: {
      type: string;
      array?: { type: string; select?: { name: string } | null }[];
      number?: number;
    };
  };
  if (p?.type !== "rollup") return null;
  const arr = p.rollup?.array ?? [];
  for (const item of arr) {
    if (item.type === "select" && item.select?.name) return item.select.name;
  }
  return null;
}

/**
 * Rollup that returns a rich_text aggregate (e.g. `Company` rolled up from
 * the related Lead's `Company` rich_text field). Returns the first non-empty
 * string from the rollup array.
 */
export function getRollupRichText(page: Page, name: string): string {
  const p = prop(page, name) as {
    type?: string;
    rollup?: {
      type: string;
      array?: { type: string; rich_text?: { plain_text: string }[] }[];
      string?: string;
    };
  };
  if (p?.type !== "rollup") return "";
  if (p.rollup?.string) return p.rollup.string;
  const arr = p.rollup?.array ?? [];
  for (const item of arr) {
    if (item.type === "rich_text") {
      const text = (item.rich_text ?? []).map((t) => t.plain_text).join("");
      if (text) return text;
    }
  }
  return "";
}

export function getRollupNumber(page: Page, name: string): number | null {
  const p = prop(page, name) as {
    type?: string;
    rollup?: {
      type: string;
      number?: number | null;
      array?: { type: string; number?: number | null }[];
    };
  };
  if (p?.type !== "rollup") return null;
  if (typeof p.rollup?.number === "number") return p.rollup.number;
  const arr = p.rollup?.array ?? [];
  let sum = 0;
  let any = false;
  for (const item of arr) {
    if (item.type === "number" && typeof item.number === "number") {
      sum += item.number;
      any = true;
    }
  }
  return any ? sum : null;
}

export function getUniqueId(page: Page, name: string): string | null {
  const p = prop(page, name) as {
    type?: string;
    unique_id?: { prefix: string | null; number: number };
  };
  if (p?.type !== "unique_id") return null;
  const u = p.unique_id;
  if (!u) return null;
  return u.prefix ? `${u.prefix}-${u.number}` : `${u.number}`;
}

export function getLastEditedTime(page: Page): string {
  return page.last_edited_time;
}

export function getCreatedTimePage(page: Page): string {
  return page.created_time;
}
