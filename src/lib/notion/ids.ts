import "server-only";

const REQUIRED = [
  "NOTION_LEADS_DB",
  "NOTION_SCORES_DB",
  "NOTION_PIPELINE_DB",
  "NOTION_LINKEDIN_DB",
  "NOTION_REVENUE_DB",
  "NOTION_BROKER_DB",
  "NOTION_SCRAPER_DB",
  "NOTION_CONTENT_DB",
  "NOTION_HEALTH_DB",
  "NOTION_CONFIG_DB",
  "NOTION_USERS_DB",
] as const;

function read(name: (typeof REQUIRED)[number]): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export const DB = {
  leads: read("NOTION_LEADS_DB"),
  scores: read("NOTION_SCORES_DB"),
  pipeline: read("NOTION_PIPELINE_DB"),
  linkedin: read("NOTION_LINKEDIN_DB"),
  revenue: read("NOTION_REVENUE_DB"),
  brokers: read("NOTION_BROKER_DB"),
  scraper: read("NOTION_SCRAPER_DB"),
  content: read("NOTION_CONTENT_DB"),
  health: read("NOTION_HEALTH_DB"),
  config: read("NOTION_CONFIG_DB"),
  users: read("NOTION_USERS_DB"),
} as const;

export type DatabaseKey = keyof typeof DB;
