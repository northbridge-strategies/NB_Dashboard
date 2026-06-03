import "server-only";
import { notion } from "./client";
import { DB } from "./ids";
import { cached, TAG } from "./cache";
import {
  getCheckbox,
  getNumber,
  getRichText,
  getRelationIds,
  getSelect,
  getTitle,
  isFullPage,
  type Page,
} from "./parsers";
import type { CRITERIA_SEED } from "./criteria-seed";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Tier1Criterion {
  id: string;
  criterionId: string;    // G1C1 … G5C25
  gate: string;
  gateWeight: number;
  criterionName: string;
  operatorQuestion: string;
  score1Response: string;
  score2Response: string;
  score3Response: string;
  score4Response: string;
  transactionConsequence: string;
  dscrImpact: string;
  defaultSeverity: string;
  defaultPriority: string;
  criticalCriterion: boolean;
}

export interface Tier1Response {
  id: string;
  leadId: string | null;
  scoreRecordId: string | null;
  criterionId: string | null;    // Page ID of the criterion record
  criterionCode: string;          // G1C1 etc. (from lookup)
  gate: string;
  score: number | null;           // 1–4
  fieldNote: string;
  evidenceRequested: string;
  residualRiskFlag: boolean;
  includeInReport: boolean;
  severity: string;
  priority: string;
  weightedScore: number | null;
  overrideContributor: boolean;
  scoredAt: string | null;
}

// ── Parsers ──────────────────────────────────────────────────────────────────

export function parseCriterion(page: Page): Tier1Criterion {
  return {
    id: page.id,
    criterionId: getTitle(page, "Criterion ID"),
    gate: getRichText(page, "Gate"),
    gateWeight: getNumber(page, "Gate Weight") ?? 1.0,
    criterionName: getRichText(page, "Criterion Name"),
    operatorQuestion: getRichText(page, "Operator Question"),
    score1Response: getRichText(page, "Score 1 Response"),
    score2Response: getRichText(page, "Score 2 Response"),
    score3Response: getRichText(page, "Score 3 Response"),
    score4Response: getRichText(page, "Score 4 Response"),
    transactionConsequence: getRichText(page, "Transaction Consequence"),
    dscrImpact: getSelect(page, "DSCR Impact") ?? "Medium",
    defaultSeverity: getSelect(page, "Default Severity") ?? "Critical",
    defaultPriority: getSelect(page, "Default Priority") ?? "Immediate",
    criticalCriterion: getCheckbox(page, "Critical Criterion"),
  };
}

export function parseResponse(page: Page): Tier1Response {
  const leadIds = getRelationIds(page, "Lead");
  const scoreIds = getRelationIds(page, "Diagnostic Score Record");
  const criterionIds = getRelationIds(page, "Criterion");
  const scoreVal = getSelect(page, "Score");
  const scoreNum = scoreVal ? parseInt(scoreVal, 10) : null;
  const gateWeight = getNumber(page, "Gate Weight") ?? 1.0;
  const weightedScore = scoreNum != null ? Math.round(scoreNum * gateWeight * 100) / 100 : null;
  return {
    id: page.id,
    leadId: leadIds[0] ?? null,
    scoreRecordId: scoreIds[0] ?? null,
    criterionId: criterionIds[0] ?? null,
    criterionCode: getRichText(page, "Criterion ID"),
    gate: getRichText(page, "Gate"),
    score: scoreNum,
    fieldNote: getRichText(page, "Field Note"),
    evidenceRequested: getRichText(page, "Evidence Requested"),
    residualRiskFlag: getCheckbox(page, "Residual Risk Flag"),
    includeInReport: getCheckbox(page, "Include in Report"),
    severity: getSelect(page, "Severity") ?? "Critical",
    priority: getSelect(page, "Priority") ?? "Immediate",
    weightedScore,
    overrideContributor: getCheckbox(page, "Override Contributor"),
    scoredAt: getRichText(page, "Scored At") || null,
  };
}

