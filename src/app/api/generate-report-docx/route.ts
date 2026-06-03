import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { generateReport } from "@/lib/report/generate";
import { generateDocx } from "@/lib/report/docx";
import { notion } from "@/lib/notion/client";
import { bust, TAG } from "@/lib/utils/revalidate";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.lead_id || !body?.score_id) {
    return NextResponse.json({ error: "lead_id and score_id required" }, { status: 400 });
  }

  const leadId = body.lead_id as string;
  const scoreId = body.score_id as string;

  try {
    // Reuse the existing generate function to get all data + Claude content.
    // This may generate/regenerate the HTML report as a side effect — that's fine,
    // it's idempotent and updates the Notion record with the latest HTML URL.
    const htmlResult = await generateReport(leadId, scoreId);

    // Now build the DOCX using the same inputs. We re-fetch the lead/score data
    // via the same helper that generate.ts uses internally.
    const { notion: notionClient } = await import("@/lib/notion/client");
    const { isFullPage } = await import("@/lib/notion/parsers");
    const { parseScore } = await import("@/lib/notion/scores");

    const [leadPage, scorePage] = await Promise.all([
      notionClient.pages.retrieve({ page_id: leadId }),
      notionClient.pages.retrieve({ page_id: scoreId }),
    ]);

    if (!isFullPage(leadPage) || !isFullPage(scorePage)) {
      throw new Error("Could not retrieve lead or score from Notion");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lp = leadPage as any;
    function getStr(prop: string, type: string): string {
      const p = lp.properties?.[prop];
      if (!p) return "";
      if (type === "title") return p.title?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "";
      if (type === "rich_text") return p.rich_text?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "";
      if (type === "select") return p.select?.name ?? "";
      return "";
    }

    const clientName = getStr("First Name", "rich_text")
      ? `${getStr("First Name", "rich_text")} ${getStr("Last Name", "rich_text")}`.trim()
      : getStr("Lead Name", "title");
    const companyName = getStr("Company", "rich_text") || clientName;
    const industry = getStr("Industry", "select") || "Owner-Operated Business";
    const revenueRange = getStr("Revenue Range", "select") || "Not disclosed";
    const ownerHours = getStr("Owner Hours Per Week", "select") || "Not specified";
    const primaryObjective = getStr("Primary Objective", "select") || "Exit / Transition";

    const score = parseScore(scorePage);
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
    const classification = score.classification ?? "Founder-Dependent";

    const g1avg = g1 / 2.5;
    const g2avg = g2 / 2.5;
    const g3avg = g3 / 2.5;
    const g4avg = g4 / 2.5;
    const g5avg = g5 / 2.5;

    const tier3Status = g5avg < 2.0
      ? "Blocked · G5 < 2.0"
      : classification === "Founder-Dependent"
        ? "Not yet available"
        : "Available";

    const reportDate = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const reportId = htmlResult.report_id;

    // Pull Claude AI content from the HTML generation. We re-call Claude here
    // with the same prompt to populate the DOCX. To avoid double-billing on
    // regeneration, we cache the AI fields from the HTML result when available.
    // For now we call the Anthropic API a second time for a fresh DOCX draft.
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
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

Write a JSON object with exactly these keys. Respond with ONLY valid JSON — no markdown, no commentary.

{
  "executive_summary": "2-3 sentences on the overall structural condition. Reference actual scores and classification.",
  "hero_headline": "Single declarative sentence under 12 words capturing the core structural problem.",
  "fragility_intro": "One sentence under 30 words on how fragility vectors compound.",
  "fragility_1_title": "Short title 2-4 words for the most critical fragility vector",
  "fragility_1_body": "2-3 sentences specific to this business.",
  "fragility_1_tag": "Gate · criterion name · compression range",
  "fragility_2_title": "Short title for second fragility vector",
  "fragility_2_body": "2-3 sentences.",
  "fragility_2_tag": "Gate · criterion · compression range",
  "fragility_3_title": "Short title for third fragility vector",
  "fragility_3_body": "2-3 sentences.",
  "fragility_3_tag": "Gate · criterion · compression range",
  "gate_1_analysis": "2 sentences on Gate 1 Authority score and SBA underwriting implications.",
  "gate_2_analysis": "2 sentences on Gate 2 Process score.",
  "gate_3_analysis": "2 sentences on Gate 3 Commercial score.",
  "gate_4_analysis": "2 sentences on Gate 4 Revenue score.",
  "gate_5_analysis": "2 sentences on Gate 5 Financial score.",
  "path_why_now": "Bold statement under 10 words on Tier II urgency.",
  "path_why_now_body": "2-3 sentences on structural urgency.",
  "path_inaction": "Bold statement under 10 words on cost of inaction.",
  "path_inaction_body": "2-3 sentences on consequences.",
  "move_1_title": "Highest-priority action imperative under 8 words",
  "move_1_body": "2-3 sentences on this action.",
  "move_1_tag": "G1 · criterion name",
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
  "rescore_summary": "2-3 sentences on buyer pool expansion and multiple.",
  "compression_headline": "Current SDE multiple situation under 12 words.",
  "compression_body": "2 sentences on how gate scores compress the multiple."
}`;

    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const rawJson = (resp.content[0] as { type: string; text: string }).text.trim();
    const cleanJson = rawJson.replace(/^```json?\s*/i, "").replace(/\s*```$/, "");
    let ai: Record<string, string>;
    try {
      ai = JSON.parse(cleanJson) as Record<string, string>;
    } catch {
      throw new Error(`Claude returned invalid JSON for DOCX generation`);
    }

    // Generate the DOCX
    const docxUrl = await generateDocx({
      clientName, companyName, industry, revenueRange, ownerHours, primaryObjective,
      rawScore, scorePct, weightedScore, classification,
      reportId, reportDate,
      g1, g2, g3, g4, g5,
      g1avg, g2avg, g3avg, g4avg, g5avg,
      ai, flags: score.flags, tier3Status,
    });

    // Write DOCX URL back to Notion Diagnostic Scores record
    await notion.pages.update({
      page_id: scoreId,
      properties: {
        "Report Document URL": { url: docxUrl },
      } as never,
    });

    bust(TAG.scores);

    return NextResponse.json({
      success: true,
      docx_url: docxUrl,
      html_url: htmlResult.report_url,
      report_id: reportId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/generate-report-docx]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
