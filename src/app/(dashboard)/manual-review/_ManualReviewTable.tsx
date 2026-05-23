"use client";

import { useState } from "react";
import { FileText, Save, Loader2 } from "lucide-react";
import { ScoreBar } from "@/components/ui/ScoreBar";
import {
  StatusBadge,
  toneForClassification,
} from "@/components/ui/StatusBadge";
import { useAction } from "@/lib/hooks/useAction";
import { formatRelative } from "@/lib/utils/dates";
import { EmptyState } from "@/components/ui/states";

export interface ManualReviewRow {
  id: string;
  leadName: string;
  company: string;
  scorePct: number | null;
  classification: string | null;
  reportDraftUrl: string | null;
  lastEditedTime: string;
  manualReviewNotes: string;
}

export function ManualReviewTable({ rows }: { rows: ManualReviewRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No items in manual review"
        description="Rejected report drafts will appear here for hand-review."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <ManualReviewRowCard key={r.id} row={r} />
      ))}
    </ul>
  );
}

function ManualReviewRowCard({ row }: { row: ManualReviewRow }) {
  const [notes, setNotes] = useState(row.manualReviewNotes);
  const action = useAction();
  const dirty = notes !== row.manualReviewNotes;

  async function save() {
    if (!dirty) return;
    await action.run(`/api/manual-review/${row.id}/notes`, {
      method: "PATCH",
      body: { notes },
    });
  }

  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-text-primary">
            {row.leadName}
          </div>
          {row.company && (
            <div className="text-xs text-text-secondary">{row.company}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {row.classification && (
            <StatusBadge
              label={row.classification}
              tone={toneForClassification(row.classification)}
            />
          )}
          {row.reportDraftUrl && (
            <a
              href={row.reportDraftUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            >
              <FileText className="h-3.5 w-3.5" />
              Draft
            </a>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <ScoreBar pct={row.scorePct} className="max-w-xs" />
        <span className="text-xs text-text-muted">
          Rejected {formatRelative(row.lastEditedTime)}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <label className="label-caps text-text-muted">Manual Review Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add your reasoning for hand-review…"
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        />
        <div className="flex items-center justify-between text-xs">
          {action.error ? (
            <span className="text-brand-danger">{action.error}</span>
          ) : action.state === "success" && !dirty ? (
            <span className="text-brand-success">Saved.</span>
          ) : (
            <span className="text-text-muted">
              {dirty ? "Unsaved changes" : "Up to date"}
            </span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || action.state === "pending"}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {action.state === "pending" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Notes
          </button>
        </div>
      </div>
    </li>
  );
}
