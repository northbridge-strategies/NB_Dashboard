"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMonthYear } from "@/lib/utils/format";

export interface MonthlyRevenue {
  month: string;
  count: number;
  total: number;
}

function shortMonthLabel(yyyymm: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(yyyymm);
  if (!m) return yyyymm;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1, 12));
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

export function RevenueByMonthChart({ data }: { data: MonthlyRevenue[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-text-muted">
        No revenue data yet
      </div>
    );
  }

  return (
    <div className="h-64 rounded-xl border border-border bg-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            stroke="rgb(var(--text-muted))"
            fontSize={11}
            tickLine={false}
            tickFormatter={shortMonthLabel}
            axisLine={{ stroke: "rgb(var(--border))" }}
          />
          <YAxis
            stroke="rgb(var(--text-muted))"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "rgb(var(--border))" }}
            tickFormatter={(v: number) =>
              v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
            }
          />
          <Tooltip
            cursor={{ fill: "rgb(var(--surface-elevated))" }}
            contentStyle={{
              backgroundColor: "rgb(var(--surface))",
              border: "1px solid rgb(var(--border))",
              borderRadius: 8,
              color: "rgb(var(--text-primary))",
              fontSize: 12,
            }}
            labelStyle={{ color: "rgb(var(--text-secondary))", fontWeight: 500 }}
            labelFormatter={(label: string) => formatMonthYear(label)}
            formatter={(value: number) => [
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(value),
              "Total",
            ]}
          />
          <Bar dataKey="total" fill="#1B5E38" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
