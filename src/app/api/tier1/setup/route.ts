import { NextResponse } from "next/server";
import { HttpError, requireRole } from "@/lib/auth/session";
import { notion } from "@/lib/notion/client";
import {
  createCriteriaDatabase,
  createResponsesDatabase,
  seedCriteria,
} from "@/lib/notion/tier1";
import { CRITERIA_SEED } from "@/lib/notion/criteria-seed";
import { DB } from "@/lib/notion/ids";
import { isFullPage } from "@/lib/notion/parsers";

/**
 * POST /api/tier1/setup  (Admin only)
 *
 * One-shot setup endpoint. Creates the two Tier I Notion databases and seeds
 * all 25 criteria. Safe to call multiple times — skips already-seeded records.
 *
 * Requires a parent Notion page to create the databases inside. Pass the
 * page ID as { parentPageId } in the request body. If omitted, falls back to
 * searching for a page titled "Business Transferability Vault" in the workspace.
 *
 * Returns the two database IDs — add them to Vercel env vars:
 *   NOTION_TIER1_CRITERIA_DB
 *   NOTION_TIER1_RESPONSES_DB
 */
export async function POST(req: Request) {
  try {
    await requireRole(["Admin"]);

    const body = await req.json().catch(() => ({})) as { parentPageId?: string };

    // If both DBs already exist in env, just re-seed (idempotent)
    let criteriaDbId = DB.tier1Criteria;
    let responsesDbId = DB.tier1Responses;

    // If env vars not set, we need a parent page to create the DBs inside
    if (!criteriaDbId || !responsesDbId) {
      let parentPageId = body.parentPageId;

      if (!parentPageId) {
        // Try to find the workspace root or any top-level page
        const search = await notion.search({
          query: "Business Transferability Vault",
          filter: { value: "page", property: "object" },
          page_size: 1,
        });
        const page = search.results.find(r => isFullPage(r as never));
        if (!page) {
          // Fall back to searching for any page
          const fallback = await notion.search({
            filter: { value: "page", property: "object" },
            page_size: 1,
          });
          const fp = fallback.results[0];
          if (!fp) {
            return NextResponse.json({
              error: "Could not find a parent page. Pass { parentPageId: 'notion-page-id' } in the request body.",
            }, { status: 400 });
          }
          parentPageId = fp.id;
        } else {
          parentPageId = page.id;
        }
      }

      // Create databases
      if (!criteriaDbId) {
        criteriaDbId = await createCriteriaDatabase(parentPageId);
      }
      if (!responsesDbId) {
        responsesDbId = await createResponsesDatabase(criteriaDbId); // use criteria DB ID as parent reference
      }
    }

    // Seed criteria (idempotent — skips existing)
    await seedCriteria(criteriaDbId, CRITERIA_SEED);

    return NextResponse.json({
      ok: true,
      message: "Tier I databases created and seeded successfully.",
      databases: {
        tier1Criteria: criteriaDbId,
        tier1Responses: responsesDbId,
      },
      nextSteps: [
        `Add to Vercel env vars:`,
        `  NOTION_TIER1_CRITERIA_DB=${criteriaDbId}`,
        `  NOTION_TIER1_RESPONSES_DB=${responsesDbId}`,
        `Then redeploy.`,
      ],
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/tier1/setup]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** GET — returns current setup status */
export async function GET() {
  try {
    await requireRole(["Admin"]);
    return NextResponse.json({
      criteriaDbConfigured: Boolean(DB.tier1Criteria),
      responsesDbConfigured: Boolean(DB.tier1Responses),
      criteriaDbId: DB.tier1Criteria ?? null,
      responsesDbId: DB.tier1Responses ?? null,
      criteriaCount: CRITERIA_SEED.length,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
