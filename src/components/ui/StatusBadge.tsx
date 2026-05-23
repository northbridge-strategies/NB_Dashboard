import { cn } from "@/lib/utils/classnames";

export type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "accent"
  | "muted";

const TONE: Record<BadgeTone, string> = {
  neutral: "bg-surface-elevated text-text-primary border-border",
  info: "bg-brand-info/15 text-brand-info border-brand-info/30",
  success: "bg-brand-success/15 text-brand-success border-brand-success/30",
  warning: "bg-brand-warning/15 text-brand-warning border-brand-warning/30",
  danger: "bg-brand-danger/15 text-brand-danger border-brand-danger/30",
  accent: "bg-brand-accent/15 text-brand-accent border-brand-accent/30",
  muted: "bg-surface-elevated text-text-muted border-border",
};

const CLASSIFICATION_TONE: Record<string, BadgeTone> = {
  "Founder-Dependent": "danger",
  Transitional: "warning",
  Stabilized: "info",
  "Transfer-Ready": "success",
};

const PRIORITY_TONE: Record<string, BadgeTone> = {
  Hot: "accent",
  Warm: "warning",
  Cold: "info",
};

const LIFECYCLE_TONE: Record<string, BadgeTone> = {
  Lead: "neutral",
  Qualified: "info",
  Engaged: "info",
  Paid: "success",
  Active: "warning",
  Complete: "muted",
  "Closed Lost": "danger",
};

const HITL_TONE: Record<string, BadgeTone> = {
  Pending: "warning",
  Approved: "success",
  "Edited-Approved": "success",
  "Rejected-Manual Review": "danger",
};

const SEVERITY_TONE: Record<string, BadgeTone> = {
  Critical: "danger",
  Warning: "warning",
  Info: "info",
};

export function toneForClassification(value: string | null | undefined): BadgeTone {
  return value ? CLASSIFICATION_TONE[value] ?? "neutral" : "muted";
}
export function toneForPriority(value: string | null | undefined): BadgeTone {
  return value ? PRIORITY_TONE[value] ?? "neutral" : "muted";
}
export function toneForLifecycle(value: string | null | undefined): BadgeTone {
  return value ? LIFECYCLE_TONE[value] ?? "neutral" : "muted";
}
export function toneForHITL(value: string | null | undefined): BadgeTone {
  return value ? HITL_TONE[value] ?? "neutral" : "muted";
}
export function toneForSeverity(value: string | null | undefined): BadgeTone {
  return value ? SEVERITY_TONE[value] ?? "neutral" : "muted";
}

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "label-caps inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-2 py-0.5 leading-none",
        TONE[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
