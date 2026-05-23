#!/usr/bin/env node
// Smoke test the Notion filter shapes the dashboard depends on.
// Reads only — never mutates.

import { Client } from "@notionhq/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

// Hand-load .env.local
const env = {};
for (const line of readFileSync(join(repoRoot, ".env.local"), "utf8").split("\n")) {
  const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
  if (m) env[m[1]] = m[2];
}

const notion = new Client({ auth: env.NOTION_TOKEN });

async function check(label, run) {
  process.stdout.write(`  ${label.padEnd(48, ".")}`);
  try {
    const out = await run();
    console.log(` OK (${out})`);
  } catch (e) {
    console.log(` FAIL`);
    console.error(`     ${e?.body ?? e?.message ?? e}`);
    process.exitCode = 1;
  }
}

async function main() {
  console.log("Smoke testing Notion filter shapes...\n");

  await check("Leads: count active", async () => {
    const r = await notion.databases.query({
      database_id: env.NOTION_LEADS_DB,
      page_size: 5,
      filter: {
        and: [
          { property: "Lifecycle State", select: { does_not_equal: "Closed Lost" } },
          { property: "Lifecycle State", select: { does_not_equal: "Complete" } },
        ],
      },
    });
    return `${r.results.length} rows`;
  });

  await check("Leads: Priority rollup = Hot", async () => {
    const r = await notion.databases.query({
      database_id: env.NOTION_LEADS_DB,
      page_size: 5,
      filter: {
        property: "Priority",
        rollup: { any: { select: { equals: "Hot" } } },
      },
    });
    return `${r.results.length} rows`;
  });

  await check("Scores: Pending HITL", async () => {
    const r = await notion.databases.query({
      database_id: env.NOTION_SCORES_DB,
      page_size: 5,
      filter: {
        and: [
          { property: "Report Draft Generated", checkbox: { equals: true } },
          { property: "Report HITL Action", select: { equals: "Pending" } },
        ],
      },
    });
    return `${r.results.length} rows`;
  });

  await check("Scores: Manual Review Notes property exists", async () => {
    const db = await notion.databases.retrieve({ database_id: env.NOTION_SCORES_DB });
    if (!db.properties["Manual Review Notes"]) throw new Error("missing");
    return "yes";
  });

  await check("Pipeline: list 5 most recent", async () => {
    const r = await notion.databases.query({
      database_id: env.NOTION_PIPELINE_DB,
      page_size: 5,
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
    });
    return `${r.results.length} rows`;
  });

  await check("Revenue: sum this month (Paid)", async () => {
    const ym = new Date().toISOString().slice(0, 7);
    const r = await notion.databases.query({
      database_id: env.NOTION_REVENUE_DB,
      page_size: 5,
      filter: {
        and: [
          { property: "Month", rich_text: { equals: ym } },
          { property: "Status", select: { equals: "Paid" } },
        ],
      },
    });
    return `${r.results.length} rows`;
  });

  await check("Brokers: Awaiting Review", async () => {
    const r = await notion.databases.query({
      database_id: env.NOTION_BROKER_DB,
      page_size: 5,
      filter: { property: "Status", select: { equals: "Awaiting Review" } },
    });
    return `${r.results.length} rows`;
  });

  await check("Health: unresolved", async () => {
    const r = await notion.databases.query({
      database_id: env.NOTION_HEALTH_DB,
      page_size: 5,
      filter: { property: "Resolved", checkbox: { equals: false } },
    });
    return `${r.results.length} rows`;
  });

  await check("LinkedIn: needs attention", async () => {
    const r = await notion.databases.query({
      database_id: env.NOTION_LINKEDIN_DB,
      page_size: 5,
      filter: {
        or: [
          { property: "Stage", select: { equals: "Replied" } },
          { property: "HITL Action", select: { equals: "Pending" } },
        ],
      },
    });
    return `${r.results.length} rows`;
  });

  await check("Config: Production Config record", async () => {
    const r = await notion.databases.query({
      database_id: env.NOTION_CONFIG_DB,
      page_size: 1,
      filter: { property: "Config Key", title: { equals: "Production Config" } },
    });
    if (r.results.length === 0) throw new Error("Production Config record missing");
    return "found";
  });

  await check("Content: list", async () => {
    const r = await notion.databases.query({
      database_id: env.NOTION_CONTENT_DB,
      page_size: 5,
    });
    return `${r.results.length} rows`;
  });

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
