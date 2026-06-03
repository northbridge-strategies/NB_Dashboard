import "server-only";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  LineRuleType,
  convertInchesToTwip,
  UnderlineType,
} from "docx";

type DocChild = Paragraph | Table;
import { put } from "@vercel/blob";
import crypto from "crypto";
import type { GenerateReportResult } from "./generate";

// ── Brand colours (hex without #) ──────────────────────────────────────────
const C = {
  navy: "0F1E38",
  navyMid: "1B2A4A",
  orange: "D4711E",
  grey: "5C6478",
  body: "1A1F2C",
  green: "2D7A4F",
  red: "a63232",
  amber: "b07a14",
  lightGreen: "5c8a4a",
  darkGreen: "2D7A4F",
  rule: "D8D4C7",
  white: "FFFFFF",
  paperDark: "F0EDE6",
} as const;

// ── Typography helpers ──────────────────────────────────────────────────────

function run(text: string, opts: {
  bold?: boolean;
  color?: string;
  size?: number; // half-points
  font?: string;
  italics?: boolean;
  underline?: boolean;
  allCaps?: boolean;
} = {}): TextRun {
  return new TextRun({
    text,
    bold: opts.bold,
    color: opts.color ?? C.body,
    size: opts.size ?? 20, // 10pt default
    font: opts.font ?? "Calibri",
    italics: opts.italics,
    underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
    allCaps: opts.allCaps,
  });
}

function serifRun(text: string, opts: {
  bold?: boolean;
  color?: string;
  size?: number;
  italics?: boolean;
} = {}): TextRun {
  return run(text, { ...opts, font: "Georgia" });
}

function monoRun(text: string, opts: { color?: string; size?: number } = {}): TextRun {
  return run(text, { ...opts, font: "Courier New", size: opts.size ?? 18 });
}

function para(runs: TextRun | TextRun[], opts: {
  align?: typeof AlignmentType[keyof typeof AlignmentType];
  spaceBefore?: number;
  spaceAfter?: number;
  heading?: typeof HeadingLevel[keyof typeof HeadingLevel];
  indent?: { left?: number; firstLine?: number };
  keepNext?: boolean;
  pageBreak?: boolean;
} = {}): Paragraph {
  const children: (TextRun | PageBreak)[] = opts.pageBreak
    ? [new PageBreak(), ...(Array.isArray(runs) ? runs : [runs])]
    : Array.isArray(runs) ? runs : [runs];
  return new Paragraph({
    children,
    alignment: opts.align,
    heading: opts.heading,
    keepNext: opts.keepNext,
    indent: opts.indent,
    spacing: {
      before: opts.spaceBefore ?? 0,
      after: opts.spaceAfter ?? 120,
      line: 276,
      lineRule: LineRuleType.AUTO,
    },
  });
}

function heading1(text: string, spaceBefore = 480): Paragraph {
  return para(
    [serifRun(text, { bold: true, color: C.navy, size: 28 })],
    { spaceBefore, spaceAfter: 180, keepNext: true }
  );
}

function heading2(text: string, spaceBefore = 320): Paragraph {
  return para(
    [serifRun(text, { bold: true, color: C.navyMid, size: 24 })],
    { spaceBefore, spaceAfter: 120, keepNext: true }
  );
}

function heading3(text: string): Paragraph {
  return para(
    [serifRun(text, { bold: true, color: C.navyMid, size: 22 })],
    { spaceBefore: 240, spaceAfter: 80, keepNext: true }
  );
}

function kicker(text: string): Paragraph {
  return para(
    [monoRun(text.toUpperCase(), { color: C.grey, size: 16 })],
    { spaceBefore: 0, spaceAfter: 60 }
  );
}

function rule(): Paragraph {
  return new Paragraph({
    border: { bottom: { color: C.rule, size: 6, space: 1, style: BorderStyle.SINGLE } },
    spacing: { before: 120, after: 120 },
    children: [],
  });
}

function thickRule(): Paragraph {
  return new Paragraph({
    border: { bottom: { color: C.navy, size: 12, space: 1, style: BorderStyle.SINGLE } },
    spacing: { before: 120, after: 240 },
    children: [],
  });
}

function bodyPara(text: string, opts: { spaceBefore?: number; spaceAfter?: number; color?: string } = {}): Paragraph {
  return para(
    [run(text, { color: opts.color ?? C.body, size: 20 })],
    { spaceBefore: opts.spaceBefore ?? 0, spaceAfter: opts.spaceAfter ?? 160 }
  );
}

function labeledPara(label: string, text: string): Paragraph {
  return para([
    run(label + "  ", { bold: true, color: C.body, size: 20, font: "Georgia" }),
    run(text, { color: C.body, size: 20 }),
  ], { spaceAfter: 140 });
}