// ── Read helpers ─────────────────────────────────────────────────────────────

export const listCriteria = cached(
  async (): Promise<Tier1Criterion[]> => {
    if (!DB.tier1Criteria) throw new Error("NOTION_TIER1_CRITERIA_DB not configured. Run /api/tier1/setup first.");
    const res = await notion.databases.query({
      database_id: DB.tier1Criteria,
      page_size: 100,
      sorts: [{ property: "Criterion ID", direction: "ascending" }],
    });
    return res.results.filter(isFullPage).map(parseCriterion);
  },
  ["tier1:criteria"],
  { tags: [TAG.tier1] },
);

export async function listResponsesForEngagement(scoreRecordId: string): Promise<Tier1Response[]> {
  if (!DB.tier1Responses) return [];
  const res = await notion.databases.query({
    database_id: DB.tier1Responses,
    page_size: 100,
    filter: {
      property: "Diagnostic Score Record",
      relation: { contains: scoreRecordId },
    },
    sorts: [{ property: "Criterion ID", direction: "ascending" }],
  });
  return res.results.filter(isFullPage).map(parseResponse);
}

// ── Write helpers ─────────────────────────────────────────────────────────────

export interface UpsertResponseInput {
  responsePageId?: string;       // if updating existing record
  leadId: string;
  scoreRecordId: string;
  criterionPageId: string;       // Notion page ID of the criterion
  criterionCode: string;         // G1C1 etc.
  gate: string;
  gateWeight: number;
  score?: number | null;         // 1–4
  fieldNote?: string;
  evidenceRequested?: string;
  residualRiskFlag?: boolean;
  severity?: string;
  priority?: string;
  criticalCriterion?: boolean;
}

export async function upsertResponse(input: UpsertResponseInput): Promise<string> {
  if (!DB.tier1Responses) throw new Error("NOTION_TIER1_RESPONSES_DB not configured.");

  const scoreStr = input.score != null ? String(input.score) : undefined;
  const weightedScore = input.score != null ? Math.round(input.score * input.gateWeight * 100) / 100 : undefined;
  const overrideContributor = input.score === 1 && input.criticalCriterion === true;
  const includeInReport = input.score != null && input.score <= 2;

  const properties: Record<string, unknown> = {
    "Criterion ID": { rich_text: [{ type: "text", text: { content: input.criterionCode } }] },
    "Gate": { rich_text: [{ type: "text", text: { content: input.gate } }] },
    "Gate Weight": { number: input.gateWeight },
    "Lead": { relation: [{ id: input.leadId }] },
    "Diagnostic Score Record": { relation: [{ id: input.scoreRecordId }] },
    "Criterion": { relation: [{ id: input.criterionPageId }] },
  };

  if (scoreStr !== undefined) properties["Score"] = { select: { name: scoreStr } };
  if (weightedScore !== undefined) properties["Weighted Score"] = { number: weightedScore };
  if (input.fieldNote !== undefined) {
    properties["Field Note"] = { rich_text: [{ type: "text", text: { content: input.fieldNote } }] };
  }
  if (input.evidenceRequested !== undefined) {
    properties["Evidence Requested"] = { rich_text: [{ type: "text", text: { content: input.evidenceRequested } }] };
  }
  if (input.residualRiskFlag !== undefined) {
    properties["Residual Risk Flag"] = { checkbox: input.residualRiskFlag };
  }
  if (input.severity !== undefined) {
    properties["Severity"] = { select: { name: input.severity } };
  }
  if (input.priority !== undefined) {
    properties["Priority"] = { select: { name: input.priority } };
  }
  if (input.score != null) {
    properties["Override Contributor"] = { checkbox: overrideContributor };
    properties["Include in Report"] = { checkbox: includeInReport };
    properties["Scored At"] = { rich_text: [{ type: "text", text: { content: new Date().toISOString() } }] };
  }

  if (input.responsePageId) {
    // Update existing
    await notion.pages.update({ page_id: input.responsePageId, properties: properties as never });
    return input.responsePageId;
  } else {
    // Create new
    const page = await notion.pages.create({
      parent: { database_id: DB.tier1Responses! },
      properties: {
        // Title field = Criterion ID + score
        "Response Title": { title: [{ type: "text", text: { content: `${input.criterionCode} · Score ${input.score ?? "—"}` } }] },
        ...properties,
      } as never,
    });
    return page.id;
  }
}

