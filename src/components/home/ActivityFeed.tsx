import Link from "next/link";
import {
  CircleUser,
  FileText,
  ListChecks,
  DollarSign,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import type { ActivityItem, ActivitySource } from "@/lib/types/domain";
import { formatRelative } from "@/lib/utils/dates";
import { EmptyState } from "@/components/ui/states";

/**
 * Source-specific styling. Each row gets:
 *  - a colored icon bubble matching the source DB
 *  - a left accent stripe in the same hue
 *  - a labeled chip ("LEAD", "SCORE", etc.) carrying the same color
 *
 * This is the single source of truth for activity-feed brand-colors —
 * other surfaces (charts, badges) keep their own color logic.
 */
const SOURCE_STYLE: Record<
  ActivitySource,
  {
    icon: LucideIcon;
    label: string;
    bubble: string;
    stripe: string;
    chip: string;
  }
> = {
  lead: {
    icon: CircleUser,
    label: "Lead",
    bubble: "bg-brand-primary/10 text-brand-primary",
    stripe: "bg-brand-primary",
    chip: "bg-brand-primary/10 text-brand-primary border-brand-primary/30",
  },
  score: {
    icon: FileText,
    label: "Score",
    bubble: "bg-brand-info/15 text-brand-info",
    stripe: "bg-brand-info",
    chip: "bg-brand-info/15 text-brand-info border-brand-info/30",
  },
  pipeline: {
    icon: ListChecks,
    label: "Pipeline",
    bubble: "bg-brand-accent/15 text-brand-accent",
    stripe: "bg-brand-accent",
    chip: "bg-brand-accent/15 text-brand-accent border-brand-accent/30",
  },
  revenue: {
    icon: DollarSign,
    label: "Revenue",
    bubble: "bg-brand-success/10 text-brand-success",
    stripe: "bg-brand-success",
    chip: "bg-brand-success/10 text-brand-success border-brand-success/30",
  },
  linkedin: {
    icon: Briefcase,
    label: "LinkedIn",
    bubble: "bg-brand-warning/15 text-brand-warning",
    stripe: "bg-brand-warning",
    chip: "bg-brand-warning/15 text-brand-warning border-brand-warning/30",
  },
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No recent activity"
        description="Activity will appear here as agents and Doug update the system."
      />
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {items.map((item) => {
        const style = SOURCE_STYLE[item.source];
        const Icon = style.icon;
        return (
          <li key={`${item.source}-${item.id}`}>
            <Link
              href={item.href}
              className="group relative flex items-start gap-3 p-4 pl-5 transition hover:bg-surface-elevated"
            >
              {/* Color stripe */}
              <span
                aria-hidden
                className={`absolute inset-y-0 left-0 w-1 ${style.stripe} opacity-60 transition group-hover:opacity-100`}
              />
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.bubble}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-text-primary">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-xs text-text-muted">
                    {formatRelative(item.timestamp)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`label-caps inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] ${style.chip}`}
                  >
                    {style.label}
                  </span>
                  <span className="truncate text-xs text-text-secondary">
                    {item.detail}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