// ── Table helpers ──────────────────────────────────────────────────────────

function cell(content: string | Paragraph[], opts: {
  shading?: string;
  bold?: boolean;
  color?: string;
  size?: number;
  width?: number;
  align?: typeof AlignmentType[keyof typeof AlignmentType];
} = {}): TableCell {
  const paragraphs: Paragraph[] = typeof content === "string"
    ? [new Paragraph({
        children: [run(content, {
          bold: opts.bold,
          color: opts.color ?? C.body,
          size: opts.size ?? 18,
        })],
        alignment: opts.align,
        spacing: { before: 60, after: 60 },
      })]
    : content;

  return new TableCell({
    children: paragraphs,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shading
      ? { type: ShadingType.SOLID, color: opts.shading, fill: opts.shading }
      : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: C.rule },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: C.rule },
      left: { style: BorderStyle.SINGLE, size: 4, color: C.rule },
      right: { style: BorderStyle.SINGLE, size: 4, color: C.rule },
    },
  });
}

function headerRow(cols: string[]): TableRow {
  return new TableRow({
    children: cols.map(c => cell(c, { shading: C.navy, bold: true, color: C.white, size: 18 })),
    tableHeader: true,
  });
}

function dataRow(cols: string[], shade?: string): TableRow {
  return new TableRow({
    children: cols.map(c => cell(c, { shading: shade, size: 18 })),
  });
}

function scoreColorForNum(score: number | null): string {
  if (score == null) return C.grey;
  if (score <= 1.5) return C.red;
  if (score <= 2.5) return C.amber;
  if (score <= 3.5) return C.lightGreen;
  return C.darkGreen;
}

// ── Main DOCX generation ───────────────────────────────────────────────────

export interface DocxInput {
  clientName: string;
  companyName: string;
  industry: string;
  revenueRange: string;
  ownerHours: string;
  primaryObjective: string;
  rawScore: number;
  scorePct: number;
  weightedScore: number;
  classification: string;
  reportId: string;
  reportDate: string;
  // Gate scores (0-10 each)
  g1: number; g2: number; g3: number; g4: number; g5: number;
  // Gate averages (score/2.5)
  g1avg: number; g2avg: number; g3avg: number; g4avg: number; g5avg: number;
  // Claude-generated content
  ai: Record<string, string>;
  flags: string;
  tier3Status: string;
}

function gateFlag(avg: number, gateNum: number): string {
  if (avg < 1.5) return "OVERRIDE";
  if (avg < 2.0) return gateNum === 5 ? "TIER III BLOCK" : "BELOW 2.0";
  if (avg < 2.5) return "BELOW 2.5";
  return "ACCEPTABLE";
}

function gateStatusColor(avg: number): string {
  if (avg < 1.5) return C.red;
  if (avg < 2.0) return C.red;
  if (avg < 2.5) return C.amber;
  return C.green;
}