/** Bulk-create 25 blank response records for a new engagement */
export async function createBlankResponses(
  leadId: string,
  scoreRecordId: string,
  criteria: Tier1Criterion[],
): Promise<void> {
  if (!DB.tier1Responses) throw new Error("NOTION_TIER1_RESPONSES_DB not configured.");

  // Process in serial to avoid Notion API rate limits
  for (const c of criteria) {
    await notion.pages.create({
      parent: { database_id: DB.tier1Responses! },
      properties: {
        "Response Title": { title: [{ type: "text", text: { content: `${c.criterionId} · Score —` } }] },
        "Criterion ID": { rich_text: [{ type: "text", text: { content: c.criterionId } }] },
        "Gate": { rich_text: [{ type: "text", text: { content: c.gate } }] },
        "Gate Weight": { number: c.gateWeight },
        "Lead": { relation: [{ id: leadId }] },
        "Diagnostic Score Record": { relation: [{ id: scoreRecordId }] },
        "Criterion": { relation: [{ id: c.id }] },
        "Severity": { select: { name: c.defaultSeverity } },
        "Priority": { select: { name: c.defaultPriority } },
        "Override Contributor": { checkbox: false },
        "Include in Report": { checkbox: false },
        "Residual Risk Flag": { checkbox: false },
        "Field Note": { rich_text: [{ type: "text", text: { content: "" } }] },
        "Evidence Requested": { rich_text: [{ type: "text", text: { content: "" } }] },
        "Scored At": { rich_text: [{ type: "text", text: { content: "" } }] },
      } as never,
    });
    // 300ms delay between creates to respect Notion rate limits
    await new Promise(r => setTimeout(r, 300));
  }
}

// ── Notion database creation ──────────────────────────────────────────────────

/**
 * Create the Tier I Criteria database in the given Notion parent page.
 * Returns the new database ID.
 */
export async function createCriteriaDatabase(parentPageId: string): Promise<string> {
  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: "Tier I Criteria" } }],
    properties: {
      "Criterion ID": { title: {} },
      "Gate": { rich_text: {} },
      "Gate Weight": { number: { format: "number" } },
      "Criterion Name": { rich_text: {} },
      "Operator Question": { rich_text: {} },
      "Score 1 Response": { rich_text: {} },
      "Score 2 Response": { rich_text: {} },
      "Score 3 Response": { rich_text: {} },
      "Score 4 Response": { rich_text: {} },
      "Transaction Consequence": { rich_text: {} },
      "DSCR Impact": { select: { options: [
        { name: "Low", color: "green" },
        { name: "Medium", color: "yellow" },
        { name: "Medium-High", color: "orange" },
        { name: "High", color: "red" },
        { name: "Very High", color: "red" },
      ]}},
      "Default Severity": { select: { options: [
        { name: "Critical", color: "red" },
        { name: "Weakness", color: "orange" },
        { name: "Acceptable", color: "green" },
        { name: "Premium", color: "blue" },
      ]}},
      "Default Priority": { select: { options: [
        { name: "Immediate", color: "red" },
        { name: "90-Day", color: "orange" },
        { name: "12-Month", color: "yellow" },
        { name: "Monitor", color: "gray" },
      ]}},
      "Critical Criterion": { checkbox: {} },
    } as never,
  });
  return db.id;
}

