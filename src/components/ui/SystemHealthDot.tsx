"use client";

import useSWR from "swr";
import { cn } from "@/lib/utils/classnames";

interface Snapshot {
  unresolvedCritical: number;
  unresolvedWarning: number;
  globalPause: boolean;
}

const fetcher = async (url: string): Promise<Snapshot> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error("snapshot failed");
  return r.json() as Promise<Snapshot>;
};

export function SystemHealthDot() {
  const { data } = useSWR<Snapshot>("/api/health/snapshot", fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  });

  let tone: "green" | "amber" | "red" | "muted" = "muted";
  let label = "Idle";
  if (data) {
    if (data.unresolvedCritical > 0) {
      tone = "red";
      label = `${data.unresolvedCritical} critical`;
    } else if (data.unresolvedWarning > 0 || data.globalPause) {
      tone = "amber";
      label = data.globalPause ? "Paused" : `${data.unresolvedWarning} warnings`;
    } else {
      tone = "green";
      label = "Healthy";
    }
  }

  const dot = {
    green: "bg-brand-success",
    amber: "bg-brand-warning",
    red: "bg-brand-danger animate-pulse",
    muted: "bg-text-muted",
  }[tone];

  return (
    <div
      className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5 sm:px-3"
      title={label}
      aria-label={`System: ${label}`}
    >
      <span className={cn("h-2 w-2 rounded-full", dot)} aria-hidden />
      <span className="label-caps hidden text-text-secondary sm:inline">
        {label}
      </span>
    </div>
  );
}
