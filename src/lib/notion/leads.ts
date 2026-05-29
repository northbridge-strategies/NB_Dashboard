import "server-only";
import { notion } from "./client";
import { DB } from "./ids";
import { cached, TAG } from "./cache";
import {
  getCheckbox,
  getDate,
  getEmail,
  getPhone,
  getRichText,
  getRollupSelect,
  getSelect,
  getTitle,
  isFullPage,
  type Page,
} from "./parsers";
import type { ActivityItem, LifecycleState, Priority } from "@/lib/types/domain";
import { daysAgo, toISO } from "@/lib/utils/dates";

export interface Lead {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string;
  industry: string | null;
  revenueRange: string | null;
  lifecycleState: LifecycleState | null;
  source: string | null;
  trafficSource: string | null;
  priority: Priority | null;       // From rollup over 💰 Pipeline relation
  lastActivityDate: string | null;
  lastContacted: string | null;
  dougNotified: boolean;
  createdTime: string;
  lastEditedTime: string;
}

export function parseLead(page: Page): Lead {
  return {
    id: page.id,
    name: getTitle(page, "Lead Name"),
    firstName: getRichText(page, "First Name"),
    lastName: getRichText(page, "Last Name"),
    email: getEmail(page, "Email"),
    phone: getPhone(page, "Phone"),
    company: getRichText(page, "Company"),
    industry: getSelect(page, "Industry"),
    revenueRange: getSelect(page, "Revenue Range"),
    lifecycleState: getSelect(page, "Lifecycle State") as LifecycleState | null,
    source: getSelect(page, "Source"),
    trafficSource: getSelect(page, "Traffic Source"),
    priority: getRollupSelect(page, "Priority") as Priority | null,
    lastActivityDate: getDate(page, "Last Activity Date"),
    lastContacted: getDate(page, "Last Contacted"),
    dougNotified: getCheckbox(page, "Doug Notified"),
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
  };
}

const TERMINAL_LIFECYCLE: LifecycleState[] = ["Complete", "Closed Lost"];

export const listAllLeads = cached(
  async (): Promise<Lead[]> => {
    const results: Lead[] = [];
    let cursor: string | undefined;
    do {
      const res = await notion.databases.query({
        database_id: DB.leads,
        page_size: 100,
        start_cursor: cursor,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      });
      for (const page of res.results) {
        if (!isFullPage(page)) continue;
        results.push(parseLead(page));
      }
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);
    return results;
  },
  ["leads:all"],
  { tags: [TAG.leads] },
);

export const listActiveLeads = cached(
  async (): Promise<Lead[]> => {
    const results: Lead[] = [];
    let cursor: string | undefined;
    do {
      const res = await notion.databases.query({
        database_id: DB.leads,
        page_size: 100,
        start_cursor: cursor,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      });
      for (const page of res.results) {
        if (!isFullPage(page)) continue;
        const lead = parseLead(page);
        if (!lead.lifecycleState || !TERMINAL_LIFECYCLE.includes(lead.lifecycleState)) {
          results.push(lead);
        }
      }
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);
    return results;
  },
  ["leads:active"],
  { tags: [TAG.leads] },
);

export const listHotLeads = cached(
  async (): Promise<Lead[]> => {
    // Single-DB query thanks to the `Priority` rollup added by migration v1.
    const res = await notion.databases.query({
      database_id: DB.leads,
      filter: {
        and: [
          {
            property: "Priority",
            rollup: {
              any: { select: { equals: "Hot" } },
            },
          },
          {
            property: "Lifecycle State",
            select: { does_not_equal: "Closed Lost" },
          },
          {
            property: "Lifecycle State",
            select: { does_not_equal: "Complete" },
          },
        ],
      },
      sorts: [{ property: "Last Activity Date", direction: "descending" }],
      page_size: 100,
    });
    return res.results.filter(isFullPage).map(parseLead);
  },
  ["leads:hot"],
  { tags: [TAG.leads] },
);

export const countHotLeads = cached(
  async (): Promise<number> => {
    let count = 0;
    let cursor: string | undefined;
    do {
      const res = await notion.databases.query({
        database_id: DB.leads,
        page_size: 100,
        start_cursor: cursor,
        filter: {
          property: "Priority",
          rollup: { any: { select: { equals: "Hot" } } },
        },
      });
      count += res.results.length;
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);
    return count;
  },
  ["leads:count-hot"],
  { tags: [TAG.leads] },
);

export const countActiveLeads = cached(
  async (): Promise<number> => {
    let count = 0;
    let cursor: string | undefined;
    do {
      const res = await notion.databases.query({
        database_id: DB.leads,
        page_size: 100,
        start_cursor: cursor,
        filter: {
          and: [
            { property: "Lifecycle State", select: { does_not_equal: "Closed Lost" } },
            { property: "Lifecycle State", select: { does_not_equal: "Complete" } },
          ],
        },
      });
      count += res.results.length;
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);
    return count;
  },
  ["leads:count-active"],
  { tags: [TAG.leads] },
);

/**
 * Counts leads created in [startDaysAgo, endDaysAgo] window.
 * Used by trend-vs-last-week stat cards.
 */
export async function countLeadsInRange(startDaysAgo: number, endDaysAgo: number): Promise<number> {
  const startISO = toISO(daysAgo(startDaysAgo));
  const endISO = toISO(daysAgo(endDaysAgo));
  let count = 0;
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({
      database_id: DB.leads,
      page_size: 100,
      start_cursor: cursor,
      filter: {
        and: [
          { timestamp: "created_time", created_time: { on_or_after: startISO } },
          { timestamp: "created_time", created_time: { before: endISO } },
        ],
      },
    });
    count += res.results.length;
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return count;
}

/**
 * Manually advance a lead's Lifecycle State.
 * Forward-only is enforced at the Make.com and Airtable Automation layers;
 * the dashboard intentionally does NOT re-enforce it here so Doug can correct
 * bad state without going to Notion directly.
 */
export async function updateLeadLifecycle(
  id: string,
  lifecycleState: LifecycleState,
): Promise<void> {
  await notion.pages.update({
    page_id: id,
    properties: {
      "Lifecycle State": { select: { name: lifecycleState } },
    } as never,
  });
}

export async function getLead(id: string): Promise<Lead | null> {
  const page = await notion.pages.retrieve({ page_id: id });
  if (!isFullPage(page)) return null;
  return parseLead(page);
}

export async function getLeadNames(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const unique = Array.from(new Set(ids));
  const pages = await Promise.all(
    unique.map((id) => notion.pages.retrieve({ page_id: id }).catch(() => null)),
  );
  for (const page of pages) {
    if (page && isFullPage(page)) {
      map.set(page.id, getTitle(page, "Lead Name") || "(unnamed)");
    }
  }
  return map;
}

/** Most-recently-edited leads, for the activity feed. */
export const recentLeadActivity = cached(
  async (limit = 10): Promise<ActivityItem[]> => {
    const res = await notion.databases.query({
      database_id: DB.leads,
      page_size: limit,
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
    });
    return res.results.filter(isFullPage).map((page) => {
      const l = parseLead(page);
      return {
        source: "lead" as const,
        id: l.id,
        title: l.name || "(unnamed lead)",
        detail: [l.company, l.lifecycleState].filter(Boolean).join(" · ") || "Lead updated",
        timestamp: l.lastEditedTime,
        href: `/leads/${l.id}`,
      };
    });
  },
  ["leads:activity"],
  { tags: [TAG.leads, TAG.activity] },
);
