"use client";

import { Tabs } from "@/components/ui/Tabs";
import { DataTable, type Column } from "@/components/ui/DataTable";
import {
  RevenueByMonthChart,
  type MonthlyRevenue,
} from "@/components/revenue/RevenueByMonthChart";
import { StatusBadge, type BadgeTone } from "@/components/ui/StatusBadge";
import { formatCurrency, formatMonthYear, formatNumber } from "@/lib/utils/format";

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
}: {
  payments: PaymentRow[];
  monthly: MonthlyRevenue[];
  grandTotal: number;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="label-caps text-text-muted">Total revenue (Paid)</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums text-brand-success">
            {formatCurrency(grandTotal)}
          </div>
        </div>
        <div className="text-xs text-text-secondary">
          {payments.length} {payments.length === 1 ? "payment" : "payments"} ·{" "}
          {monthly.length} {monthly.length === 1 ? "month" : "months"}
        </div>
      </div>

      <Tabs
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
