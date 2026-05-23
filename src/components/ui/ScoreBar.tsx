import { cn } from "@/lib/utils/classnames";

export function ScoreBar({
  pct,
  className,
  showLabel = true,
}: {
  /** 0-100 */
  pct: number | null;
  className?: string;
  showLabel?: boolean;
}) {
  const clamped = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  // Color buckets aligned with Northbridge classifications
  const color =
    pct == null
      ? "bg-text-muted"
      : clamped < 40
      ? "bg-brand-danger"
      : clamped < 65
      ? "bg-brand-warning"
      : clamped < 85
      ? "bg-brand-info"
      : "bg-brand-success";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 flex-1 rounded-full bg-surface-elevated">
        <div
          className={cn("h-2 rounded-full transition-all", color)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-text-secondary">
          {pct == null ? "—" : `${Math.round(clamped)}%`}
        </span>
      )}
    </div>
  );
}

/** Tiny dot indicator for individual gate scores (0-10). */
export function GateDot({
  score,
  label,
}: {
  score: number | null;
  label: string;
}) {
  const tone =
    score == null
      ? "bg-text-muted"
      : score >= 7
      ? "bg-brand-success"
      : score >= 4
      ? "bg-brand-warning"
      : "bg-brand-danger";
  return (
    <span
      title={`${label}: ${score ?? "—"}/10`}
      className={cn("inline-block h-2.5 w-2.5 rounded-full", tone)}
    />
  );
}
