"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
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

const HITL_OPTIONS = ["All", "Pending", "Approved", "Edited-Approved", "Rejected-Manual Review"] as const;
type HitlFilter = (typeof HITL_OPTIONS)[number];

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
  const [hitlFilter, setHitlFilter] = useState<HitlFilter>("All");

  const filteredRows = useMemo(() => {
    if (hitlFilter === "All") return rows;
    return rows.filter((r) => r.hitlAction === hitlFilter);
  }, [rows, hitlFilter]);

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
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="label-caps text-text-muted">HITL Status</span>
          <select
            value={hitlFilter}
            onChange={(e) => setHitlFilter(e.target.value as HitlFilter)}
            className="rounded-md border border-border bg-bg px-2 py-1.5 text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          >
            {HITL_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
        {hitlFilter !== "All" && (
          <button
            type="button"
            onClick={() => setHitlFilter("All")}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            Clear filter
          </button>
        )}
      </div>
      <DataTable
        rows={filteredRows}
        columns={columns}
        searchable={(r) => `${r.leadName} ${r.company}`}
        searchPlaceholder="Search by lead or company…"
        onRowClick={(r) => {
          if (r.leadId) router.push(`/leads/${r.leadId}`);
        }}
        emptyTitle="No scores match"
        emptyDescription={hitlFilter !== "All" ? `No scores with HITL status "${hitlFilter}".` : "Diagnostic Scores will appear as Agent 1 processes qualifier submissions."}
      />
    </div>
  );
}
