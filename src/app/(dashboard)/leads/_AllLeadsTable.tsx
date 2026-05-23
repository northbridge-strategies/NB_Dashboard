"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Mail } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ScoreBar } from "@/components/ui/ScoreBar";
import {
  StatusBadge,
  toneForClassification,
  toneForLifecycle,
  toneForPriority,
} from "@/components/ui/StatusBadge";
import { formatRelative } from "@/lib/utils/dates";
import { formatPhone, initials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/classnames";

export interface AllLeadRow {
  id: string;
  name: string;
  company: string;
  email: string | null;
  phone: string | null;
  industry: string | null;
  lifecycleState: string | null;
  source: string | null;
  priority: string | null;
  classification: string | null;
  scorePct: number | null;
  lastActivityDate: string | null;
  daysSinceContact: number | null;
  createdTime: string;
}

const PRIORITY_OPTIONS = ["all", "Hot", "Warm", "Cold"] as const;
const CLASS_OPTIONS = [
  "all",
  "Founder-Dependent",
  "Transitional",
  "Stabilized",
  "Transfer-Ready",
] as const;
const LIFECYCLE_OPTIONS = [
  "all",
  "Lead",
  "Qualified",
  "Engaged",
  "Paid",
  "Active",
  "Complete",
  "Closed Lost",
] as const;

const CLASSIFICATION_RING: Record<string, string> = {
  "Founder-Dependent": "ring-brand-danger/40",
  "Transitional": "ring-brand-warning/40",
  "Stabilized": "ring-brand-info/40",
  "Transfer-Ready": "ring-brand-success/40",
};

export function AllLeadsTable({ rows }: { rows: AllLeadRow[] }) {
  const router = useRouter();
  const [priority, setPriority] = useState<(typeof PRIORITY_OPTIONS)[number]>("all");
  const [classification, setClassification] = useState<(typeof CLASS_OPTIONS)[number]>("all");
  const [lifecycle, setLifecycle] = useState<(typeof LIFECYCLE_OPTIONS)[number]>("all");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (priority !== "all" && r.priority !== priority) return false;
      if (classification !== "all" && r.classification !== classification) return false;
      if (lifecycle !== "all" && r.lifecycleState !== lifecycle) return false;
      return true;
    });
  }, [rows, priority, classification, lifecycle]);

  const columns: Column<AllLeadRow>[] = [
    {
      key: "name",
      header: "Lead",
      sort: (r) => r.name.toLowerCase(),
      render: (r) => {
        const ring = r.classification ? CLASSIFICATION_RING[r.classification] : "ring-border";
        return (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white ring-2 ring-offset-2 ring-offset-surface",
                ring,
              )}
            >
              {initials(r.name || r.email || "?")}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-text-primary">
                {r.name || "(unnamed)"}
              </div>
              <div className="truncate text-xs text-text-secondary">
                {r.company || "—"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "lifecycle",
      header: "Lifecycle",
      sort: (r) => r.lifecycleState ?? "",
      hideOnMobile: true,
      render: (r) =>
        r.lifecycleState ? (
          <StatusBadge label={r.lifecycleState} tone={toneForLifecycle(r.lifecycleState)} />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "priority",
      header: "Priority",
      sort: (r) => r.priority ?? "",
      hideOnMobile: true,
      render: (r) =>
        r.priority ? (
          <StatusBadge label={r.priority} tone={toneForPriority(r.priority)} />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "score",
      header: "Score",
      sort: (r) => r.scorePct,
      width: "w-40",
      hideOnTablet: true,
      render: (r) => <ScoreBar pct={r.scorePct} />,
    },
    {
      key: "classification",
      header: "Classification",
      sort: (r) => r.classification ?? "",
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
      key: "source",
      header: "Source",
      sort: (r) => r.source ?? "",
      hideOnMobile: true,
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
          <span className="whitespace-nowrap text-sm text-text-secondary">
            {formatRelative(r.lastActivityDate)}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      width: "w-24",
      render: (r) => (
        <div className="flex justify-end gap-1">
          {r.email && (
            <a
              href={`mailto:${r.email}`}
              onClick={(e) => e.stopPropagation()}
              aria-label="Email"
              title={r.email}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:border-brand-primary/40 hover:bg-surface-elevated hover:text-brand-primary"
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
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:border-brand-primary/40 hover:bg-surface-elevated hover:text-brand-primary"
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      rows={filtered}
      columns={columns}
      searchable={(r) => `${r.name} ${r.company} ${r.email ?? ""}`}
      searchPlaceholder="Search by name, company, or email…"
      onRowClick={(r) => router.push(`/leads/${r.id}`)}
      emptyTitle="No leads match"
      emptyDescription="Try clearing filters or a different search term."
      toolbar={
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Lifecycle"
            value={lifecycle}
            options={LIFECYCLE_OPTIONS as readonly string[]}
            onChange={(v) => setLifecycle(v as typeof lifecycle)}
          />
          <FilterSelect
            label="Priority"
            value={priority}
            options={PRIORITY_OPTIONS as readonly string[]}
            onChange={(v) => setPriority(v as typeof priority)}
          />
          <FilterSelect
            label="Classification"
            value={classification}
            options={CLASS_OPTIONS as readonly string[]}
            onChange={(v) => setClassification(v as typeof classification)}
          />
        </div>
      }
    />
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs">
      <span className="label-caps text-text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-text-primary focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "all" ? "All" : o}
          </option>
        ))}
      </select>
    </label>
  );
}
