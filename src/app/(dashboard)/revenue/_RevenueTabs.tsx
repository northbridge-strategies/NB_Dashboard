"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { DataTable, type Column } from "@/components/ui/DataTable";
import {
  RevenueByMonthChart,
  type MonthlyRevenue,
} from "@/components/revenue/RevenueByMonthChart";
import { StatusBadge, type BadgeTone } from "@/components/ui/StatusBadge";
import { formatCurrency, formatMonthYear, formatNumber } from "@/lib/utils/format";

const API_COST_TARGET = 150; // $/month

export interface PaymentRow {
  id: string;
  leadName: string;
  service: string | null;
  amount: number | null;
  paymentDate: string | null;
  stripePaymentId: string;
  status: string | null;
}

const STATUS_TONE: Record<string, BadgeTone> = {
  Paid: "success",
  Pending: "warning",
  Refunded: "danger",
};

function paymentColumns(): Column<PaymentRow>[] {
  return [
    {
      key: "lead",
      header: "Lead",
      sort: (r) => r.leadName.toLowerCase(),
      render: (r) => <span className="font-medium">{r.leadName || "—"}</span>,
    },
    {
      key: "service",
      header: "Service",
      sort: (r) => r.service ?? "",
      hideOnMobile: true,
      render: (r) =>
        r.service ? (
          <StatusBadge label={r.service} tone="info" />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "amount",
      header: "Amount",
      sort: (r) => r.amount,
      align: "right",
      render: (r) => (
        <span className="tabular-nums font-medium">{formatCurrency(r.amount)}</span>
      ),
    },
    {
      key: "paymentDate",
      header: "Payment Date",
      sort: (r) => r.paymentDate ?? "",
      render: (r) =>
        r.paymentDate ? (
          new Date(r.paymentDate).toLocaleDateString()
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "stripeId",
      header: "Stripe Payment ID",
      hideOnTablet: true,
      render: (r) =>
        r.stripePaymentId ? (
          <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs">
            {r.stripePaymentId}
          </code>
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
          <StatusBadge label={r.status} tone={STATUS_TONE[r.status] ?? "neutral"} />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
  ];
}

function monthlyColumns(): Column<MonthlyRevenue>[] {
  return [
    {
      key: "month",
      header: "Month",
      sort: (r) => r.month,
      render: (r) => (
        <span className="whitespace-nowrap font-medium">
          {formatMonthYear(r.month)}
        </span>
      ),
    },
    {
      key: "count",
      header: "Payments",
      sort: (r) => r.count,
      align: "right",
      render: (r) => formatNumber(r.count),
    },
    {
      key: "total",
      header: "Total",
      sort: (r) => r.total,
      align: "right",
      render: (r) => (
        <span className="tabular-nums font-medium text-brand-success">
          {formatCurrency(r.total)}
        </span>
      ),
    },
  ];
}

export function RevenueTabs({
  payments,
  monthly,
  grandTotal,
  qualifiedLeads,
}: {
  payments: PaymentRow[];
  monthly: MonthlyRevenue[];
  grandTotal: number;
  qualifiedLeads: number;
}) {
  const [adSpend, setAdSpend] = useState<string>("");
  const adSpendNum = parseFloat(adSpend) || 0;
  const paidCount = payments.filter((p) => p.status === "Paid").length;
  const cpl = adSpendNum > 0 && qualifiedLeads > 0 ? adSpendNum / qualifiedLeads : null;
  const cpa = adSpendNum > 0 && paidCount > 0 ? adSpendNum / paidCount : null;

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricTile
          label="Total Revenue (Paid)"
          value={formatCurrency(grandTotal)}
          accent="success"
        />
        <MetricTile
          label="Cost Per Lead (CPL)"
          value={cpl != null ? formatCurrency(cpl) : "—"}
          sub={adSpendNum === 0 ? "Enter ad spend below" : undefined}
        />
        <MetricTile
          label="Cost Per Acquisition (CPA)"
          value={cpa != null ? formatCurrency(cpa) : "—"}
          sub={adSpendNum === 0 ? "Enter ad spend below" : undefined}
        />
        <MetricTile
          label="API Cost vs Target"
          value={`$— / $${API_COST_TARGET}`}
          sub="Tracked by Agent 8 weekly"
          accent="muted"
        />
      </div>

      {/* Ad spend input */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex-1">
          <label className="label-caps block text-text-muted">Monthly Ad Spend ($)</label>
          <p className="mt-0.5 text-xs text-text-secondary">
            Enter total ad spend this month to calculate CPL and CPA.
          </p>
        </div>
        <div className="relative w-40">
          <span className="absolute left-3 top-2.5 text-sm text-text-muted">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={adSpend}
            onChange={(e) => setAdSpend(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md border border-border bg-bg py-2 pl-7 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-xs text-text-secondary">
          {payments.length} {payments.length === 1 ? "payment" : "payments"} ·{" "}
          {monthly.length} {monthly.length === 1 ? "month" : "months"}
        </div>
      </div>

      <Tabs
        urlParam="tab"
        tabs={[
          {
            id: "all",
            label: "All Payments",
            count: payments.length,
            content: (
              <DataTable
                rows={payments}
                columns={paymentColumns()}
                searchable={(r) => `${r.leadName} ${r.stripePaymentId}`}
                searchPlaceholder="Search by lead or Stripe ID…"
                emptyTitle="No payments yet"
              />
            ),
          },
          {
            id: "month",
            label: "By Month",
            count: monthly.length,
            content: (
              <div className="space-y-4">
                <RevenueByMonthChart data={monthly} />
                <DataTable
                  rows={monthly}
                  columns={monthlyColumns()}
                  rowKey={(r) => r.month}
                  emptyTitle="No monthly data"
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

function MetricTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "success" | "muted";
}) {
  const valueClass =
    accent === "success"
      ? "text-brand-success"
      : accent === "muted"
      ? "text-text-muted"
      : "text-text-primary";
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="label-caps text-text-muted">{label}</div>
      <div className={`mt-2 text-xl font-semibold tabular-nums ${valueClass}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-text-muted">{sub}</div>}
    </div>
  );
}
