"use client";

import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/classnames";

const LIFECYCLE_STATES = [
  "Lead",
  "Qualified",
  "Engaged",
  "Paid",
  "Active",
  "Complete",
  "Closed Lost",
] as const;

type LifecycleState = (typeof LIFECYCLE_STATES)[number];

const STATE_STYLES: Record<LifecycleState, string> = {
  Lead:         "border-text-muted/40 text-text-secondary hover:border-text-muted",
  Qualified:    "border-brand-info/40 text-brand-info hover:border-brand-info",
  Engaged:      "border-brand-warning/40 text-brand-warning hover:border-brand-warning",
  Paid:         "border-brand-success/40 text-brand-success hover:border-brand-success",
  Active:       "border-brand-success/40 text-brand-success hover:border-brand-success",
  Complete:     "border-brand-primary/40 text-brand-primary hover:border-brand-primary",
  "Closed Lost":"border-brand-danger/40 text-brand-danger hover:border-brand-danger",
};

const ACTIVE_STYLES: Record<LifecycleState, string> = {
  Lead:         "bg-text-muted/10 border-text-muted text-text-primary",
  Qualified:    "bg-brand-info/10 border-brand-info text-brand-info",
  Engaged:      "bg-brand-warning/15 border-brand-warning text-brand-warning",
  Paid:         "bg-brand-success/10 border-brand-success text-brand-success",
  Active:       "bg-brand-success/10 border-brand-success text-brand-success",
  Complete:     "bg-brand-primary/10 border-brand-primary text-brand-primary",
  "Closed Lost":"bg-brand-danger/10 border-brand-danger text-brand-danger",
};

export function LifecycleEditor({
  leadId,
  initialState,
}: {
  leadId: string;
  initialState: LifecycleState | null;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<LifecycleState | null>(initialState);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(state: LifecycleState) {
    if (state === current || saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/lifecycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycleState: state }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `Failed (${res.status})`);
      }
      setCurrent(state);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="label-caps text-text-muted">Lifecycle State</span>
        {saving && <Loader2 className="h-3 w-3 animate-spin text-text-muted" />}
        {saved && !saving && <CheckCircle className="h-3 w-3 text-brand-success" />}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {LIFECYCLE_STATES.map((state) => (
          <button
            key={state}
            type="button"
            disabled={saving}
            onClick={() => void handleChange(state)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
              current === state
                ? ACTIVE_STYLES[state]
                : cn("bg-transparent", STATE_STYLES[state]),
            )}
          >
            {state}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-brand-danger">{error}</p>}
    </div>
  );
}
