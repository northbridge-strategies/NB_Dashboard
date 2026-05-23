import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/classnames";

export interface StatCardProps {
  label: string;
  value: string;
  href: string;
  icon: LucideIcon;
  /** Numeric trend vs previous period. null = no comparison available. */
  trend?: number | null;
  /** Override the "vs last week" suffix. */
  trendLabel?: string;
  /** Visual accent for the value + icon bubble. */
  accent?: "default" | "success" | "warning" | "danger";
}

export function StatCard({
  label,
  value,
  href,
  icon: Icon,
  trend,
  trendLabel = "vs last week",
  accent = "default",
}: StatCardProps) {
  const accentValue: Record<NonNullable<StatCardProps["accent"]>, string> = {
    default: "text-text-primary",
    success: "text-brand-success",
    warning: "text-brand-warning",
    danger: "text-brand-danger",
  };
  const accentBubble: Record<NonNullable<StatCardProps["accent"]>, string> = {
    default: "bg-brand-primary/10 text-brand-primary",
    success: "bg-brand-success/10 text-brand-success",
    warning: "bg-brand-warning/15 text-brand-warning",
    danger: "bg-brand-danger/10 text-brand-danger",
  };

  const trendDir = trend == null || trend === 0 ? 0 : trend > 0 ? 1 : -1;
  const TrendIcon = trendDir === 1 ? ArrowUpRight : trendDir === -1 ? ArrowDownRight : Minus;
  const trendColor =
    trendDir === 1
      ? "text-brand-success"
      : trendDir === -1
      ? "text-brand-danger"
      : "text-text-muted";

  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="label-caps min-w-0 truncate text-text-secondary">
          {label}
        </span>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition group-hover:scale-105",
            accentBubble[accent],
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div
        className={cn(
          "mt-4 text-3xl font-semibold tabular-nums tracking-tight",
          accentValue[accent],
        )}
      >
        {value}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs">
        <span className={cn("inline-flex items-center gap-0.5 font-medium", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          {trend == null
            ? "—"
            : trendDir === 0
            ? "0%"
            : `${trend > 0 ? "+" : ""}${trend.toFixed(0)}%`}
        </span>
        <span className="text-text-muted">{trendLabel}</span>
      </div>
    </Link>
  );
}
