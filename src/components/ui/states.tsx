import { Loader2, AlertCircle, Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/classnames";

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-text-secondary", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-brand-danger/30 bg-brand-danger/5 p-8 text-center",
        className,
      )}
    >
      <AlertCircle className="h-6 w-6 text-brand-danger" />
      <div className="text-sm font-medium text-text-primary">{title}</div>
      {description && (
        <div className="max-w-md text-xs text-text-secondary">{description}</div>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-elevated text-text-muted">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-medium text-text-primary">{title}</div>
        {description && (
          <div className="mt-1 max-w-md text-xs text-text-secondary">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-elevated",
        className,
      )}
    />
  );
}
