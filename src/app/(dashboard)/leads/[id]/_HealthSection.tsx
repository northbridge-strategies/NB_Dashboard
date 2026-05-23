import { Activity } from "lucide-react";
import {
  StatusBadge,
  toneForSeverity,
} from "@/components/ui/StatusBadge";
import { SectionCard } from "./_SectionCard";
import { formatRelative } from "@/lib/utils/dates";
import type { HealthLog } from "@/lib/notion/health";

export function HealthSection({
  entries,
  leadId: _leadId,
}: {
  entries: HealthLog[];
  leadId: string;
}) {
  if (entries.length === 0) return null;

  return (
    <SectionCard
      icon={Activity}
      title="System Health"
      count={entries.length}
      tone="danger"
    >
      <ul className="space-y-2">
        {entries.map((log) => (
          <li
            key={log.id}
            className="rounded-lg border border-border bg-bg/40 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              {log.severity && (
                <StatusBadge
                  label={log.severity}
                  tone={toneForSeverity(log.severity)}
                />
              )}
              {log.agent && (
                <span className="label-caps text-text-muted">{log.agent}</span>
              )}
              {log.eventType && (
                <span className="text-xs text-text-secondary">
                  {log.eventType}
                </span>
              )}
              <span className="ml-auto text-xs text-text-muted">
                {formatRelative(log.timestamp)}
              </span>
            </div>
            {log.errorMessage && (
              <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-text-secondary">
                {log.errorMessage}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
