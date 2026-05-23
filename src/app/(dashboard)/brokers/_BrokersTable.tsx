"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Linkedin } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge, type BadgeTone } from "@/components/ui/StatusBadge";
import { BrokerApproveButton } from "@/components/brokers/BrokerActions";
import { formatCurrency } from "@/lib/utils/format";
import { formatRelative } from "@/lib/utils/dates";

export interface BrokerRow {
  id: string;
  listingTitle: string;
  askingPrice: number | null;
  industry: string;
  location: string;
  ownerDependencySignals: string;
  brokerName: string;
  brokerLinkedInUrl: string | null;
  dateDiscovered: string | null;
  source: string | null;
  status: string | null;
  approvedByDoug: boolean;
}

const STATUS_TONE: Record<string, BadgeTone> = {
  "Awaiting Review": "warning",
  "Approved for Outreach": "success",
  Rejected: "danger",
  "Already in Pipeline": "muted",
};

export function BrokersTable({
  rows,
  showAll,
}: {
  rows: BrokerRow[];
  showAll: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function toggleAll() {
    const q = new URLSearchParams(params?.toString());
    if (showAll) q.delete("all");
    else q.set("all", "1");
    const qs = q.toString();
    router.replace("/brokers" + (qs ? `?${qs}` : ""));
  }

  const columns: Column<BrokerRow>[] = [
    {
      key: "listing",
      header: "Listing",
      sort: (r) => r.listingTitle.toLowerCase(),
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{r.listingTitle || "—"}</div>
          <div className="truncate text-xs text-text-secondary">
            {[r.industry, r.location].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "askingPrice",
      header: "Asking",
      sort: (r) => r.askingPrice,
      align: "right",
      hideOnMobile: true,
      render: (r) => (
        <span className="whitespace-nowrap tabular-nums">{formatCurrency(r.askingPrice)}</span>
      ),
    },
    {
      key: "signals",
      header: "Owner-Dependency Signals",
      hideOnTablet: true,
      render: (r) =>
        r.ownerDependencySignals ? (
          <span className="line-clamp-2 max-w-md text-xs text-text-secondary">
            {r.ownerDependencySignals}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "broker",
      header: "Broker",
      sort: (r) => r.brokerName.toLowerCase(),
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="truncate">{r.brokerName || "—"}</span>
          {r.brokerLinkedInUrl && (
            <a
              href={r.brokerLinkedInUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-brand-info hover:underline"
              aria-label="Broker LinkedIn"
              title={r.brokerLinkedInUrl}
            >
              <Linkedin className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      ),
    },
    {
      key: "date",
      header: "Discovered",
      sort: (r) => r.dateDiscovered ?? "",
      hideOnMobile: true,
      render: (r) =>
        r.dateDiscovered ? (
          formatRelative(r.dateDiscovered)
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
          <StatusBadge label={r.source} tone="info" />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sort: (r) => r.status ?? "",
      render: (r) =>
        r.status ? (
          <StatusBadge
            label={r.status}
            tone={STATUS_TONE[r.status] ?? "neutral"}
          />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      width: "w-32",
      render: (r) =>
        r.status === "Awaiting Review" && !r.approvedByDoug ? (
          <BrokerApproveButton id={r.id} />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">
          {showAll
            ? "Showing all broker listings."
            : "Showing only listings awaiting Doug's review."}
        </p>
        <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={showAll}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-border bg-bg accent-brand-primary"
          />
          Show all statuses
        </label>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        searchable={(r) =>
          `${r.listingTitle} ${r.brokerName} ${r.industry} ${r.location}`
        }
        searchPlaceholder="Search listing, broker, industry…"
        emptyTitle={showAll ? "No broker listings" : "No listings awaiting review"}
      />
    </div>
  );
}
