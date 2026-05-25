import Anthropic from "@anthropic-ai/sdk";
import { put } from "@vercel/blob";
import { notion } from "@/lib/notion/client";
import { isFullPage } from "@/lib/notion/parsers";
import { parseScore } from "@/lib/notion/scores";
import { injectTemplate } from "@/lib/report/template";
import { bust, TAG } from "@/lib/utils/revalidate";
import crypto from "crypto";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gateAvg(score: number | null): string {
  if (score == null) return "0.0";
  return (score / 2.5).toFixed(1);
}

function gateSev(score: number | null): string {
  if (score == null) return "2";
  const avg = score / 2.5;
  if (avg < 1.5) return "1";
  if (avg < 2.5) return "2";
  if (avg < 3.5) return "3";
  return "4";
}

function gateFlag(score: number | null, gateNum: number): string {
  if (score == null) return "PENDING";
  const avg = score / 2.5;
  if (avg < 1.5) return "OVERRIDE";
  if (avg < 2.0) return gateNum === 5 ? "TIER III BLOCK" : "BELOW 2.0";
  if (avg < 2.5) return "BELOW 2.5";
  return "ACCEPTABLE";
}

function gateFlagClass(score: number | null): string {
  if (score == null) return "";
  const avg = score / 2.5;
  return avg < 2.0 ? "" : "warn";
}

function gateBarType(score: number | null): string {
  if (score == null) return "critical";
  return score / 2.5 < 2.0 ? "critical" : "warn";
}

function gateMeta(flag: string): string {
  if (flag === "OVERRIDE" || flag === "TIER III BLOCK") return "flag";
  if (flag.startsWith("BELOW")) return "warn";
  return "";
}

function classificationTag(c: string | null): string {
  if (!c) return "ASSESSED";
  const map: Record<string, string> = {
    "Founder-Dependent": "FOUNDER-DEPENDENT",
    Transitional: "TRANSITIONAL",
    Stabilized: "STABILIZED",
    "Transfer-Ready": "TRANSFER-READY",
  };
  return map[c] ?? c.toUpperCase();
}

function activeBand(classification: string | null): [string, string, string, string] {
  switch (classification) {
    case "Founder-Dependent": return ["active", "", "", ""];
    case "Transitional": return ["", "active", "", ""];
    case "Stabilized": return ["", "", "active", ""];
    case "Transfer-Ready": return ["", "", "", "active"];
    default: return ["active", "", "", ""];
  }
}

function arcColor(pct: number): string {
  if (pct < 37) return "#a63232";
  if (pct < 62) return "#b07a14";
  return "#2D7A4F";
}

