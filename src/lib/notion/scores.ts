import "server-only";
import { notion } from "./client";
import { DB } from "./ids";
import { cached, TAG } from "./cache";
import {
  getCheckbox,
  getDate,
  getNumber,
  getRelationIds,
  getRichText,
  getSelect,
  getTitle,
  getUrl,
  isFullPage,
  type Page,
} from "./parsers";
import type { ActivityItem, Classification, HITLAction } from "@/lib/types/domain";

export interface DiagnosticScore {
  id: string;
  title: string;
  leadId: string | null;
  rawScore: number | null;
  scorePct: number | null;
  classification: Classification | null;
  authority: number | null;
  process: number | null;
  pricing: number | null;
  revenue: number | null;
  financial: number | null;
  flags: string;
  manualReviewNotes: string;
  reportDraftGenerated: boolean;
  reportDraftUrl: string | null;
  hitlAction: HITLAction | null;
  reportDelivered: boolean;
  dateCompleted: string | null;
  lastEditedTime: string;
}

export function parseScore(page: Page): DiagnosticScore {
  const leadIds = getRelationIds(page, "Lead");
  const rawScore = getNumber(page, "Raw Score");
  // "Score Pct" is a Notion formula. Some formula configurations return a
  // 0–1 decimal (e.g. 0.52) rather than a 0–100 integer. If the stored value
  // is ≤ 1 and rawScore is available, derive the percentage from rawScore
  // directly (max gate total = 50). Otherwise scale the decimal to 0–100.
  const rawPct = getNumber(page, "Score Pct");
  let scorePct: number | null = rawPct;
  if (rawPct !== null && rawPct <= 1) {
    scorePct = rawScore !== null ? Math.round((rawScore / 50) * 100) : Math.round(rawPct * 100);
  }
  return {
    id: page.id,
    title: getTitle(page, "Score Entry"),
    leadId: leadIds[0] ?? null,
    rawScore,
    scorePct,
    classification: getSelect(page, "Classification") as Classification | null,
    authority: getNumber(page, "Authority Score"),
    process: getNumber(page, "Process Score"),
    pricing: getNumber(page, "Pricing Score"),
    revenue: getNumber(page, "Revenue Score"),
    financial: getNumber(page, "Financial Score"),
    flags: getRichText(page, "Flags"),
    manualReviewNotes: getRichText(page, "Manual Review Notes"),
    reportDraftGenerated: getCheckbox(page, "Report Draft Generated"),
    reportDraftUrl: getUrl(page, "Report Draft URL"),
    hitlAction: getSelect(page, "Report HITL Action") as HITLAction | null,
    reportDelivered: getCheckbox(page, "Report Delivered"),
    dateCompleted: getDate(page, "Date Completed"),
    lastEditedTime: page.last_edited_time,
  };
}

export const listScores = cached(
  async (): Promise<DiagnosticScore[]> => {
    const res = await notion.databases.query({
      database_id: DB.scores,
      sorts: [{ property: "Date Completed", direction: "descending" }],
      page_size: 100,
    });
    return res.results.filter(isFullPage).map(parseScore);
  },
  ["scores:all"],
  { tags: [TAG.scores] },
);

export const listManualReviewScores = cached(
  async (): Promise<DiagnosticScore[]> => {
    const res = await notion.databases.query({
      database_id: DB.scores,
      filter: {
        property: "Report HITL Action",
        select: { equals: "Rejected-Manual Review" },
      },
      sorts: [{ property: "Date Completed", direction: "descending" }],
      page_size: 100,
    });
    return res.results.filter(isFullPage).map(parseScore);
  },
  ["scores:manual-review"],
  { tags: [TAG.scores] },
);

export const countPendingReports = cached(
  async (): Promise<number> => {
    let count = 0;
    let cursor: string | undefined;
    do {
      const res = await notion.databases.query({
        database_id: DB.scores,
        page_size: 100,
        start_cursor: cursor,
        filter: {
          and: [
            { property: "Report Draft Generated", checkbox: { equals: true } },
            { property: "Report HITL Action", select: { equals: "Pending" } },
          ],
        },
      });
      count += res.results.length;
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);
    return count;
  },
  ["scores:count-pending"],
  { tags: [TAG.scores] },
);

export async function updateScoreHITL(
  id: string,
  action: HITLAction,
  manualReviewNotes?: string,
): Promise<void> {
  const properties: Record<string, unknown> = {
    "Report HITL Action": { select: { name: action } },
  };
  if (manualReviewNotes !== undefined) {
    properties["Manual Review Notes"] = {
      rich_text: [{ type: "text", text: { content: manualReviewNotes } }],
    };
  }
  await notion.pages.update({ page_id: id, properties: properties as never });
}

export async function updateManualReviewNotes(id: string, notes: string): Promise<void> {
  await notion.pages.update({
    page_id: id,
    properties: {
      "Manual Review Notes": {
        rich_text: [{ type: "text", text: { content: notes } }],
      },
    } as never,
  });
}

export async function getScoresForLead(leadId: string): Promise<DiagnosticScore[]> {
  const res = await notion.databases.query({
    database_id: DB.scores,
    page_size: 50,
    filter: { property: "Lead", relation: { contains: leadId } },
    sorts: [{ property: "Date Completed", direction: "descending" }],
  });
  return res.results.filter(isFullPage).map(parseScore);
}

export const recentScoreActivity = cached(
  async (limit = 10): Promise<ActivityItem[]> => {
    const res = await notion.databases.query({
      database_id: DB.scores,
      page_size: limit,
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
    });
    return res.results.filter(isFullPage).map((page) => {
      const s = parseScore(page);
      const detail = [
        s.scorePct != null ? `${Math.round(s.scorePct)}%` : null,
        s.classification,
        s.hitlAction,
      ]
        .filter(Boolean)
        .join(" · ");
      return {
        source: "score" as const,
        id: s.id,
        title: s.title || "Score updated",
        detail: detail || "Diagnostic score",
        timestamp: s.lastEditedTime,
        href: s.leadId ? `/leads/${s.leadId}` : "/scores",
      };
    });
  },
  ["scores:activity"],
  { tags: [TAG.scores, TAG.activity] },
);