export async function generateDocx(input: DocxInput): Promise<string> {
  const {
    clientName, companyName, industry, revenueRange, ownerHours, primaryObjective,
    rawScore, scorePct, weightedScore, classification,
    reportId, reportDate,
    g1, g2, g3, g4, g5,
    g1avg, g2avg, g3avg, g4avg, g5avg,
    ai, flags, tier3Status,
  } = input;

  const g1flag = gateFlag(g1avg, 1);
  const g2flag = gateFlag(g2avg, 2);
  const g3flag = gateFlag(g3avg, 3);
  const g4flag = gateFlag(g4avg, 4);
  const g5flag = gateFlag(g5avg, 5);

  // ── PAGE HEADER ──────────────────────────────────────────────────────────
  const docHeader = new Header({
    children: [new Paragraph({
      children: [
        run("NORTHBRIDGE STRATEGIES", { bold: true, color: C.navy, size: 18, font: "Georgia" }),
        run("   ·   ", { color: C.grey, size: 18 }),
        run("Tier I Structural Diagnostic", { color: C.grey, size: 18 }),
        run("   ·   ", { color: C.grey, size: 18 }),
        run("CONFIDENTIAL", { color: C.orange, size: 16, bold: true }),
      ],
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.rule } },
      spacing: { before: 0, after: 120 },
    })],
  });

  // ── PAGE FOOTER ──────────────────────────────────────────────────────────
  const docFooter = new Footer({
    children: [new Paragraph({
      children: [
        run(`${reportId}  ·  `, { color: C.grey, size: 16, font: "Courier New" }),
        run("© 2026 Northbridge Strategies  ·  Confidential — Not for Distribution  ·  Page ", { color: C.grey, size: 16 }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.grey }),
      ],
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.rule } },
      spacing: { before: 120, after: 0 },
    })],
  });

  const sections: DocChild[] = [];

  // ═══════════════════════════════════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════════════════════════════════
  sections.push(
    para([monoRun("THE NORTHBRIDGE EXIT STANDARD™", { color: C.grey, size: 18 })], { spaceBefore: 480, spaceAfter: 80 }),
    para([serifRun("━━━━━━━━━", { color: C.orange, bold: true })], { spaceAfter: 240 }),
    para([serifRun("Tier I Structural Diagnostic", { bold: true, color: C.navy, size: 52 })], { spaceAfter: 120 }),
    para([serifRun(companyName, { color: C.navyMid, size: 36 })], { spaceAfter: 480 }),
    para([monoRun("PREPARED BY", { color: C.grey, size: 16 })], { spaceAfter: 60 }),
    para([serifRun("Doug Royal, Principal", { bold: true, color: C.navy, size: 28 })], { spaceAfter: 60 }),
    para([run("Northbridge Strategies", { color: C.navyMid, size: 24 })], { spaceAfter: 40 }),
    para([run("Anacortes, Washington", { color: C.grey, size: 22 })], { spaceAfter: 480 }),
    para([run("CONFIDENTIAL", { bold: true, color: C.orange, size: 20 })], { spaceAfter: 60 }),
    para([monoRun(`Document ${reportId}  ·  Version 1.0  ·  ${reportDate}`, { color: C.grey, size: 18 })], { spaceAfter: 0 }),
  );

  // ═══════════════════════════════════════════════════════════════════════
  // PRINCIPAL'S LETTER
  // ═══════════════════════════════════════════════════════════════════════
  sections.push(
    para([serifRun("PRINCIPAL'S LETTER", { bold: true, color: C.navy, size: 24 })], { pageBreak: true, spaceBefore: 0, spaceAfter: 240 }),
    thickRule(),
    bodyPara(`To: The Founder, ${companyName}`),
    bodyPara("From: Doug Royal, Principal, Northbridge Strategies"),
    bodyPara("Re: Tier I Structural Diagnostic — findings and recommendation"),
    para([run("", { size: 20 })], { spaceAfter: 120 }),
    bodyPara(`This report assesses ${companyName} against the structural conditions that determine institutional transferability — whether the business can be acquired, financed, and operated by a new owner without the founder. The assessment framework is the Northbridge Exit Standard: five enforcement gates, twenty-five criteria, four behavioral anchors per criterion.`, { spaceAfter: 160 }),
    bodyPara(`The classification this report assigns is determined by the scoring framework documented in this report, applied to what was observed during the underwriting session. It is not a negotiated outcome. It reflects the structural reality of the business as presented.`),
    bodyPara("Tier I diagnoses. Tier II installs structure. Tier III prepares narrative for market. This report concludes Tier I."),
    bodyPara("I am available for the one-hour findings review call included in this engagement. The call covers classification, gate-level findings, and the recommended path."),
    para([run("", { size: 20 })], { spaceAfter: 160 }),
    para([run("Doug Royal", { bold: true, color: C.body, size: 20 })], { spaceAfter: 40 }),
    para([run("Principal, Northbridge Strategies", { color: C.grey, size: 18 })]),
  );

  // ═══════════════════════════════════════════════════════════════════════
  // AT-A-GLANCE DIAGNOSTIC
  // ═══════════════════════════════════════════════════════════════════════
  sections.push(
    para([serifRun("AT-A-GLANCE DIAGNOSTIC", { bold: true, color: C.navy, size: 24 })], { pageBreak: true, spaceBefore: 0, spaceAfter: 240 }),
    thickRule(),
  );

  // Classification + score box
  sections.push(
    para([
      monoRun("Classification  ", { color: C.grey, size: 18 }),
      serifRun(classification.toUpperCase(), { bold: true, color: C.navy, size: 28 }),
    ], { spaceAfter: 80 }),
    para([
      monoRun("Weighted Score  ", { color: C.grey, size: 18 }),
      serifRun(`${weightedScore} of 125`, { bold: true, color: C.navy, size: 28 }),
      run(`   ·   band ${classification}   ·   ${g1avg < 1.5 || g2avg < 1.5 || g3avg < 1.5 || g4avg < 1.5 || g5avg < 1.5 ? "override-confirmed" : "no override"}`, { color: C.grey, size: 18 }),
    ], { spaceAfter: 240 }),
  );

  // Gate score table
  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["Gate", "Raw", "Weighted", "Average", "Status"]),
        new TableRow({ children: [
          cell(`G1 — Authority Architecture`, { width: 40 }),
          cell(`${g1}/20`, { align: AlignmentType.CENTER }),
          cell(`${(g1 * 1.5).toFixed(1)}/30`, { align: AlignmentType.CENTER }),
          cell(g1avg.toFixed(1), { align: AlignmentType.CENTER, color: gateStatusColor(g1avg), bold: g1avg < 2.0 }),
          cell(g1flag, { align: AlignmentType.CENTER, color: gateStatusColor(g1avg), bold: true }),
        ]}),
        new TableRow({ children: [
          cell(`G2 — Process Independence`, { width: 40 }),
          cell(`${g2}/20`, { align: AlignmentType.CENTER }),
          cell(`${(g2 * 1.0).toFixed(1)}/20`, { align: AlignmentType.CENTER }),
          cell(g2avg.toFixed(1), { align: AlignmentType.CENTER, color: gateStatusColor(g2avg), bold: g2avg < 2.0 }),
          cell(g2flag, { align: AlignmentType.CENTER, color: gateStatusColor(g2avg), bold: true }),
        ]}),
        new TableRow({ children: [
          cell(`G3 — Commercial Discipline`, { width: 40 }),
          cell(`${g3}/20`, { align: AlignmentType.CENTER }),
          cell(`${(g3 * 1.0).toFixed(1)}/20`, { align: AlignmentType.CENTER }),
          cell(g3avg.toFixed(1), { align: AlignmentType.CENTER, color: gateStatusColor(g3avg), bold: g3avg < 2.0 }),
          cell(g3flag, { align: AlignmentType.CENTER, color: gateStatusColor(g3avg), bold: true }),
        ]}),
        new TableRow({ children: [
          cell(`G4 — Revenue Quality & Durability`, { width: 40 }),
          cell(`${g4}/20`, { align: AlignmentType.CENTER }),
          cell(`${(g4 * 1.5).toFixed(1)}/30`, { align: AlignmentType.CENTER }),
          cell(g4avg.toFixed(1), { align: AlignmentType.CENTER, color: gateStatusColor(g4avg), bold: g4avg < 2.0 }),
          cell(g4flag, { align: AlignmentType.CENTER, color: gateStatusColor(g4avg), bold: true }),
        ]}),
        new TableRow({ children: [
          cell(`G5 — Financial Integrity`, { width: 40 }),
          cell(`${g5}/20`, { align: AlignmentType.CENTER }),
          cell(`${(g5 * 1.25).toFixed(1)}/25`, { align: AlignmentType.CENTER }),
          cell(g5avg.toFixed(1), { align: AlignmentType.CENTER, color: gateStatusColor(g5avg), bold: g5avg < 2.0 }),
          cell(g5flag, { align: AlignmentType.CENTER, color: gateStatusColor(g5avg), bold: true }),
        ]}),
        new TableRow({ children: [
          cell("Total", { bold: true, shading: C.paperDark }),
          cell(`${rawScore}/100`, { align: AlignmentType.CENTER, bold: true, shading: C.paperDark }),
          cell(`${weightedScore}/125`, { align: AlignmentType.CENTER, bold: true, shading: C.paperDark }),
          cell("—", { align: AlignmentType.CENTER, shading: C.paperDark }),
          cell(classification, { align: AlignmentType.CENTER, bold: true, color: C.navy, shading: C.paperDark }),
        ]}),
      ],
    }),
  );

  // Top three fragility vectors
  sections.push(
    para([run("", { size: 20 })], { spaceAfter: 120 }),
    para([monoRun("TOP THREE FRAGILITY VECTORS", { color: C.grey, size: 16 })], { spaceAfter: 80 }),
    para([run("1.  ", { bold: true, color: C.orange }), run(ai.fragility_1_title ?? "", { bold: true, color: C.body }), run("  —  ", { color: C.grey }), run(ai.fragility_1_body ?? "")], { spaceAfter: 80 }),
    para([run("2.  ", { bold: true, color: C.orange }), run(ai.fragility_2_title ?? "", { bold: true, color: C.body }), run("  —  ", { color: C.grey }), run(ai.fragility_2_body ?? "")], { spaceAfter: 80 }),
    para([run("3.  ", { bold: true, color: C.orange }), run(ai.fragility_3_title ?? "", { bold: true, color: C.body }), run("  —  ", { color: C.grey }), run(ai.fragility_3_body ?? "")], { spaceAfter: 240 }),
    para([monoRun("RECOMMENDED PATH", { color: C.grey, size: 16 })], { spaceAfter: 80 }),
    para([serifRun("Tier II — Continuity Architecture", { bold: true, color: C.navy, size: 22 })], { spaceAfter: 80 }),
    bodyPara(tier3Status.startsWith("Blocked") ? `Tier III progression is blocked: ${tier3Status}. Tier II installation precedes Tier III eligibility.` : `Tier II is the recommended path based on gate performance across this engagement.`),
  );

  // ═══════════════════════════════════════════════════════════════════════
  // YOUR RESULT IN PLAIN ENGLISH
  // ═══════════════════════════════════════════════════════════════════════
  sections.push(heading1("Your Result in Plain English", 0));
  sections.push(rule());
  sections.push(bodyPara(`The business currently works because the founder is central to it. That is not a judgment of value or competence — it is a structural observation. The diagnostic measures whether the business can be acquired, financed, and operated by someone other than the founder. That is the standard it is evaluated against.`));
  sections.push(bodyPara(`When a buyer evaluates a business for acquisition, they are not buying the founder. They are buying a system that will generate cash flow after the founder leaves. Lenders underwrite that system, not the founder's track record.`));
  sections.push(bodyPara(`For ${companyName}, this diagnostic identified structural conditions that affect transferability. The classification assigned — ${classification} — reflects those conditions applied to the Northbridge scoring framework.`));

  sections.push(heading2("What the Classification Means"));
  sections.push(bodyPara(ai.executive_summary ?? ""));

  // ═══════════════════════════════════════════════════════════════════════
  // RECOMMENDED PATH
  // ═══════════════════════════════════════════════════════════════════════
  sections.push(heading1("Recommended Path"));
  sections.push(rule());
  sections.push(para([serifRun("Tier II — Continuity Architecture", { bold: true, color: C.navy, size: 24 })], { spaceAfter: 120 }));
  sections.push(bodyPara(`The recommendation from this Tier I engagement is to advance to Tier II — Continuity Architecture. Tier II installs the structural systems that convert a founder-dependent business into a transferable institution.`));

  sections.push(heading2("Why Now"));
  sections.push(bodyPara(ai.path_why_now_body ?? ""));
  sections.push(heading2("The Cost of Inaction"));
  sections.push(bodyPara(ai.path_inaction_body ?? ""));

  // ═══════════════════════════════════════════════════════════════════════
  // FIRST FIVE MOVES
  // ═══════════════════════════════════════════════════════════════════════
  sections.push(heading1("First Five Moves"));
  sections.push(rule());
  sections.push(bodyPara("Before Tier II formally begins, five structural actions can start within thirty days. They do not replace Tier II. They establish the foundation on which Tier II builds."));
  for (let i = 1; i <= 5; i++) {
    const title = ai[`move_${i}_title`] ?? "";
    const body = ai[`move_${i}_body`] ?? "";
    const tag = ai[`move_${i}_tag`] ?? "";
    const impact = ai[`move_${i}_impact`] ?? "";
    sections.push(
      para([run(`${i}.  `, { bold: true, color: C.orange, size: 22 }), serifRun(title, { bold: true, color: C.navy, size: 22 })], { spaceBefore: 200, spaceAfter: 60 }),
      bodyPara(body),
      para([monoRun(`Structural impact: `, { color: C.green, size: 16 }), run(impact, { color: C.grey, size: 16 })], { spaceAfter: 40 }),
      para([monoRun(tag.toUpperCase(), { color: C.grey, size: 14 })], { spaceAfter: 80 }),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 1 — EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  sections.push(heading1("Section 1  ·  Executive Summary", 0));
  sections.push(thickRule());
  sections.push(bodyPara(ai.executive_summary ?? ""));
  sections.push(para([run(""), ], { spaceAfter: 80 }));
  sections.push(para([
    run(`${companyName} · `, { bold: true, color: C.navy }),
    run(`${industry} · `, { color: C.grey }),
    run(`${revenueRange} · `, { color: C.grey }),
    run(classification, { bold: true, color: C.navy }),
    run(` · Weighted ${weightedScore}/125`, { color: C.grey }),
  ], { spaceAfter: 120 }));

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 2 — TRANSFERABILITY CLASSIFICATION
  // ═══════════════════════════════════════════════════════════════════════
  sections.push(heading1("Section 2  ·  Transferability Classification"));
  sections.push(thickRule());

  sections.push(heading2("Classification"));
  sections.push(para([
    serifRun(`${classification}  ·  `, { bold: true, color: C.navy, size: 26 }),
    serifRun(`${weightedScore} of 125 weighted`, { color: C.grey, size: 20 }),
  ], { spaceAfter: 120 }));

  sections.push(heading2("Current State"));
  sections.push(bodyPara(ai.compression_body ?? ""));

  sections.push(heading2("Target State Within Twelve to Eighteen Months"));
  sections.push(bodyPara(ai.rescore_summary ?? ""));

  sections.push(heading2("Override Application"));
  const overrides = [];
  if (g1avg < 1.5) overrides.push("Gate 1 averages below 1.5 — forces Founder-Dependent classification.");
  if (g2avg < 1.5) overrides.push("Gate 2 averages below 1.5 — forces Founder-Dependent classification.");
  if (g3avg < 1.5) overrides.push("Gate 3 averages below 1.5 — forces Founder-Dependent classification.");
  if (g4avg < 1.5) overrides.push("Gate 4 averages below 1.5 — forces Founder-Dependent classification.");
  if (g5avg < 2.0) overrides.push("Gate 5 averages below 2.0 — Tier III progression is blocked.");
  if (overrides.length === 0) overrides.push("No override rules triggered. Classification reflects weighted total score.");
  for (const o of overrides) sections.push(bodyPara(`— ${o}`));

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 3 — GATE-LEVEL FINDINGS
  // ═══════════════════════════════════════════════════════════════════════
  sections.push(heading1("Section 3  ·  Gate-Level Findings"));
  sections.push(thickRule());
  sections.push(bodyPara("Findings appear in three parts: the structural reality observed, the transaction consequence that follows from that reality, and the correction vector. Every finding integrates the operator field note from the live underwriting session."));

  const gates = [
    { num: 1, name: "Authority Architecture", score: g1, avg: g1avg, weight: "1.5x", max: 30, flag: g1flag, analysis: ai.gate_1_analysis ?? "" },
    { num: 2, name: "Process Independence", score: g2, avg: g2avg, weight: "1.0x", max: 20, flag: g2flag, analysis: ai.gate_2_analysis ?? "" },
    { num: 3, name: "Commercial Discipline", score: g3, avg: g3avg, weight: "1.0x", max: 20, flag: g3flag, analysis: ai.gate_3_analysis ?? "" },
    { num: 4, name: "Revenue Quality & Durability", score: g4, avg: g4avg, weight: "1.5x", max: 30, flag: g4flag, analysis: ai.gate_4_analysis ?? "" },
    { num: 5, name: "Financial Integrity", score: g5, avg: g5avg, weight: "1.25x", max: 25, flag: g5flag, analysis: ai.gate_5_analysis ?? "" },
  ];

  for (const g of gates) {
    sections.push(heading2(`Gate ${g.num}  ·  ${g.name}`));
    sections.push(para([
      monoRun(`Weight ${g.weight}  ·  Raw ${g.score}/20  ·  Weighted ${(g.score * parseFloat(g.weight)).toFixed(1)}/${g.max}  ·  Average ${g.avg.toFixed(1)}  ·  `, { color: C.grey, size: 16 }),
      monoRun(g.flag, { color: gateStatusColor(g.avg), size: 16 }),
    ], { spaceAfter: 120 }));
    sections.push(bodyPara(g.analysis));
    sections.push(rule());
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 4 — STRUCTURAL FRAGILITY MAP
  // ═══════════════════════════════════════════════════════════════════════
  sections.push(heading1("Section 4  ·  Structural Fragility Map"));
  sections.push(thickRule());
  sections.push(bodyPara(`${ai.fragility_intro ?? ""}`));
  sections.push(para([run("", { size: 20 })], { spaceAfter: 80 }));

  for (let i = 1; i <= 3; i++) {
    const title = ai[`fragility_${i}_title`] ?? "";
    const body = ai[`fragility_${i}_body`] ?? "";
    const tag = ai[`fragility_${i}_tag`] ?? "";
    sections.push(
      para([
        monoRun(`VECTOR 0${i}  `, { color: C.orange, size: 16 }),
        serifRun(title, { bold: true, color: C.navy, size: 24 }),
      ], { spaceBefore: 200, spaceAfter: 80 }),
      bodyPara(body),
      para([monoRun(tag.toUpperCase(), { color: C.grey, size: 14 })], { spaceAfter: 200 }),
    );
  }

  // SDE compression table
  sections.push(heading2("Multiple Compression by Gate"));
  sections.push(bodyPara(ai.compression_headline ?? ""));
  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["Gate", "Average", "Compression Impact"]),
        dataRow(["G1 · Authority Architecture", g1avg.toFixed(1), g1avg < 2.0 ? "−0.25–0.5x SDE" : "Neutral"]),
        dataRow(["G3 · Commercial Discipline", g3avg.toFixed(1), g3avg < 2.0 ? "−0.25–0.5x SDE" : "Neutral"]),
        dataRow(["G5 · Financial Integrity", g5avg.toFixed(1), g5avg < 2.0 ? "−0.5–1.0x SDE" : "Neutral"]),
      ],
    }),
  );

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 5 — NINETY-DAY CORRECTION ROADMAP
  // ═══════════════════════════════════════════════════════════════════════
  sections.push(heading1("Section 5  ·  Ninety-Day Correction Roadmap"));
  sections.push(thickRule());
  sections.push(bodyPara("The roadmap addresses the structural fragility identified in the diagnostic and initiates the conditions that Tier II installs over the subsequent twelve weeks. Sequencing follows structural impact and transaction risk, not effort or cost."));

  sections.push(heading2("30-Day Actions"));
  sections.push(labeledPara(`01. ${ai.move_1_title ?? ""}`, ai.move_1_body ?? ""));
  sections.push(labeledPara(`02. ${ai.move_2_title ?? ""}`, ai.move_2_body ?? ""));

  sections.push(heading2("60-Day Actions"));
  sections.push(labeledPara(`03. ${ai.move_3_title ?? ""}`, ai.move_3_body ?? ""));
  sections.push(labeledPara(`04. ${ai.move_4_title ?? ""}`, ai.move_4_body ?? ""));

  sections.push(heading2("90-Day Actions"));
  sections.push(labeledPara(`05. ${ai.move_5_title ?? ""}`, ai.move_5_body ?? ""));

  // Rescore targets table
  sections.push(heading2("Tier II Re-Score Targets"));
  sections.push(bodyPara(ai.rescore_headline ?? ""));
  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["Gate", "Current Average", "Target"]),
        dataRow(["G1 · Authority Architecture", g1avg.toFixed(1), "≥ 2.5"]),
        dataRow(["G2 · Process Independence", g2avg.toFixed(1), "≥ 2.5"]),
        dataRow(["G3 · Commercial Discipline", g3avg.toFixed(1), "≥ 2.5"]),
        dataRow(["G4 · Revenue Quality & Durability", g4avg.toFixed(1), "≥ 2.5"]),
        dataRow(["G5 · Financial Integrity", g5avg.toFixed(1), "≥ 2.0"]),
      ],
    }),
  );

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 6 — PRINCIPAL NOTES (placeholder)
  // ═══════════════════════════════════════════════════════════════════════
  sections.push(heading1("Section 6  ·  Principal Notes"));
  sections.push(thickRule());
  sections.push(
    new Paragraph({
      children: [run("[Principal Notes — to be completed by Doug Royal before delivery]", { color: C.grey, italics: true })],
      border: {
        top: { style: BorderStyle.SINGLE, size: 4, color: C.rule },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: C.rule },
        left: { style: BorderStyle.THICK, size: 12, color: C.orange },
        right: { style: BorderStyle.NONE, size: 0, color: C.white },
      },
      spacing: { before: 160, after: 160 },
      indent: { left: convertInchesToTwip(0.25) },
    }),
  );

  // ═══════════════════════════════════════════════════════════════════════
  // APPENDIX A — SCORING SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  sections.push(heading1("Appendix A  ·  Scoring Summary"));
  sections.push(thickRule());
  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["Gate", "Score", "Weighted", "Average", "Status"]),
        dataRow(["G1 — Authority Architecture", `${g1}/20`, `${(g1 * 1.5).toFixed(1)}/30`, g1avg.toFixed(1), g1flag]),
        dataRow(["G2 — Process Independence", `${g2}/20`, `${(g2 * 1.0).toFixed(1)}/20`, g2avg.toFixed(1), g2flag]),
        dataRow(["G3 — Commercial Discipline", `${g3}/20`, `${(g3 * 1.0).toFixed(1)}/20`, g3avg.toFixed(1), g3flag]),
        dataRow(["G4 — Revenue Quality & Durability", `${g4}/20`, `${(g4 * 1.5).toFixed(1)}/30`, g4avg.toFixed(1), g4flag]),
        dataRow(["G5 — Financial Integrity", `${g5}/20`, `${(g5 * 1.25).toFixed(1)}/25`, g5avg.toFixed(1), g5flag]),
        dataRow(["TOTAL", `${rawScore}/100`, `${weightedScore}/125`, "—", classification], C.paperDark),
      ],
    }),
  );

  // ═══════════════════════════════════════════════════════════════════════
  // APPENDIX B — METHODOLOGY REFERENCE
  // ═══════════════════════════════════════════════════════════════════════
  sections.push(heading1("Appendix B  ·  Methodology Reference"));
  sections.push(thickRule());

  sections.push(heading2("Score Scale — Four Behavioral Anchors"));
  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["Score", "Label", "Description"]),
        dataRow(["1 — Red", "Critical Fragility", "Structural failure confirmed. Transaction consequence is severe — deal risk, valuation compression, or lender rejection likely."]),
        dataRow(["2 — Yellow", "Material Weakness", "Deficiency is present and material. Transaction consequence is meaningful — discount, contingency, earn-out, or pre-condition to close."]),
        dataRow(["3 — Light Green", "Institutionally Acceptable", "Structure is present and functional. Transaction consequence is neutral to mildly positive. No discount triggered."]),
        dataRow(["4 — Dark Green", "Premium Grade", "Structure is documented, tested, and independently verifiable. Supports premium multiple and compresses diligence timeline."]),
      ],
    }),
  );

  sections.push(heading2("Gate Weights"));
  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["Gate", "Weight", "Rationale"]),
        dataRow(["G1 — Authority Architecture", "1.5x", "Highest buyer risk: key-person concentration directly suppresses multiple and drives earn-out requirement."]),
        dataRow(["G2 — Process Independence", "1.0x", "Base weight: process fragility is material but more remediable than authority or revenue risk."]),
        dataRow(["G3 — Commercial Discipline", "1.0x", "Base weight: pricing and margin weakness is significant but addressable within a defined remediation program."]),
        dataRow(["G4 — Revenue Quality & Durability", "1.5x", "Highest buyer risk: revenue transferability is the single most contested valuation category in founder-led transactions."]),
        dataRow(["G5 — Financial Integrity", "1.25x", "Elevated weight: financial evidence quality determines whether any valuation number is defensible under QoE scrutiny."]),
      ],
    }),
  );

  sections.push(heading2("Classification Bands"));
  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["Classification", "Score Range", "Meaning"]),
        dataRow(["Founder-Dependent", "0–46", "Structural fragility is substantial. Tier II is strongly indicated."]),
        dataRow(["Transitional", "47–77", "Some systems exist but buyer-readiness is incomplete."]),
        dataRow(["Stabilized", "78–109", "Structural base is credible. Tier III path potentially viable."]),
        dataRow(["Transfer-Ready", "110–125", "Defensible under third-party scrutiny across all five gates."]),
      ],
    }),
  );

  // ═══════════════════════════════════════════════════════════════════════
  // GLOSSARY
  // ═══════════════════════════════════════════════════════════════════════
  sections.push(heading1("Glossary of Terms"));
  sections.push(thickRule());
  const glossary: [string, string][] = [
    ["Add-back", "An adjustment that increases reported EBITDA to reflect a non-recurring, owner-related, or non-operating expense."],
    ["Buy-Side QoE", "Quality of Earnings analysis conducted by an accounting firm engaged by the buyer to verify the seller's adjusted EBITDA presentation before closing."],
    ["DSCR", "Debt Service Coverage Ratio. Adjusted EBITDA divided by annual debt service. Lenders typically require DSCR above 1.25x for SBA-financed acquisitions."],
    ["EBITDA", "Earnings Before Interest, Taxes, Depreciation, and Amortization. The standard measure of operating cash flow."],
    ["Earnout", "Contingent purchase price paid to the seller post-close based on the business achieving specified performance milestones."],
    ["Key-Person Risk", "The risk that the business cannot operate without the continued involvement of a specific individual, typically the founder."],
    ["Normalization", "The process of adjusting reported financial results to reflect the cash flow available to a new owner."],
    ["SDE", "Seller's Discretionary Earnings. EBITDA plus the owner's compensation and discretionary benefits."],
    ["Transferability", "The structural property of a business that determines whether it can be acquired and operated successfully by a new owner."],
  ];
  for (const [term, def] of glossary) {
    sections.push(para([
      run(`${term}  `, { bold: true, color: C.navy, size: 20, font: "Georgia" }),
      run(def, { color: C.body, size: 18 }),
    ], { spaceAfter: 120 }));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BUILD DOCUMENT
  // ═══════════════════════════════════════════════════════════════════════
  const doc = new Document({
    sections: [{
      headers: { default: docHeader },
      footers: { default: docFooter },
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
          },
        },
      },
      children: sections as Paragraph[],
    }],
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20, color: C.body },
          paragraph: { spacing: { after: 120 } },
        },
      },
    },
    numbering: {
      config: [],
    },
  });

  const buffer = await Packer.toBuffer(doc);

  // Upload to Vercel Blob
  const safeName = `${clientName}-${companyName}`
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const year = new Date().getFullYear();
  const slug = crypto.randomBytes(6).toString("hex");
  const fileName = `${safeName}-Tier-I-Diagnostic-${year}.docx`;
  const blobPath = `reports/${slug}/${fileName}`;

  const blob = await put(blobPath, buffer, {
    access: "public",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    addRandomSuffix: false,
  });

  return blob.url;
}
