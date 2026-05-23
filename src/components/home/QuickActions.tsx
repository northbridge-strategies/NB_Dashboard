"use client";

import Link from "next/link";
import { Pause, Play, Activity } from "lucide-react";
import { useState, useTransition } from "react";
import type { Role } from "@/lib/types/auth";

export function QuickActions({
  role,
  initialPaused,
  initialLastPause,
  initialLastResume,
}: {
  role: Role;
  initialPaused: boolean;
  initialLastPause: string | null;
  initialLastResume: string | null;
}) {
  const isAdmin = role === "Admin";
  const [paused, setPaused] = useState(initialPaused);
  const [lastPause, setLastPause] = useState(initialLastPause);
  const [lastResume, setLastResume] = useState(initialLastResume);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function pauseSystem() {
    setError(null);
    const res = await fetch("/api/system/pause", { method: "POST" });
    if (!res.ok) {
      setError("Failed to pause. Try again.");
      return;
    }
    setPaused(true);
    setLastPause(new Date().toISOString());
    startTransition(() => {});
  }

  async function resumeSystem() {
    setError(null);
    const res = await fetch("/api/system/resume", { method: "POST" });
    if (!res.ok) {
      setError("Failed to resume. Try again.");
      return;
    }
    setPaused(false);
    setLastResume(new Date().toISOString());
    startTransition(() => {});
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="label-caps text-text-muted">System</div>
          <div className="text-sm font-medium text-text-primary">
            {paused ? "Paused" : "Running"}
          </div>
        </div>
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            paused ? "bg-brand-danger" : "bg-brand-success"
          }`}
          aria-hidden
        />
      </div>

      {isAdmin ? (
        <div className="flex gap-2">
          {paused ? (
            <button
              type="button"
              onClick={resumeSystem}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-brand-success px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              Resume System
            </button>
          ) : (
            <button
              type="button"
              onClick={pauseSystem}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-brand-danger px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              <Pause className="h-4 w-4" />
              Global Pause
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs text-text-secondary">
          Pause/Resume controls are restricted to Admin users.
        </div>
      )}

      <Link
        href="/health"
        className="flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-text-secondary transition hover:bg-surface-elevated hover:text-text-primary"
      >
        <Activity className="h-4 w-4" />
        View System Health
      </Link>

      {error && (
        <div className="rounded-md border border-brand-danger/30 bg-brand-danger/10 px-3 py-2 text-xs text-brand-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
        <div>
          <div className="label-caps text-text-muted">Last Pause</div>
          <div className="text-text-secondary">
            {lastPause ? new Date(lastPause).toLocaleString() : "—"}
          </div>
        </div>
        <div>
          <div className="label-caps text-text-muted">Last Resume</div>
          <div className="text-text-secondary">
            {lastResume ? new Date(lastResume).toLocaleString() : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
