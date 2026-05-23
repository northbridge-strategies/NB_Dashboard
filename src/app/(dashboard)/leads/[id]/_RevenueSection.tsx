import { DollarSign } from "lucide-react";
import {
  StatusBadge,
  type BadgeTone,
} from "@/components/ui/StatusBadge";
import { SectionCard, EmptySection } from "./_SectionCard";
import { formatCurrency } from "@/lib/utils/format";
import type { RevenueEntry } from "@/lib/notion/revenue";

const STATUS_TONE: Record<string, BadgeTone> = {
  Paid: "success",
  Pending: "warning",
  Refunded: "danger",
};

export function RevenueSection({
  entries,
  leadId: _leadId,
}: {
  entries: RevenueEntry[];
  leadId: string;
}) {
  if (entries.length === 0) {
    return (
      <SectionCard icon={DollarSign} title="Revenue" tone="success">
        <EmptySection message="No payments recorded for this lead." />
      </SectionCard>
    );
  }

  const total = entries
    .filter((e) => e.status === "Paid")
    .reduce((acc, e) => acc + (e.amount ?? 0), 0);

  return (
    <SectionCard
      icon={DollarSign}
      title="Revenue"
      count={entries.length}
      tone="success"
    >
      <div className="mb-4 flex items-baseline justify-between border-b border-border pb-3">
        <span className="label-caps text-text-muted">Total paid</span>
        <span className="text-2xl font-semibold tabular-nums text-brand-success">
          {formatCurrency(total)}
        </span>
      </div>

      <ul className="space-y-2">
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-bg/40 p-3"
          >
            <div className="flex items-center gap-3">
              {e.service && <StatusBadge label={e.service} tone="info" />}
              {e.status && (
                <StatusBadge
                  label={e.status}
                  tone={STATUS_TONE[e.status] ?? "neutral"}
                />
              )}
              {e.paymentDate && (
                <span className="text-xs text-text-muted">
                  {new Date(e.paymentDate).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {e.stripePaymentId && (
                <code className="hidden rounded bg-surface-elevated px-1.5 py-0.5 text-xs text-text-muted sm:inline">
                  {e.stripePaymentId}
                </code>
              )}
              <span className="font-semibold tabular-nums text-text-primary">
                {formatCurrency(e.amount)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
