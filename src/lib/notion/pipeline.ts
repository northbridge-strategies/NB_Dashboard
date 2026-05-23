import "server-only";
import { notion } from "./client";
import { DB } from "./ids";
import { cached, TAG } from "./cache";
import {
  getDate,
  getNumber,
  getRelationIds,
  getRichText,
  getRollupRichText,
  getSelect,
  getTitle,
  isFullPage,
  type Page,
} from "./parsers";
import type {
  ActivityItem,
  PipelineStage,
  Priority,
} from "@/lib/types/domain";

export interface PipelineEntry {
  id: string;
  title: string;
  leadId: string | null;
  company: string;
  stage: PipelineStage | null;
  stageDate: string | null;
  meetingDate: string | null;
  priority: Priority | null;
  callOutcome: string | null;
  nextAction: string | null;
  tierIPaymentDate: string | null;
  tierIAmount: number | null;
  notes: string;
  lastEditedTime: string;
}

export function parseEntry(page: Page): PipelineEntry {
  const leadIds = getRelationIds(page, "Lead");
  return {
    id: page.id,
    title: getTitle(page, "Pipeline Entry"),
    leadId: leadIds[0] ?? null,
    company: getRollupRichText(page, "Company"),
    stage: getSelect(page, "Stage") as PipelineStage | null,
    stageDate: getDate(page, "Stage Date"),
    meetingDate: getDate(page, "Meeting Date"),
    priority: getSelect(page, "Priority") as Priority | null,
    callOutcome: getSelect(page, "Call Outcome"),
    nextAction: getSelect(page, "Next Action"),
    tierIPaymentDate: getDate(page, "Tier I Payment Date"),
    tierIAmount: getNumber(page, "Tier I Amount"),
    notes: getRichText(page, "Notes"),
    lastEditedTime: page.last_edited_time,
  };
}

export const listPipeline = cached(
  async (): Promise<PipelineEntry[]> => {
    const results: PipelineEntry[] = [];
    let cursor: string | undefined;
    do {
      const res = await notion.databases.query({
        database_id: DB.pipeline,
        page_size: 100,
        start_cursor: cursor,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      });
      for (const page of res.results) {
        if (!isFullPage(page)) continue;
        results.push(parseEntry(page));
      }
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);
    return results;
  },
  ["pipeline:all"],
  { tags: [TAG.pipeline] },
);

export interface MeetingItem {
  id: string;
  leadId: string | null;
  leadName: string;
  company: string;
  stage: PipelineStage | null;
  priority: Priority | null;
  meetingDate: string;
}

export interface MeetingsList {
  upcoming: MeetingItem[];
  previous: MeetingItem[];
}

/**
 * All Pipeline entries with a Meeting Date set, split into upcoming and past.
 * Past meetings are capped at the most recent 30 (no point keeping ancient ones).
 *
 * "Upcoming" uses start-of-today as the cutoff so a meeting at 2pm today still
 * shows as upcoming until tomorrow.
 */
export const listMeetings = cached(
  async (): Promise<MeetingsList> => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const cutoffISO = startOfToday.toISOString();

    const [upcomingRes, previousRes] = await Promise.all([
      notion.databases.query({
        database_id: DB.pipeline,
        page_size: 100,
        filter: {
          property: "Meeting Date",
          date: { on_or_after: cutoffISO },
        },
        sorts: [{ property: "Meeting Date", direction: "ascending" }],
      }),
      notion.databases.query({
        database_id: DB.pipeline,
        page_size: 30,
        filter: {
          property: "Meeting Date",
          date: { before: cutoffISO },
        },
        sorts: [{ property: "Meeting Date", direction: "descending" }],
      }),
    ]);

    function toMeeting(page: Page): MeetingItem | null {
      const e = parseEntry(page);
      if (!e.meetingDate) return null;
      return {
        id: e.id,
        leadId: e.leadId,
        // Lead name lookup happens server-side after this returns; for now use
        // the rollup-resolved Company as a sensible fallback.
        leadName: "",
        company: e.company,
        stage: e.stage,
        priority: e.priority,
        meetingDate: e.meetingDate,
      };
    }

    return {
      upcoming: upcomingRes.results
        .filter(isFullPage)
        .map(toMeeting)
        .filter((m): m is MeetingItem => m != null),
      previous: previousRes.results
        .filter(isFullPage)
        .map(toMeeting)
        .filter((m): m is MeetingItem => m != null),
    };
  },
  ["pipeline:meetings"],
  { tags: [TAG.pipeline, TAG.leads] },
);

export async function getPipelineForLead(leadId: string): Promise<PipelineEntry[]> {
  const res = await notion.databases.query({
    database_id: DB.pipeline,
    page_size: 50,
    filter: { property: "Lead", relation: { contains: leadId } },
    sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
  });
  return res.results.filter(isFullPage).map(parseEntry);
}

export const recentPipelineActivity = cached(
  async (limit = 10): Promise<ActivityItem[]> => {
    const res = await notion.databases.query({
      database_id: DB.pipeline,
      page_size: limit,
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
    });
    return res.results.filter(isFullPage).map((page) => {
      const e = parseEntry(page);
      const detail = [e.stage, e.priority].filter(Boolean).join(" · ");
      return {
        source: "pipeline" as const,
        id: e.id,
        title: e.title || "Pipeline updated",
        detail: detail || "Pipeline entry",
        timestamp: e.lastEditedTime,
        href: e.leadId ? `/leads/${e.leadId}` : "/pipeline",
      };
    });
  },
  ["pipeline:activity"],
  { tags: [TAG.pipeline, TAG.activity] },
);