function compressionByGate(score: number | null): string {
  if (score == null) return "—";
  const avg = score / 2.5;
  if (avg < 1.5) return "−0.5–1.0x";
  if (avg < 2.0) return "−0.25–0.5x";
  if (avg < 2.5) return "−0.1–0.25x";
  return "Neutral";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStr(page: any, prop: string, type: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = (page as any).properties;
  if (!props) return "";
  const p = props[prop];
  if (!p) return "";
  if (type === "title") return p.title?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "";
  if (type === "rich_text") return p.rich_text?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "";
  if (type === "select") return p.select?.name ?? "";
  if (type === "email") return p.email ?? "";
  if (type === "number") return String(p.number ?? "");
  return "";
}

// ─── Main generation function ─────────────────────────────────────────────────

export interface GenerateReportResult {
  success: true;
  report_url: string;
  report_id: string;
  slug: string;
}

export async function generateReport(
  lead_id: string,
  score_id: string
): Promise<GenerateReportResult> {
  // 1. Fetch Lead from Notion
  const leadPage = await notion.pages.retrieve({ page_id: lead_id });
  if (!isFullPage(leadPage)) throw new Error("Lead page not found");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lp = leadPage as any;

  const clientName =
    getStr(lp, "First Name", "rich_text")
      ? `${getStr(lp, "First Name", "rich_text")} ${getStr(lp, "Last Name", "rich_text")}`.trim()
      : getStr(lp, "Lead Name", "title");
  const companyName = getStr(lp, "Company", "rich_text") || clientName;
  const industry = getStr(lp, "Industry", "select") || "Owner-Operated Business";
  const revenueRange = getStr(lp, "Revenue Range", "select") || "Not disclosed";
  const ownerHours = getStr(lp, "Owner Hours Per Week", "select") || "Not specified";
  const primaryObjective = getStr(lp, "Primary Objective", "select") || "Exit / Transition";

  // 2. Fetch Score from Notion
  const scorePage = await notion.pages.retrieve({ page_id: score_id });
  if (!isFullPage(scorePage)) throw new Error("Score page not found");
  const score = parseScore(scorePage);

  // 3. Derive gate metrics
  const rawScore = score.rawScore ?? 0;
  const scorePct = score.scorePct ?? Math.round((rawScore / 50) * 100);
  const g1 = score.authority ?? 0;
  const g2 = score.process ?? 0;
  const g3 = score.pricing ?? 0;
  const g4 = score.revenue ?? 0;
  const g5 = score.financial ?? 0;
  const weightedScore = Math.round(
    g1 * 1.5 * 2 + g2 * 2 + g3 * 2 + g4 * 1.5 * 2 + g5 * 1.25 * 2
  );
  const weightedMax = 125;
  const classification = score.classification ?? "Founder-Dependent";

  const g1avg = parseFloat(gateAvg(g1));
  const g2avg = parseFloat(gateAvg(g2));
  const g3avg = parseFloat(gateAvg(g3));
  const g4avg = parseFloat(gateAvg(g4));
  const g5avg = parseFloat(gateAvg(g5));

  const [b1, b2, b3, b4] = activeBand(classification);
  const pctDecimal = (scorePct / 100).toFixed(4);
  const arcC = 2 * Math.PI * 42;
  const arcDash = `${(arcC * scorePct / 100).toFixed(2)} ${arcC.toFixed(2)}`;

  const tier3Status = g5avg < 2.0
    ? "Blocked · G5 < 2.0"
    : classification === "Founder-Dependent"
      ? "Not yet available"
      : "Available";

  // 4. Call Claude API
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are writing a Tier I Structural Diagnostic Report for Northbridge Strategies.

CLIENT DATA:
- Name: ${clientName}
- Company: ${companyName}
- Industry: ${industry}
- Revenue Range: ${revenueRange}
- Owner Hours/Week: ${ownerHours}
- Primary Objective: ${primaryObjective}
- Classification: ${classification}
- Raw Score: ${rawScore}/50 (${scorePct}%)
- Weighted Score: ${weightedScore}/125
- Gate 1 (Authority): ${g1}/10 → avg ${g1avg.toFixed(1)}
- Gate 2 (Process): ${g2}/10 → avg ${g2avg.toFixed(1)}
- Gate 3 (Pricing/Commercial): ${g3}/10 → avg ${g3avg.toFixed(1)}
- Gate 4 (Revenue): ${g4}/10 → avg ${g4avg.toFixed(1)}
- Gate 5 (Financial): ${g5}/10 → avg ${g5avg.toFixed(1)}
- Flags: ${score.flags || "None noted"}
- Manual Review Notes: ${score.manualReviewNotes || "None"}

Write a JSON object with exactly these keys. Respond with ONLY valid JSON — no markdown, no commentary, no code blocks.

{
  "executive_summary": "2-3 sentences on the overall structural condition. Reference actual scores and classification. Specific to this company.",
  "hero_headline": "Single declarative sentence under 12 words capturing the core structural problem. No period.",
  "fragility_intro": "One sentence under 30 words on how the fragility vectors compound for this business.",
  "fragility_1_title": "Short title 2-4 words for the most critical fragility vector",
  "fragility_1_body": "2-3 sentences on this vector specific to a ${industry} business scoring ${g1}/10 on Authority.",
  "fragility_1_tag": "Authority concentration · estimated SDE compression range",
  "fragility_2_title": "Short title for second fragility vector",
  "fragility_2_body": "2-3 sentences for this vector.",
  "fragility_2_tag": "Revenue dependency · estimated SDE compression range",
  "fragility_3_title": "Short title for third fragility vector",
  "fragility_3_body": "2-3 sentences for this vector.",
  "fragility_3_tag": "Financial evidence · estimated SDE compression range",
  "gate_1_analysis": "2 sentences on Gate 1 Authority score ${g1}/10 and SBA underwriting implications.",
  "gate_2_analysis": "2 sentences on Gate 2 Process score ${g2}/10.",
  "gate_3_analysis": "2 sentences on Gate 3 Commercial score ${g3}/10.",
  "gate_4_analysis": "2 sentences on Gate 4 Revenue score ${g4}/10.",
  "gate_5_analysis": "2 sentences on Gate 5 Financial score ${g5}/10.",
  "path_why_now": "Bold statement under 10 words on Tier II urgency.",
  "path_why_now_body": "2-3 sentences on structural urgency.",
  "path_inaction": "Bold statement under 10 words on cost of inaction.",
  "path_inaction_body": "2-3 sentences on consequences of no structural correction.",
  "move_1_title": "Highest-priority action imperative under 8 words",
  "move_1_body": "2-3 sentences on this action for this business.",
  "move_1_tag": "G1 or G2 etc · criterion name",
  "move_1_impact": "One sentence on structural impact.",
  "move_2_title": "Second action title",
  "move_2_body": "2-3 sentences.",
  "move_2_tag": "Gate · criterion",
  "move_2_impact": "One sentence.",
  "move_3_title": "Third action title",
  "move_3_body": "2-3 sentences.",
  "move_3_tag": "Gate · criterion",
  "move_3_impact": "One sentence.",
  "move_4_title": "Fourth action title",
  "move_4_body": "2-3 sentences.",
  "move_4_tag": "Gate · criterion",
  "move_4_impact": "One sentence.",
  "move_5_title": "Fifth action title",
  "move_5_body": "2-3 sentences.",
  "move_5_tag": "Gate · criterion",
  "move_5_impact": "One sentence.",
  "rescore_headline": "What Tier II re-scoring achieves under 15 words.",
  "rescore_summary": "2-3 sentences on buyer pool expansion and multiple for this business.",
  "compression_headline": "Current SDE multiple situation under 12 words.",
  "compression_body": "2 sentences on how gate scores compress the multiple."
}`;

  const claudeResp = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const rawJson = (claudeResp.content[0] as { type: string; text: string }).text.trim();
  const cleanJson = rawJson.replace(/^```json?\s*/i, "").replace(/\s*```$/, "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ai: Record<string, string>;
  try {
    ai = JSON.parse(cleanJson);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${rawJson.slice(0, 200)}`);
  }

  // 5. Build template variables
  const reportId = `NB-T1-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const reportDate = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const vars: Record<string, string | number> = {
    CLIENT_NAME: clientName,
    COMPANY_NAME: companyName,
    INDUSTRY: industry,
    REVENUE_RANGE: revenueRange,
    OWNER_HOURS: ownerHours,
    PRIMARY_OBJECTIVE: primaryObjective,
    RAW_SCORE: rawScore,
    RAW_SCORE_MAX: 50,
    SCORE_PERCENTAGE: scorePct,
    WEIGHTED_SCORE: weightedScore,
    WEIGHTED_MAX: weightedMax,
    CLASSIFICATION: classification,
    CLASSIFICATION_TAG: classificationTag(classification),
    GATE_1_SCORE: g1,
    GATE_2_SCORE: g2,
    GATE_3_SCORE: g3,
    GATE_4_SCORE: g4,
    GATE_5_SCORE: g5,
    GATE_1_AVG: g1avg.toFixed(1),
    GATE_2_AVG: g2avg.toFixed(1),
    GATE_3_AVG: g3avg.toFixed(1),
    GATE_4_AVG: g4avg.toFixed(1),
    GATE_5_AVG: g5avg.toFixed(1),
    GATE_1_FLAG: gateFlag(g1, 1),
    GATE_2_FLAG: gateFlag(g2, 2),
    GATE_3_FLAG: gateFlag(g3, 3),
    GATE_4_FLAG: gateFlag(g4, 4),
    GATE_5_FLAG: gateFlag(g5, 5),
    GATE_1_FLAG_CLASS: gateFlagClass(g1),
    GATE_2_FLAG_CLASS: gateFlagClass(g2),
    GATE_3_FLAG_CLASS: gateFlagClass(g3),
    GATE_4_FLAG_CLASS: gateFlagClass(g4),
    GATE_5_FLAG_CLASS: gateFlagClass(g5),
    GATE_1_META_CLASS: gateMeta(gateFlag(g1, 1)),
    GATE_2_META_CLASS: gateMeta(gateFlag(g2, 2)),
    GATE_3_META_CLASS: gateMeta(gateFlag(g3, 3)),
    GATE_4_META_CLASS: gateMeta(gateFlag(g4, 4)),
    GATE_5_META_CLASS: gateMeta(gateFlag(g5, 5)),
    GATE_1_SEV: gateSev(g1),
    GATE_2_SEV: gateSev(g2),
    GATE_3_SEV: gateSev(g3),
    GATE_4_SEV: gateSev(g4),
    GATE_5_SEV: gateSev(g5),
    GATE_1_BAR_TYPE: gateBarType(g1),
    GATE_2_BAR_TYPE: gateBarType(g2),
    GATE_3_BAR_TYPE: gateBarType(g3),
    GATE_4_BAR_TYPE: gateBarType(g4),
    GATE_5_BAR_TYPE: gateBarType(g5),
    ACTIVE_BAND_1: b1,
    ACTIVE_BAND_2: b2,
    ACTIVE_BAND_3: b3,
    ACTIVE_BAND_4: b4,
    BAND_1_TAG: classification === "Founder-Dependent" ? `★ Current · ${weightedScore}/125` : "",
    BAND_2_TAG: classification === "Transitional" ? `★ Current · ${weightedScore}/125` : "Target post-Tier II",
    BAND_3_TAG: classification === "Stabilized" ? `★ Current · ${weightedScore}/125` : "Tier III path",
    BAND_4_TAG: classification === "Transfer-Ready" ? `★ Current · ${weightedScore}/125` : "Premium multiple",
    SCORE_ARC_COLOR: arcColor(scorePct),
    SCORE_ARC_DASHARRAY: arcDash,
    SCORE_PCT_DECIMAL: pctDecimal,
    TIER3_STATUS: tier3Status,
    G1_COMPRESSION: compressionByGate(g1),
    G3_COMPRESSION: compressionByGate(g3),
    G5_COMPRESSION: compressionByGate(g5),
    REPORT_DATE: reportDate,
    REPORT_ID: reportId,
    FLAGS_CONTENT: score.flags || "",
    EXECUTIVE_SUMMARY: ai.executive_summary ?? "",
    HERO_HEADLINE: ai.hero_headline ?? `${companyName} Structural Diagnostic`,
    FRAGILITY_INTRO: ai.fragility_intro ?? "",
    FRAGILITY_1_TITLE: ai.fragility_1_title ?? "Authority Concentration",
    FRAGILITY_1_BODY: ai.fragility_1_body ?? "",
    FRAGILITY_1_TAG: ai.fragility_1_tag ?? "G1 · Authority Architecture",
    FRAGILITY_2_TITLE: ai.fragility_2_title ?? "Revenue Dependency",
    FRAGILITY_2_BODY: ai.fragility_2_body ?? "",
    FRAGILITY_2_TAG: ai.fragility_2_tag ?? "G4 · Revenue Quality",
    FRAGILITY_3_TITLE: ai.fragility_3_title ?? "Financial Evidence Quality",
    FRAGILITY_3_BODY: ai.fragility_3_body ?? "",
    FRAGILITY_3_TAG: ai.fragility_3_tag ?? "G5 · Financial Integrity",
    GATE_1_ANALYSIS: ai.gate_1_analysis ?? "",
    GATE_2_ANALYSIS: ai.gate_2_analysis ?? "",
    GATE_3_ANALYSIS: ai.gate_3_analysis ?? "",
    GATE_4_ANALYSIS: ai.gate_4_analysis ?? "",
    GATE_5_ANALYSIS: ai.gate_5_analysis ?? "",
    PATH_WHY_NOW: ai.path_why_now ?? "Three gate averages run below 1.5.",
    PATH_WHY_NOW_BODY: ai.path_why_now_body ?? "",
    PATH_INACTION: ai.path_inaction ?? "Inaction is not neutral.",
    PATH_INACTION_BODY: ai.path_inaction_body ?? "",
    MOVE_1_TITLE: ai.move_1_title ?? "Document decision authority.",
    MOVE_1_BODY: ai.move_1_body ?? "",
    MOVE_1_TAG: ai.move_1_tag ?? "G1 · Authority Architecture",
    MOVE_1_IMPACT: ai.move_1_impact ?? "",
    MOVE_2_TITLE: ai.move_2_title ?? "Separate personal and business expenses.",
    MOVE_2_BODY: ai.move_2_body ?? "",
    MOVE_2_TAG: ai.move_2_tag ?? "G5 · Financial Integrity",
    MOVE_2_IMPACT: ai.move_2_impact ?? "",
    MOVE_3_TITLE: ai.move_3_title ?? "Build the first five SOPs.",
    MOVE_3_BODY: ai.move_3_body ?? "",
    MOVE_3_TAG: ai.move_3_tag ?? "G2 · Process Independence",
    MOVE_3_IMPACT: ai.move_3_impact ?? "",
    MOVE_4_TITLE: ai.move_4_title ?? "Install pricing and discount rules.",
    MOVE_4_BODY: ai.move_4_body ?? "",
    MOVE_4_TAG: ai.move_4_tag ?? "G3 · Commercial Discipline",
    MOVE_4_IMPACT: ai.move_4_impact ?? "",
    MOVE_5_TITLE: ai.move_5_title ?? "Start the data room.",
    MOVE_5_BODY: ai.move_5_body ?? "",
    MOVE_5_TAG: ai.move_5_tag ?? "G5 · Audit Readiness",
    MOVE_5_IMPACT: ai.move_5_impact ?? "",
    RESCORE_HEADLINE: ai.rescore_headline ?? "Gate averages above 2.5 — except G5, above 2.0.",
    RESCORE_SUMMARY: ai.rescore_summary ?? "",
    COMPRESSION_HEADLINE: ai.compression_headline ?? "",
    COMPRESSION_BODY: ai.compression_body ?? "",
  };

  // 6. Render HTML
  const html = injectTemplate(vars);

  // 7. Store in Vercel Blob
  const slug = crypto.randomBytes(6).toString("hex");
  const year = new Date().getFullYear();
  // e.g. "John-Smith-Cascade-Mechanical-2026-a3f9c1"
  const safeName = `${clientName}-${companyName}`
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const blobPath = `reports/${safeName}-${year}-${slug}/index.html`;
  const blob = await put(blobPath, html, {
    access: "public",
    contentType: "text/html; charset=utf-8",
    addRandomSuffix: false,
  });

  // 8. Write URL back to Notion score record
  await notion.pages.update({
    page_id: score_id,
    properties: {
      "Report Draft URL": { url: blob.url },
      "Report Draft Generated": { checkbox: true },
      "Report HITL Action": { select: { name: "Pending" } },
    } as never,
  });

  // 9. Append report entry to Lead's "Generated Reports" field
  // Read existing value first so we can append rather than overwrite
  try {
    const leadPage = await notion.pages.retrieve({ page_id: lead_id });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingProp = (leadPage as any)?.properties?.["Generated Reports"];
    const existingText: string =
      existingProp?.rich_text?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "";
    const newEntry = `[${reportId}] ${blob.url}`;
    const combined = existingText
      ? `${existingText}\n${newEntry}`
      : newEntry;
    // Notion rich_text has a 2000-char limit per block; trim oldest entries if needed
    const trimmed = combined.length > 1900
      ? combined.slice(combined.length - 1900)
      : combined;
    await notion.pages.update({
      page_id: lead_id,
      properties: {
        "Generated Reports": {
          rich_text: [{ type: "text", text: { content: trimmed } }],
        },
      } as never,
    });
  } catch {
    // Non-fatal — score record already has the URL
  }

  // 10. Bust caches
  bust(TAG.scores, TAG.leads, TAG.activity);

  return { success: true, report_url: blob.url, report_id: reportId, slug };
}
