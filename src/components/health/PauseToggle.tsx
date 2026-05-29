"use client";

import { Pause, Play, Loader2 } from "lucide-react";
import { useAction } from "@/lib/hooks/useAction";

export function PauseToggle({
  paused,
  isAdmin,
}: {
  paused: boolean;
  isAdmin: boolean;
}) {
  const action = useAction();

  if (!isAdmin) {
    return (
      <div className="rounded-md border border-border bg-surface px-4 py-3 text-xs text-text-secondary">
        Pause/Resume controls are restricted to Admin users.
      </div>
    );
  }

  const isPending = action.state === "pending";

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={() => void action.run("/api/system/pause")}
        disabled={paused || isPending}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-brand-danger/40 bg-brand-danger px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
        {isPending ? "Working…" : "GLOBAL PAUSE"}
      </button>
      <button
        type="button"
        onClick={() => void action.run("/api/system/resume")}
        disabled={!paused || isPending}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-brand-success/40 bg-brand-success px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {isPending ? "Working…" : "RESUME SYSTEM"}
      </button>
      {action.state === "success" && (
        <p className="text-xs text-brand-success">
          System state updated. Page will refresh shortly.
        </p>
      )}
      {action.error && (
        <div className="rounded-md border border-brand-danger/30 bg-brand-danger/10 px-3 py-2 text-xs text-brand-danger">
          {action.error}
        </div>
      )}
    </div>
  );
}
