import type { LucideIcon } from "lucide-react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/classnames";

export function SectionCard({
  icon: Icon,
  title,
  count,
  notionId,
  tone = "default",
  children,
}: {
  icon: LucideIcon;
  title: string;
  count?: number;
  notionId?: string | null;
  tone?: "default" | "success" | "warning" | "info" | "danger" | "accent";
  children: React.ReactNode;
}) {
  const accentBubble: Record<NonNullable<typeof tone>, string> = {
    default: "bg-brand-primary/10 text-brand-primary",
    success: "bg-brand-success/10 text-brand-success",
    warning: "bg-brand-warning/15 text-brand-warning",
    info: "bg-brand-info/15 text-brand-info",
    danger: "bg-brand-danger/10 text-brand-danger",
    accent: "bg-brand-accent/15 text-brand-accent",
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <header className="mb-4 flex items-center gap-3">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            accentBubble[tone],
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        {typeof count === "number" && count > 0 && (
          <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs font-medium text-text-secondary">
            {count}
          </span>
        )}
        {notionId && (
          <a
            href={`https://www.notion.so/${notionId.replace(/-/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-xs text-text-muted transition hover:text-brand-primary"
            title="Open in Notion"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="hidden sm:inline">Notion</span>
          </a>
        )}
      </header>
      {children}
    </section>
  );
}

export function EmptySection({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-bg/40 px-6 py-8 text-center text-xs text-text-muted">
      {message}
    </div>
  );
}
