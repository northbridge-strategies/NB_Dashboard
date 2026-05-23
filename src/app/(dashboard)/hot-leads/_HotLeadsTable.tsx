"use client";

import { useRouter } from "next/navigation";
import { Phone, Mail, ExternalLink } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ScoreBar } from "@/components/ui/ScoreBar";
import {
  StatusBadge,
  toneForClassification,
} from "@/components/ui/StatusBadge";
import { formatRelative } from "@/lib/utils/dates";
import { formatPhone, initials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/classnames";

export interface HotLeadRow {
  id: string;
  name: string;
  company: string;
  scorePct: number | null;
  classification: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  lastActivityDate: string | null;
  daysSinceContact: number | null;
}

const CLASSIFICATION_RING: Record<string, string> = {
  "Founder-Dependent": "ring-brand-danger/40",
  "Transitional": "ring-brand-warning/40",
  "Stabilized": "ring-brand-info/40",
  "Transfer-Ready": "ring-brand-success/40",
};

function LeadAvatar({
  name,
  company,
  classification,
  size = 36,
}: {
  name: string;
  company: string;
  classification: string | null;
  size?: number;
}) {
  const ring = classification ? CLASSIFICATION_RING[classification] : "ring-border";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white ring-2 ring-offset-2 ring-offset-surface",
        ring,
      )}
      style={{ width: size, height: size }}
      title={`${name}${company ? ` · ${company}` : ""}`}
    >
      {initials(name || company)}
    </div>
  );
}

export function HotLeadsTable({ rows }: { rows: HotLeadRow[] }) {
  const router = useRouter();

  const columns: Column<HotLeadRow>[] = [
    {
      key: "name",
      header: "Lead",
      sort: (r) => r.name.toLowerCase(),
      render: (r) => (
        <div className="flex items-center gap-3">
          <LeadAvatar
            name={r.name}
            company={r.company}
            classification={r.classification}
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-text-primary">
              {r.name || "(unnamed)"}
            </div>
            <div className="truncate text-xs text-text-secondary">
              {r.company || "—"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "score",
      header: "Score",
      sort: (r) => r.scorePct,
      width: "w-44",
      hideOnMobile: true,
      render: (r) => <ScoreBar pct={r.scorePct} />,
    },
    {
      key: "classification",
      header: "Classification",
      sort: (r) => r.classification ?? "",
      width: "w-44",
      hideOnTablet: true,
      render: (r) =>
        r.classification ? (
          <StatusBadge
            label={r.classification}
            tone={toneForClassification(r.classification)}
          />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "phone",
      header: "Phone",
      width: "w-40",
      hideOnMobile: true,
      render: (r) =>
        r.phone ? (
          <a
            href={`tel:${r.phone}`}
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-brand-info hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="tabular-nums">{formatPhone(r.phone)}</span>
          </a>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "source",
      header: "Source",
      sort: (r) => r.source ?? "",
      hideOnTablet: true,
      render: (r) =>
        r.source ? (
          <span className="text-sm text-text-secondary">{r.source}</span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "lastActivity",
      header: "Last Activity",
      sort: (r) => r.lastActivityDate ?? "",
      width: "w-32",
      hideOnMobile: true,
      render: (r) =>
        r.lastActivityDate ? (
          <span className="whitespace-nowrap text-sm text-text-secondary" title={r.lastActivityDate}>
            {formatRelative(r.lastActivityDate)}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "days",
      header: "Days",
      sort: (r) => r.daysSinceContact,
      align: "right",
      width: "w-20",
      render: (r) =>
        r.daysSinceContact == null ? (
          <span className="text-text-muted">—</span>
        ) : (
          <span
            className={cn(
              "tabular-nums",
              r.daysSinceContact > 14
                ? "font-semibold text-brand-danger"
                : r.daysSinceContact > 7
                ? "font-medium text-brand-warning"
                : "text-text-primary",
            )}
          >
            {r.daysSinceContact}d
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      width: "w-32",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.email && (
            <a
              href={`mailto:${r.email}`}
              onClick={(e) => e.stopPropagation()}
              aria-label="Email"
              title={r.email}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary transition hover:border-brand-primary/40 hover:bg-surface-elevated hover:text-brand-primary"
            >
              <Mail className="h-3.5 w-3.5" />
            </a>
          )}
          {r.phone && (
            <a
              href={`tel:${r.phone}`}
              onClick={(e) => e.stopPropagation()}
              aria-label="Call"
              title={formatPhone(r.phone)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary transition hover:border-brand-primary/40 hover:bg-surface-elevated hover:text-brand-primary"
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/leads/${r.id}`);
            }}
            aria-label="View lead detail"
            title="View lead detail"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary transition hover:border-brand-primary/40 hover:bg-surface-elevated hover:text-brand-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      searchable={(r) => `${r.name} ${r.company} ${r.email ?? ""}`}
      searchPlaceholder="Search by name, company, or email…"
      onRowClick={(r) => router.push(`/leads/${r.id}`)}
      emptyTitle="No hot leads"
      emptyDescription="Hot leads from the Pipeline DB will appear here as soon as Doug flags one."
    />
  );
}
