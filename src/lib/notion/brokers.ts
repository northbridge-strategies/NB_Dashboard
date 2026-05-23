import "server-only";
import { notion } from "./client";
import { DB } from "./ids";
import { cached, TAG } from "./cache";
import {
  getCheckbox,
  getDate,
  getNumber,
  getRichText,
  getSelect,
  getTitle,
  getUrl,
  isFullPage,
  type Page,
} from "./parsers";

export interface BrokerListing {
  id: string;
  listingTitle: string;
  askingPrice: number | null;
  revenue: number | null;
  industry: string;
  location: string;
  ownerDependencySignals: string;
  brokerName: string;
  brokerCompany: string;
  brokerLinkedInUrl: string | null;
  dateDiscovered: string | null;
  source: string | null;
  status: string | null;
  approvedByDoug: boolean;
  notes: string;
  lastEditedTime: string;
}

export function parseBroker(page: Page): BrokerListing {
  return {
    id: page.id,
    listingTitle: getTitle(page, "Listing Title"),
    askingPrice: getNumber(page, "Asking Price"),
    revenue: getNumber(page, "Revenue"),
    industry: getRichText(page, "Industry"),
    location: getRichText(page, "Location"),
    ownerDependencySignals: getRichText(page, "Owner-Dependency Signals"),
    brokerName: getRichText(page, "Broker Name"),
    brokerCompany: getRichText(page, "Broker Company"),
    brokerLinkedInUrl: getUrl(page, "Broker LinkedIn URL"),
    dateDiscovered: getDate(page, "Date Discovered"),
    source: getSelect(page, "Source"),
    status: getSelect(page, "Status"),
    approvedByDoug: getCheckbox(page, "Approved by Doug"),
    notes: getRichText(page, "Notes"),
    lastEditedTime: page.last_edited_time,
  };
}

export const listAwaitingReviewBrokers = cached(
  async (): Promise<BrokerListing[]> => {
    const res = await notion.databases.query({
      database_id: DB.brokers,
      filter: {
        property: "Status",
        select: { equals: "Awaiting Review" },
      },
      sorts: [{ property: "Date Discovered", direction: "descending" }],
      page_size: 100,
    });
    return res.results.filter(isFullPage).map(parseBroker);
  },
  ["brokers:awaiting"],
  { tags: [TAG.brokers] },
);

export const listAllBrokers = cached(
  async (): Promise<BrokerListing[]> => {
    const res = await notion.databases.query({
      database_id: DB.brokers,
      page_size: 100,
      sorts: [{ property: "Date Discovered", direction: "descending" }],
    });
    return res.results.filter(isFullPage).map(parseBroker);
  },
  ["brokers:all"],
  { tags: [TAG.brokers] },
);

export const countAwaitingReviewBrokers = cached(
  async (): Promise<number> => {
    let count = 0;
    let cursor: string | undefined;
    do {
      const res = await notion.databases.query({
        database_id: DB.brokers,
        page_size: 100,
        start_cursor: cursor,
        filter: {
          property: "Status",
          select: { equals: "Awaiting Review" },
        },
      });
      count += res.results.length;
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);
    return count;
  },
  ["brokers:count"],
  { tags: [TAG.brokers] },
);

export async function approveBroker(id: string): Promise<void> {
  await notion.pages.update({
    page_id: id,
    properties: {
      "Approved by Doug": { checkbox: true },
      "Status": { select: { name: "Approved for Outreach" } },
    } as never,
  });
}
