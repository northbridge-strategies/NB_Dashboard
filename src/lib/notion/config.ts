import "server-only";
import { notion } from "./client";
import { DB } from "./ids";
import { cached, TAG } from "./cache";
import { getCheckbox, getDate, getRichText, getTitle, isFullPage } from "./parsers";

export interface SystemConfig {
  pageId: string;
  configKey: string;
  globalPause: boolean;
  lastPauseEvent: string | null;
  lastResumeEvent: string | null;
  notes: string;
}

const PRODUCTION_CONFIG_KEY = "Production Config";

export const getProductionConfig = cached(
  async (): Promise<SystemConfig | null> => {
    const res = await notion.databases.query({
      database_id: DB.config,
      filter: {
        property: "Config Key",
        title: { equals: PRODUCTION_CONFIG_KEY },
      },
      page_size: 1,
    });
    const page = res.results[0];
    if (!page || !isFullPage(page)) return null;
    return {
      pageId: page.id,
      configKey: getTitle(page, "Config Key"),
      globalPause: getCheckbox(page, "Global Pause"),
      lastPauseEvent: getDate(page, "Last Pause Event"),
      lastResumeEvent: getDate(page, "Last Resume Event"),
      notes: getRichText(page, "Notes"),
    };
  },
  ["config:production"],
  { tags: [TAG.config], revalidate: 10 },
);

export async function setGlobalPause(paused: boolean): Promise<void> {
  const config = await getProductionConfig();
  if (!config) throw new Error("Production Config record not found");
  const properties: Record<string, unknown> = {
    "Global Pause": { checkbox: paused },
  };
  if (paused) {
    properties["Last Pause Event"] = {
      date: { start: new Date().toISOString() },
    };
  } else {
    properties["Last Resume Event"] = {
      date: { start: new Date().toISOString() },
    };
  }
  await notion.pages.update({
    page_id: config.pageId,
    properties: properties as never,
  });
}
