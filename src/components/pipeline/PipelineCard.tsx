import { CalendarDays, Building } from "lucide-react";
import {
  StatusBadge,
  toneForClassification,
  toneForPriority,
} from "@/components/ui/StatusBadge";
import type { PipelineEntry } from "@/lib/notion/pipeline";
import { daysBetween, formatRelative } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/classnames";

export interface CardLeadInfo {
  name: string;
  company: string;
  scorePct: number | null;
  classification: string | null;
}

export function PipelineCard({
  entry,
  lead,
  onClick,
}: {
  entry: PipelineEntry;
  lead?: CardLeadInfo;
  onClick?: () => void;
}) {
  const days = entry.stageDate ? daysBetween(entry.stageDate) : null;
  const scoreColor =
    lead?.scorePct == null
      ? "text-text-muted"
      : lead.scorePct < 40
      ? "text-brand-danger"
      : lead.scorePct < 65
      ? "text-brand-warning"
      : lead.scorePct < 85
      ? "text-brand-info"
      : "text-brand-success";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-left transition hover:border-brand-primary/40 hover:bg-surface-elevated"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-text-primary">
            {lead?.name || entry.title || "(unnamed)"}
          </div>
          {lead?.company && (
            <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-secondary">
              <Building className="h-3 w-3" />
              <span className="truncate">{lead.company}</span>
            </div>
          )}
        </div>
        {lead?.scorePct != null && (
          <span className={cn("text-sm font-semibold tabular-nums", scoreColor)}>
            {Math.round(lead.scorePct)}%
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {entry.priority && (
          <StatusBadge label={entry.priority} tone={toneForPriority(entry.priority)} />
        )}
        {lead?.classification && (
          <StatusBadge label={lead.classification} tone={toneForClassification(lead.classification)} />
        )}
      </div>

      {(entry.stageDate || days != null) && (
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {entry.stageDate ? formatRelative(entry.stageDate) : "—"}
          </span>
          {days != null && (
            <span>
              {days === 0 ? "today" : `${days}d in stage`}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
