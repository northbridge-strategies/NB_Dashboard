import { ListChecks, Calendar, Phone } from "lucide-react";
import {
  StatusBadge,
  toneForPriority,
} from "@/components/ui/StatusBadge";
import { SectionCard, EmptySection } from "./_SectionCard";
import { formatRelative } from "@/lib/utils/dates";
import { formatCurrency } from "@/lib/utils/format";
import type { PipelineEntry } from "@/lib/notion/pipeline";

export function PipelineSection({
  entry,
  all,
  leadId: _leadId,
}: {
  entry: PipelineEntry | null;
  all: PipelineEntry[];
  leadId: string;
}) {
  if (!entry) {
    return (
      <SectionCard icon={ListChecks} title="Pipeline" tone="accent">
        <EmptySection message="No pipeline entry yet. Will appear once the lead is qualified or booked for a call." />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon={ListChecks}
      title="Pipeline"
      count={all.length > 1 ? all.length : undefined}
      notionId={entry.id}
      tone="accent"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {entry.stage && (
            <StatusBadge label={entry.stage} tone="info" />
          )}
          {entry.priority && (
            <StatusBadge
              label={entry.priority}
              tone={toneForPriority(entry.priority)}
            />
          )}
          {entry.callOutcome && (
            <span className="label-caps text-text-muted">
              {entry.callOutcome}
            </span>
          )}
          {entry.stageDate && (
            <span className="ml-auto text-xs text-text-muted">
              In stage since {formatRelative(entry.stageDate)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
          {entry.meetingDate && (
            <Field
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Meeting Date"
              value={new Date(entry.meetingDate).toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            />
          )}
          {entry.callOutcome && (
            <Field
              icon={<Phone className="h-3.5 w-3.5" />}
              label="Call Outcome"
              value={entry.callOutcome}
            />
          )}
          {entry.tierIPaymentDate && (
            <Field
              label="Tier I Payment"
              value={new Date(entry.tierIPaymentDate).toLocaleDateString()}
            />
          )}
          {entry.tierIAmount != null && (
            <Field label="Tier I Amount" value={formatCurrency(entry.tierIAmount)} />
          )}
          {entry.nextAction && (
            <Field label="Next Action" value={entry.nextAction} />
          )}
        </div>

        {entry.notes && (
          <div>
            <div className="label-caps mb-2 text-text-muted">Notes</div>
            <div className="whitespace-pre-wrap rounded-md border border-border bg-bg/40 p-3 text-xs text-text-secondary">
              {entry.notes}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border bg-bg/40 p-3">
      <div className="label-caps flex items-center gap-1.5 text-text-muted">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-text-primary">{value}</div>
    </div>
  );
}
