import { FileText, Flag, CheckCircle2, AlertTriangle } from "lucide-react";
import { ScoreBar, GateDot } from "@/components/ui/ScoreBar";
import {
  StatusBadge,
  toneForClassification,
  toneForHITL,
} from "@/components/ui/StatusBadge";
import { SectionCard, EmptySection } from "./_SectionCard";
import { formatRelative } from "@/lib/utils/dates";
import { GenerateReportButton } from "@/components/scores/GenerateReportButton";
import type { DiagnosticScore } from "@/lib/notion/scores";

export function ScoreSection({
  score,
  all,
  leadId,
}: {
  score: DiagnosticScore | null;
  all: DiagnosticScore[];
  leadId: string;
}) {
  if (!score) {
    return (
      <SectionCard icon={FileText} title="Diagnostic Score" tone="info">
        <EmptySection message="No diagnostic score on file. Will appear once Agent 1 processes a qualifier submission." />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon={FileText}
      title="Diagnostic Score"
      count={all.length > 1 ? all.length : undefined}
      notionId={score.id}
      tone="info"
    >
      <div className="space-y-5">
        {/* Score + Classification + HITL row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="label-caps mb-2 text-text-muted">Overall</div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold tabular-nums text-text-primary">
                {score.scorePct != null ? `${Math.round(score.scorePct)}%` : "—"}
              </span>
              {score.rawScore != null && (
                <span className="text-xs text-text-muted">
                  {score.rawScore}/50 raw
                </span>
              )}
            </div>
            <div className="mt-2">
              <ScoreBar pct={score.scorePct} showLabel={false} />
            </div>
          </div>
          <div className="space-y-3">
            {score.classification && (
              <div>
                <div className="label-caps mb-1.5 text-text-muted">Classification</div>
                <StatusBadge
                  label={score.classification}
                  tone={toneForClassification(score.classification)}
                />
              </div>
            )}
            {score.hitlAction && (
              <div>
                <div className="label-caps mb-1.5 text-text-muted">HITL Status</div>
                <StatusBadge
                  label={score.hitlAction}
                  tone={toneForHITL(score.hitlAction)}
                />
              </div>
            )}
          </div>
        </div>

        {/* 5-gate breakdown */}
        <div>
          <div className="label-caps mb-2 text-text-muted">Five Gates</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Gate label="Authority" value={score.authority} />
            <Gate label="Process" value={score.process} />
            <Gate label="Pricing" value={score.pricing} />
            <Gate label="Revenue" value={score.revenue} />
            <Gate label="Financial" value={score.financial} />
          </div>
        </div>

        {/* Flags */}
        {score.flags && (
          <div>
            <div className="label-caps mb-2 flex items-center gap-1.5 text-text-muted">
              <Flag className="h-3 w-3" />
              Flags
            </div>
            <div className="rounded-md border border-border bg-bg/40 p-3 text-xs text-text-secondary">
              {score.flags}
            </div>
          </div>
        )}

        {/* Manual Review Notes */}
        {score.manualReviewNotes && (
          <div>
            <div className="label-caps mb-2 flex items-center gap-1.5 text-text-muted">
              <AlertTriangle className="h-3 w-3" />
              Manual Review Notes
            </div>
            <div className="rounded-md border border-brand-warning/30 bg-brand-warning/5 p-3 text-xs text-text-secondary">
              {score.manualReviewNotes}
            </div>
          </div>
        )}

        {/* Report links */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs">
          {score.reportDraftUrl ? (
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={score.reportDraftUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-primary px-3 py-1.5 font-medium text-white transition hover:bg-brand-primary-hover"
              >
                <FileText className="h-3.5 w-3.5" />
                View Report
              </a>
              <GenerateReportButton
                leadId={leadId}
                scoreId={score.id}
              />
            </div>
          ) : score.reportDraftGenerated ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-text-secondary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Report draft generated
              </span>
              <GenerateReportButton
                leadId={leadId}
                scoreId={score.id}
              />
            </div>
          ) : (
            <GenerateReportButton
              leadId={leadId}
              scoreId={score.id}
            />
          )}
          <span className="ml-auto text-text-muted">
            {score.dateCompleted
              ? `Completed ${formatRelative(score.dateCompleted)}`
              : ""}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

function Gate({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-bg/40 px-3 py-2">
      <GateDot score={value} label={label} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-text-primary">
          {label}
        </div>
        <div className="text-xs text-text-muted tabular-nums">
          {value != null ? `${value}/10` : "—"}
        </div>
      </div>
    </div>
  );
}
