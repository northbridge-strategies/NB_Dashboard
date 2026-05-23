import "server-only";
import { notion } from "./client";
import { DB } from "./ids";
import { cached, TAG } from "./cache";
import {
  getCheckbox,
  getDate,
  getRelationIds,
  getRichText,
  getSelect,
  getTitle,
  getUrl,
  isFullPage,
  type Page,
} from "./parsers";
import type { ActivityItem, HITLAction } from "@/lib/types/domain";

export interface OutreachEntry {
  id: string;
  contactName: string;
  company: string;
  linkedinUrl: string | null;
  jobTitle: string;
  source: string | null;
  dateAdded: string | null;
  dateConnected: string | null;
  stage: string | null;
  dougApproved: boolean;
  draftDM: string;
  hitlAction: HITLAction | null;
  hitlActionDate: string | null;
  hitlNotes: string;
  dmApproved: boolean;
  lastMessageDate: string | null;
  convertedToLeadId: string | null;
  lastEditedTime: string;
}

export function parseOutreach(page: Page): OutreachEntry {
  const convIds = getRelationIds(page, "Converted to Lead");
  return {
    id: page.id,
    contactName: getTitle(page, "Contact Name"),
    company: getRichText(page, "Company"),
    linkedinUrl: getUrl(page, "LinkedIn URL"),
    jobTitle: getRichText(page, "Title"),
    source: getSelect(page, "Source"),
    dateAdded: getDate(page, "Date Added"),
    dateConnected: getDate(page, "Date Connected"),
    stage: getSelect(page, "Stage"),
    dougApproved: getCheckbox(page, "Doug Approved"),
    draftDM: getRichText(page, "Draft DM"),
    hitlAction: getSelect(page, "HITL Action") as HITLAction | null,
    hitlActionDate: getDate(page, "HITL Action Date"),
    hitlNotes: getRichText(page, "HITL Notes"),
    dmApproved: getCheckbox(page, "DM Approved"),
    lastMessageDate: getDate(page, "Last Message Date"),
    convertedToLeadId: convIds[0] ?? null,
    lastEditedTime: page.last_edited_time,
  };
}

export const listOutreach = cached(
  async (): Promise<OutreachEntry[]> => {
    const res = await notion.databases.query({
      database_id: DB.linkedin,
      page_size: 100,
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
    });
    return res.results.filter(isFullPage).map(parseOutreach);
  },
  ["linkedin:all"],
  { tags: [TAG.linkedin] },
);

export const listOutreachNeedingAttention = cached(
  async (): Promise<OutreachEntry[]> => {
    const res = await notion.databases.query({
      database_id: DB.linkedin,
      filter: {
        or: [
          { property: "Stage", select: { equals: "Replied" } },
          { property: "HITL Action", select: { equals: "Pending" } },
        ],
      },
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      page_size: 100,
    });
    return res.results.filter(isFullPage).map(parseOutreach);
  },
  ["linkedin:attention"],
  { tags: [TAG.linkedin] },
);

export async function approveOutreach(
  id: string,
  editedDM?: string,
): Promise<void> {
  const properties: Record<string, unknown> = {
    "HITL Action": {
      select: { name: editedDM ? "Edited-Approved" : "Approved" },
    },
    "DM Approved": { checkbox: true },
    "Doug Approved": { checkbox: true },
    "HITL Action Date": { date: { start: new Date().toISOString() } },
  };
  if (editedDM !== undefined) {
    properties["Draft DM"] = {
      rich_text: [{ type: "text", text: { content: editedDM } }],
    };
  }
  await notion.pages.update({ page_id: id, properties: properties as never });
}

export async function rejectOutreach(id: string, notes?: string): Promise<void> {
  const properties: Record<string, unknown> = {
    "HITL Action": { select: { name: "Rejected-Manual Review" } },
    "Stage": { select: { name: "Manual Review" } },
    "HITL Action Date": { date: { start: new Date().toISOString() } },
  };
  if (notes !== undefined) {
    properties["HITL Notes"] = {
      rich_text: [{ type: "text", text: { content: notes } }],
    };
  }
  await notion.pages.update({ page_id: id, properties: properties as never });
}

export async function getOutreachForLead(leadId: string): Promise<OutreachEntry[]> {
  const res = await notion.databases.query({
    database_id: DB.linkedin,
    page_size: 20,
    filter: {
      property: "Converted to Lead",
      relation: { contains: leadId },
    },
    sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
  });
  return res.results.filter(isFullPage).map(parseOutreach);
}

export const recentOutreachActivity = cached(
  async (limit = 10): Promise<ActivityItem[]> => {
    const res = await notion.databases.query({
      database_id: DB.linkedin,
      page_size: limit,
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
    });
    return res.results.filter(isFullPage).map((page) => {
      const o = parseOutreach(page);
      return {
        source: "linkedin" as const,
        id: o.id,
        title: o.contactName || "Outreach updated",
        detail: [o.company, o.stage].filter(Boolean).join(" · ") || "LinkedIn outreach",
        timestamp: o.lastEditedTime,
        href: o.convertedToLeadId
          ? `/leads/${o.convertedToLeadId}`
          : "/linkedin",
      };
    });
  },
  ["linkedin:activity"],
  { tags: [TAG.linkedin, TAG.activity] },
);
