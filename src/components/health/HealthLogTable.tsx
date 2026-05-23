"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, RefreshCw } from "lucide-react";
import {
  StatusBadge,
  toneForSeverity,
} from "@/components/ui/StatusBadge";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { formatRelative } from "@/lib/utils/dates";

interface HealthLog {
  id: string;
  title: string;
  agent: string | null;
  eventType: string | null;
  errorMessage: string;
  affectedLeadId: string | null;
  affectedRecordUrl: string | null;
  severity: "Critical" | "Warning" | "Info" | null;
  resolved: boolean;
  resolutionNotes: string;
  timestamp: string;
  lastEditedTime: string;
}

interface Snapshot {
  total: number;
  unresolvedCritical: number;
  unresolvedWarning: number;
  unresolvedInfo: number;
  resolvedRecent: number;
  recentLogs: HealthLog[];
  globalPause: boolean;
  lastPauseEvent: string | null;
  lastResumeEvent: string | null;
}

const fetcher = async (url: string): Promise<Snapshot> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Failed to load snapshot");
  return r.json() as Promise<Snapshot>;
};

export function HealthLogTable({ initial }: { initial: Snapshot }) {
  const { data, isValidating } = useSWR<Snapshot>(
    "/api/health/snapshot",
    fetcher,
    {
      fallbackData: initial,
      refreshInterval: 10_000,
      revalidateOnFocus: true,
    },
  );

  const snapshot = data ?? initial;

  const [severityFilter, setSeverityFilter] = useState<"all" | "Critical" | "Warning" | "Info">(
    "all",
  );
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const allAgents = useMemo(() => {
    const set = new Set<string>();
    for (const log of snapshot.recentLogs) {
      if (log.agent) set.add(log.agent);
    }
    return Array.from(set).sort();
  }, [snapshot]);

  const filtered = useMemo(() => {
    return snapshot.recentLogs.filter((l) => {
      if (severityFilter !== "all" && l.severity !== severityFilter) return false;
      if (agentFilter !== "all" && l.agent !== agentFilter) return false;
      return true;
    });
  }, [snapshot, severityFilter, agentFilter]);

  return (
    <div className="space-y-4">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryTile
          label="Critical"
          count={snapshot.unresolvedCritical}
          tone="danger"
        />
        <SummaryTile
          label="Warning"
          count={snapshot.unresolvedWarning}
          tone="warning"
        />
        <SummaryTile
          label="Info"
          count={snapshot.unresolvedInfo}
          tone="info"
        />
        <SummaryTile
          label="Resolved (24h)"
          count={snapshot.resolvedRecent}
          tone="success"
        />
      </div>

      {/* Filters + refresh status */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          label="Severity"
          value={severityFilter}
          options={["all", "Critical", "Warning", "Info"]}
          onChange={(v) => setSeverityFilter(v as typeof severityFilter)}
        />
        {allAgents.length > 0 && (
          <Select
            label="Agent"
            value={agentFilter}
            options={["all", ...allAgents]}
            onChange={setAgentFilter}
          />
        )}
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-text-muted">
          {isValidating ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              Refreshing…
            </>
          ) : (
            <>Auto-refresh every 10s</>
          )}
        </span>
      </div>

      {/* Log list */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No unresolved errors"
          description="The system is healthy. Adjust filters above to see resolved or filtered items."
        />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {filtered.map((log) => (
            <li key={log.id}>
              <button
                type="button"
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-surface-elevated"
              >
                <div className="mt-0.5 text-text-muted">
                  {expanded === log.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
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
                      <StatusBadge label={log.eventType} tone="neutral" />
                    )}
                    <span className="ml-auto text-xs text-text-muted">
                      {formatRelative(log.timestamp)}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-sm font-medium text-text-primary">
                    {log.title || log.errorMessage || "(no message)"}
                  </div>
                  {expanded === log.id && (
                    <div className="mt-3 space-y-2 rounded-md border border-border bg-bg/50 p-3 text-xs">
                      {log.errorMessage && (
                        <pre className="whitespace-pre-wrap font-mono text-text-secondary">
                          {log.errorMessage}
                        </pre>
                      )}
                      <div className="flex flex-wrap gap-3 text-text-muted">
                        <span>Timestamp: {new Date(log.timestamp).toLocaleString()}</span>
                        {log.affectedRecordUrl && (
                          <a
                            href={log.affectedRecordUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-brand-info hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Affected record
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!data && <LoadingState />}
    </div>
  );
}

function SummaryTile({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "danger" | "warning" | "info" | "success";
}) {
  const color = {
    danger: "text-brand-danger",
    warning: "text-brand-warning",
    info: "text-brand-info",
    success: "text-brand-success",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="label-caps text-text-muted">{label}</div>
      <div className={"mt-2 text-2xl font-semibold tabular-nums " + color}>
        {count}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="label-caps text-text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-bg px-2 py-1.5 text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "all" ? `All ${label.toLowerCase()}` : o}
          </option>
        ))}
      </select>
    </label>
  );
}
