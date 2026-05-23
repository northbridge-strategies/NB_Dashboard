"use client";

import { useRouter } from "next/navigation";
import { FileText, CheckCircle, XCircle } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ScoreBar, GateDot } from "@/components/ui/ScoreBar";
import {
  StatusBadge,
  toneForClassification,
  toneForHITL,
} from "@/components/ui/StatusBadge";
import { ScoreActions } from "@/components/scores/ScoreActions";
import { formatRelative } from "@/lib/utils/dates";

export interface ScoreRow {
  id: string;
  leadId: string | null;
  leadName: string;
  company: string;
  rawScore: number | null;
  scorePct: number | null;
  classification: string | null;
  authority: number | null;
  process: number | null;
  pricing: number | null;
  revenue: number | null;
  financial: number | null;
  flags: string;
  manualReviewNotes: string;
  reportDraftGenerated: boolean;
  reportDraftUrl: string | null;
  hitlAction: string | null;
  dateCompleted: string | null;
}

export function ScoresTable({ rows }: { rows: ScoreRow[] }) {
  const router = useRouter();
  const columns: Column<ScoreRow>[] = [
    {
      key: "lead",
      header: "Lead",
      sort: (r) => r.leadName.toLowerCase(),
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{r.leadName}</div>
          {r.company && (
            <div className="truncate text-xs text-text-secondary">{r.company}</div>
          )}
        </div>
      ),
    },
    {
      key: "raw",
      header: "Raw",
      sort: (r) => r.rawScore,
      align: "right",
      width: "w-16",
      hideOnMobile: true,
      render: (r) => (
        <span className="tabular-nums text-text-secondary">
          {r.rawScore != null ? `${r.rawScore}/50` : "—"}
        </span>
      ),
    },
    {
      key: "score",
      header: "Score %",
      sort: (r) => r.scorePct,
      width: "w-44",
      render: (r) => <ScoreBar pct={r.scorePct} />,
    },
    {
      key: "classification",
      header: "Classification",
      sort: (r) => r.classification ?? "",
      render: (r) =>
        r.classification ? (
          <StatusBadge label={r.classification} tone={toneForClassification(r.classification)} />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "gates",
      header: "Gates",
      width: "w-28",
      hideOnTablet: true,
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <GateDot score={r.authority} label="Authority" />
          <GateDot score={r.process} label="Process" />
          <GateDot score={r.pricing} label="Pricing" />
          <GateDot score={r.revenue} label="Revenue" />
          <GateDot score={r.financial} label="Financial" />
        </div>
      ),
    },
    {
      key: "draft",
      header: "Draft",
      width: "w-24",
      hideOnMobile: true,
      render: (r) =>
        r.reportDraftUrl ? (
          <a
            href={r.reportDraftUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-sm text-brand-info hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            View
          </a>
        ) : r.reportDraftGenerated ? (
          <span className="text-text-secondary">Generated</span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "hitl",
      header: "HITL",
      sort: (r) => r.hitlAction ?? "",
      render: (r) =>
        r.hitlAction ? (
          <StatusBadge label={r.hitlAction} tone={toneForHITL(r.hitlAction)} />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "date",
      header: "Completed",
      sort: (r) => r.dateCompleted ?? "",
      hideOnMobile: true,
      render: (r) =>
        r.dateCompleted ? (
          formatRelative(r.dateCompleted)
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      width: "w-24",
      render: (r) => {
        const canAct = r.reportDraftGenerated && r.hitlAction === "Pending";
        if (!canAct) {
          return (
            <span className="flex justify-end text-text-muted">
              {r.hitlAction === "Approved" || r.hitlAction === "Edited-Approved" ? (
                <CheckCircle className="h-4 w-4 text-brand-success" />
              ) : r.hitlAction === "Rejected-Manual Review" ? (
                <XCircle className="h-4 w-4 text-brand-danger" />
              ) : null}
            </span>
          );
        }
        return <ScoreActions id={r.id} />;
      },
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      searchable={(r) => `${r.leadName} ${r.company}`}
      searchPlaceholder="Search by lead or company…"
      onRowClick={(r) => {
        if (r.leadId) router.push(`/leads/${r.leadId}`);
      }}
      emptyTitle="No scores yet"
      emptyDescription="Diagnostic Scores will appear as Agent 1 processes qualifier submissions."
    />
  );
}
