import "server-only";
import { notion } from "./client";
import { DB } from "./ids";
import { cached, TAG } from "./cache";
import {
  getDate,
  getNumber,
  getRelationIds,
  getRichText,
  getSelect,
  getTitle,
  isFullPage,
  type Page,
} from "./parsers";
import { daysAgo, startOfMonthYYYYMM, toISO } from "@/lib/utils/dates";
import type { ActivityItem } from "@/lib/types/domain";

export interface RevenueEntry {
  id: string;
  title: string;
  leadId: string | null;
  service: string | null;        // "Tier I" | "Tier II" | "Tier III" | "Tier IV"
  amount: number | null;
  paymentDate: string | null;
  stripePaymentId: string;
  stripeEventId: string;
  status: string | null;          // "Paid" | "Pending" | "Refunded"
  month: string;                  // "YYYY-MM"
  lastEditedTime: string;
}

export function parseRevenue(page: Page): RevenueEntry {
  const leadIds = getRelationIds(page, "Lead");
  return {
    id: page.id,
    title: getTitle(page, "Revenue Entry"),
    leadId: leadIds[0] ?? null,
    service: getSelect(page, "Service"),
    amount: getNumber(page, "Amount"),
    paymentDate: getDate(page, "Payment Date"),
    stripePaymentId: getRichText(page, "Stripe Payment ID"),
    stripeEventId: getRichText(page, "Stripe Event ID"),
    status: getSelect(page, "Status"),
    month: getRichText(page, "Month"),
    lastEditedTime: page.last_edited_time,
  };
}

export const listRevenue = cached(
  async (): Promise<RevenueEntry[]> => {
    const results: RevenueEntry[] = [];
    let cursor: string | undefined;
    do {
      const res = await notion.databases.query({
        database_id: DB.revenue,
        page_size: 100,
        start_cursor: cursor,
        sorts: [{ property: "Payment Date", direction: "descending" }],
      });
      for (const page of res.results) {
        if (!isFullPage(page)) continue;
        results.push(parseRevenue(page));
      }
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);
    return results;
  },
  ["revenue:all"],
  { tags: [TAG.revenue] },
);

export const sumRevenueThisMonth = cached(
  async (): Promise<number> => {
    const ym = startOfMonthYYYYMM();
    let total = 0;
    let cursor: string | undefined;
    do {
      const res = await notion.databases.query({
        database_id: DB.revenue,
        page_size: 100,
        start_cursor: cursor,
        filter: {
          and: [
            { property: "Month", rich_text: { equals: ym } },
            { property: "Status", select: { equals: "Paid" } },
          ],
        },
      });
      for (const page of res.results) {
        if (!isFullPage(page)) continue;
        total += getNumber(page, "Amount") ?? 0;
      }
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);
    return total;
  },
  ["revenue:sum-this-month"],
  { tags: [TAG.revenue] },
);

/** Sum revenue for paid records within [startDaysAgo, endDaysAgo]. */
export async function sumRevenueInRange(
  startDaysAgo: number,
  endDaysAgo: number,
): Promise<number> {
  const startISO = toISO(daysAgo(startDaysAgo));
  const endISO = toISO(daysAgo(endDaysAgo));
  let total = 0;
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({
      database_id: DB.revenue,
      page_size: 100,
      start_cursor: cursor,
      filter: {
        and: [
          { property: "Status", select: { equals: "Paid" } },
          { property: "Payment Date", date: { on_or_after: startISO } },
          { property: "Payment Date", date: { before: endISO } },
        ],
      },
    });
    for (const page of res.results) {
      if (!isFullPage(page)) continue;
      total += getNumber(page, "Amount") ?? 0;
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return total;
}

export async function getRevenueForLead(leadId: string): Promise<RevenueEntry[]> {
  const res = await notion.databases.query({
    database_id: DB.revenue,
    page_size: 50,
    filter: { property: "Lead", relation: { contains: leadId } },
    sorts: [{ property: "Payment Date", direction: "descending" }],
  });
  return res.results.filter(isFullPage).map(parseRevenue);
}

export const recentRevenueActivity = cached(
  async (limit = 10): Promise<ActivityItem[]> => {
    const res = await notion.databases.query({
      database_id: DB.revenue,
      page_size: limit,
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
    });
    return res.results.filter(isFullPage).map((page) => {
      const r = parseRevenue(page);
      const amt =
        r.amount != null
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(r.amount)
          : "$—";
      const detail = [amt, r.service, r.status].filter(Boolean).join(" · ");
      return {
        source: "revenue" as const,
        id: r.id,
        title: r.title || "Payment recorded",
        detail,
        timestamp: r.lastEditedTime,
        href: r.leadId ? `/leads/${r.leadId}` : "/revenue",
      };
    });
  },
  ["revenue:activity"],
  { tags: [TAG.revenue, TAG.activity] },
);
