import "server-only";
import { notion } from "./client";
import { DB } from "./ids";
import { cached, TAG } from "./cache";
import {
  getCheckbox,
  getRelationIds,
  getRichText,
  getSelect,
  getTitle,
  getUrl,
  isFullPage,
  type Page,
} from "./parsers";
import type { Severity } from "@/lib/types/domain";
import { daysAgo, toISO } from "@/lib/utils/dates";

export interface HealthLog {
  id: string;
  title: string;
  agent: string | null;
  eventType: string | null;
  errorMessage: string;
  affectedLeadId: string | null;
  affectedRecordUrl: string | null;
  severity: Severity | null;
  resolved: boolean;
  resolutionNotes: string;
  timestamp: string;            // created_time as ISO
  lastEditedTime: string;
}

export function parseHealth(page: Page): HealthLog {
  const leadIds = getRelationIds(page, "Affected Lead");
  // Default severity to "Warning" when the Notion field is blank so that
  // unresolved errors always surface in the severity counter rollup rather
  // than being silently dropped from every bucket while still counting in
  // the "total" header.
  const rawSeverity = getSelect(page, "Severity") as Severity | null;
  return {
    id: page.id,
    title: getTitle(page, "Log Entry"),
    agent: getSelect(page, "Agent"),
    eventType: getSelect(page, "Event Type"),
    errorMessage: getRichText(page, "Error Message"),
    affectedLeadId: leadIds[0] ?? null,
    affectedRecordUrl: getUrl(page, "Affected Record URL"),
    severity: rawSeverity ?? "Warning",
    resolved: getCheckbox(page, "Resolved"),
    resolutionNotes: getRichText(page, "Resolution Notes"),
    timestamp: page.created_time,
    lastEditedTime: page.last_edited_time,
  };
}

export const listUnresolvedHealth = cached(
  async (limit = 100): Promise<HealthLog[]> => {
    const res = await notion.databases.query({
      database_id: DB.health,
      page_size: limit,
      filter: { property: "Resolved", checkbox: { equals: false } },
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });
    return res.results.filter(isFullPage).map(parseHealth);
  },
  ["health:unresolved"],
  { tags: [TAG.health], revalidate: 10 },
);

export const listAllHealth = cached(
  async (limit = 100): Promise<HealthLog[]> => {
    const res = await notion.databases.query({
      database_id: DB.health,
      page_size: limit,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });
    return res.results.filter(isFullPage).map(parseHealth);
  },
  ["health:all"],
  { tags: [TAG.health], revalidate: 10 },
);

export interface HealthSnapshot {
  total: number;
  unresolvedCritical: number;
  unresolvedWarning: number;
  unresolvedInfo: number;
  resolvedRecent: number;       // resolved in last 24h
  recentLogs: HealthLog[];
}

/**
 * One-shot rollup used by /health and the topbar dot. Pulls last 100 unresolved
 * + last 100 logs total to compute counts. Cached for 10s.
 */
export const getHealthSnapshot = cached(
  async (): Promise<HealthSnapshot> => {
    const [unresolved, all] = await Promise.all([
      listUnresolvedHealth(100),
      listAllHealth(100),
    ]);
    const cutoff = toISO(daysAgo(1));
    const resolvedRecent = all.filter(
      (l) => l.resolved && l.lastEditedTime >= cutoff,
    ).length;
    return {
      total: unresolved.length,
      unresolvedCritical: unresolved.filter((l) => l.severity === "Critical").length,
      unresolvedWarning: unresolved.filter((l) => l.severity === "Warning").length,
      unresolvedInfo: unresolved.filter((l) => l.severity === "Info").length,
      resolvedRecent,
      recentLogs: unresolved.slice(0, 50),
    };
  },
  ["health:snapshot"],
  { tags: [TAG.health], revalidate: 10 },
);

export async function getHealthForLead(leadId: string): Promise<HealthLog[]> {
  const res = await notion.databases.query({
    database_id: DB.health,
    page_size: 50,
    filter: { property: "Affected Lead", relation: { contains: leadId } },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  });
  return res.results.filter(isFullPage).map(parseHealth);
}

export const countUnresolvedHealth = cached(
  async (): Promise<number> => {
    let count = 0;
    let cursor: string | undefined;
    do {
      const res = await notion.databases.query({
        database_id: DB.health,
        page_size: 100,
        start_cursor: cursor,
        filter: { property: "Resolved", checkbox: { equals: false } },
      });
      count += res.results.length;
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);
    return count;
  },
  ["health:count"],
  { tags: [TAG.health], revalidate: 10 },
);
