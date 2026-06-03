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

/** Optional — returns null if env var not set (graceful before setup runs) */
function readOptional(name: string): string | null {
  return process.env[name] ?? null;
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
  // Phase 2 — Tier I (optional until /api/tier1/setup is run once)
  tier1Criteria: readOptional("NOTION_TIER1_CRITERIA_DB"),
  tier1Responses: readOptional("NOTION_TIER1_RESPONSES_DB"),
} as const;

export type DatabaseKey = keyof typeof DB;
