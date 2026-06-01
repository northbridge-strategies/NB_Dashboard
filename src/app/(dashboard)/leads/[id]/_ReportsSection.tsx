import { FileText, ExternalLink } from "lucide-react";
import { SectionCard, EmptySection } from "./_SectionCard";
import type { DiagnosticScore } from "@/lib/notion/scores";

interface ReportEntry {
  scoreId: string;
  reportUrl: string;
  reportId: string | null;
  dateCompleted: string | null;
}

function parseReportId(url: string): string | null {
  // Blob path format: reports/{slug}/{ClientName}-{CompanyName}-Tier-I-Diagnostic-{year}.html
  // Extract the descriptive filename and use it as the display label.
  const match = url.match(/reports\/[^/]+\/(.+?)\.html/);
  if (!match) return null;
  // e.g. "John-Smith-Acme-Corp-Tier-I-Diagnostic-2026" → readable label
  return match[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ReportsSection({
  scores,
  leadId: _leadId,
}: {
  scores: DiagnosticScore[];
  leadId: string;
}) {
  const reports: ReportEntry[] = scores
    .filter((s) => s.reportDraftUrl)
    .map((s) => ({
      scoreId: s.id,
      reportUrl: s.reportDraftUrl!,
      reportId: parseReportId(s.reportDraftUrl!),
      dateCompleted: s.dateCompleted,
    }));

  if (reports.length === 0) return null;

  return (
    <SectionCard
      icon={FileText}
      title="Generated Reports"
      count={reports.length}
      tone="accent"
    >
      <div className="flex flex-col divide-y divide-border">
        {reports.map((r, i) => (
          <div
            key={r.scoreId}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text-primary">
                {r.reportId
                  ? r.reportId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                  : `Report ${i + 1}`}
              </div>
              <div className="mt-0.5 font-mono text-xs text-text-muted">
                Generated {formatDate(r.dateCompleted)}
              </div>
            </div>
            <a
              href={r.reportUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-brand-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-primary-hover"
            >
              <FileText className="h-3.5 w-3.5" />
              Open
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