/**
 * Create the Tier I Responses database in the given Notion parent page.
 * Returns the new database ID.
 */
export async function createResponsesDatabase(parentPageId: string): Promise<string> {
  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: "Tier I Responses" } }],
    properties: {
      "Response Title": { title: {} },
      "Criterion ID": { rich_text: {} },
      "Gate": { rich_text: {} },
      "Gate Weight": { number: { format: "number" } },
      "Lead": { relation: { database_id: DB.leads, single_property: {} } },
      "Diagnostic Score Record": { relation: { database_id: DB.scores, single_property: {} } },
      "Score": { select: { options: [
        { name: "1", color: "red" },
        { name: "2", color: "yellow" },
        { name: "3", color: "green" },
        { name: "4", color: "blue" },
      ]}},
      "Weighted Score": { number: { format: "number" } },
      "Severity": { select: { options: [
        { name: "Critical", color: "red" },
        { name: "Weakness", color: "orange" },
        { name: "Acceptable", color: "green" },
        { name: "Premium", color: "blue" },
      ]}},
      "Priority": { select: { options: [
        { name: "Immediate", color: "red" },
        { name: "90-Day", color: "orange" },
        { name: "12-Month", color: "yellow" },
        { name: "Monitor", color: "gray" },
      ]}},
      "Field Note": { rich_text: {} },
      "Evidence Requested": { rich_text: {} },
      "Residual Risk Flag": { checkbox: {} },
      "Include in Report": { checkbox: {} },
      "Override Contributor": { checkbox: {} },
      "Scored At": { rich_text: {} },
    } as never,
  });
  return db.id;
}

/**
 * Seed all 25 criteria into the Tier I Criteria database.
 * Safe to re-run — checks for existing records by Criterion ID first.
 */
export async function seedCriteria(
  criteriaDbId: string,
  seeds: typeof CRITERIA_SEED,
): Promise<void> {
  // Check existing records
  const existing = await notion.databases.query({
    database_id: criteriaDbId,
    page_size: 100,
  });
  const existingIds = new Set(
    existing.results
      .filter(isFullPage)
      .map(p => getTitle(p as Page, "Criterion ID"))
      .filter(Boolean)
  );

  for (const seed of seeds) {
    if (existingIds.has(seed.criterionId)) continue; // skip if already seeded

    await notion.pages.create({
      parent: { database_id: criteriaDbId },
      properties: {
        "Criterion ID": { title: [{ type: "text", text: { content: seed.criterionId } }] },
        "Gate": { rich_text: [{ type: "text", text: { content: seed.gate } }] },
        "Gate Weight": { number: seed.gateWeight },
        "Criterion Name": { rich_text: [{ type: "text", text: { content: seed.criterionName } }] },
        "Operator Question": { rich_text: [{ type: "text", text: { content: seed.operatorQuestion } }] },
        "Score 1 Response": { rich_text: [{ type: "text", text: { content: seed.score1Response.slice(0, 2000) } }] },
        "Score 2 Response": { rich_text: [{ type: "text", text: { content: seed.score2Response.slice(0, 2000) } }] },
        "Score 3 Response": { rich_text: [{ type: "text", text: { content: seed.score3Response.slice(0, 2000) } }] },
        "Score 4 Response": { rich_text: [{ type: "text", text: { content: seed.score4Response.slice(0, 2000) } }] },
        "Transaction Consequence": { rich_text: [{ type: "text", text: { content: seed.transactionConsequence } }] },
        "DSCR Impact": { select: { name: seed.dscrImpact } },
        "Default Severity": { select: { name: seed.defaultSeverity } },
        "Default Priority": { select: { name: seed.defaultPriority } },
        "Critical Criterion": { checkbox: seed.criticalCriterion },
      } as never,
    });

    // Respect Notion rate limits
    await new Promise(r => setTimeout(r, 400));
  }
}
