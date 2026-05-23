"use client";

import { Pause, Play } from "lucide-react";
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

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={() => void action.run("/api/system/pause")}
        disabled={paused || action.state === "pending"}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-brand-danger/40 bg-brand-danger px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Pause className="h-4 w-4" />
        GLOBAL PAUSE
      </button>
      <button
        type="button"
        onClick={() => void action.run("/api/system/resume")}
        disabled={!paused || action.state === "pending"}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-brand-success/40 bg-brand-success px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Play className="h-4 w-4" />
        RESUME SYSTEM
      </button>
      {action.error && (
        <div className="rounded-md border border-brand-danger/30 bg-brand-danger/10 px-3 py-2 text-xs text-brand-danger">
          {action.error}
        </div>
      )}
    </div>
  );
}
