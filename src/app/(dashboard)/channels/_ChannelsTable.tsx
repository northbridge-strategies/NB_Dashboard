"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils/format";

export interface ChannelRow {
  channel: string;
  totalLeads: number;
  qualified: number;
  paid: number;
  revenue: number;
  conversionRate: number; // percent
  relativeFill: number;   // 0-100, for the visual bar
}

const RANGES: { id: "7" | "30" | "90" | "all"; label: string }[] = [
  { id: "7", label: "7d" },
  { id: "30", label: "30d" },
  { id: "90", label: "90d" },
  { id: "all", label: "All" },
];

export function ChannelsTable({
  rows,
  range,
}: {
  rows: ChannelRow[];
  range: "7" | "30" | "90" | "all";
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setRange(r: typeof range) {
    const q = new URLSearchParams(params?.toString());
    q.set("range", r);
    router.replace(`/channels?${q.toString()}`);
  }

  const columns: Column<ChannelRow>[] = [
    {
      key: "channel",
      header: "Channel",
      sort: (r) => r.channel,
      render: (r) => <span className="font-medium">{r.channel}</span>,
    },
    {
      key: "volume",
      header: "Volume",
      width: "w-48",
      hideOnMobile: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 rounded-full bg-surface-elevated">
            <div
              className="h-2 rounded-full bg-brand-primary transition-all"
              style={{ width: `${Math.max(2, r.relativeFill)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "totalLeads",
      header: "Leads",
      sort: (r) => r.totalLeads,
      align: "right",
      render: (r) => formatNumber(r.totalLeads),
    },
    {
      key: "qualified",
      header: "Qualified",
      sort: (r) => r.qualified,
      align: "right",
      hideOnTablet: true,
      render: (r) => formatNumber(r.qualified),
    },
    {
      key: "paid",
      header: "Paid",
      sort: (r) => r.paid,
      align: "right",
      render: (r) => (
        <span className="font-medium text-brand-success">{formatNumber(r.paid)}</span>
      ),
    },
    {
      key: "conversion",
      header: "Conversion",
      sort: (r) => r.conversionRate,
      align: "right",
      render: (r) => formatPercent(r.conversionRate, 1),
    },
    {
      key: "revenue",
      header: "Revenue",
      sort: (r) => r.revenue,
      align: "right",
      render: (r) => (
        <span className="font-medium tabular-nums text-text-primary">
          {formatCurrency(r.revenue)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">By Traffic Source</h2>
          <p className="mt-0.5 text-xs text-text-secondary">
            Lead volume and conversion grouped by the Traffic Source field on the Leads database.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={
                "rounded px-2.5 py-1 text-xs " +
                (range === r.id
                  ? "bg-brand-primary text-white"
                  : "text-text-secondary hover:text-text-primary")
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.channel}
        emptyTitle="No leads in this date range"
      />
    </div>
  );
}
