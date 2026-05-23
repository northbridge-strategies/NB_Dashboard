import { Power } from "lucide-react";
import { getHealthSnapshot } from "@/lib/notion/health";
import { getProductionConfig } from "@/lib/notion/config";
import { getSession } from "@/lib/auth/session";
import { ErrorState } from "@/components/ui/states";
import { PauseToggle } from "@/components/health/PauseToggle";
import { HealthLogTable } from "@/components/health/HealthLogTable";

// /health polls /api/health/snapshot every 10s; render is fast and forced dynamic.
export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const user = await getSession();
  const isAdmin = user?.role === "Admin";

  const [snapR, configR] = await Promise.allSettled([
    getHealthSnapshot(),
    getProductionConfig(),
  ]);

  if (snapR.status === "rejected") {
    return (
      <ErrorState
        title="Health snapshot failed to load"
        description={(snapR.reason as Error)?.message}
      />
    );
  }

  const snap = snapR.value;
  const config = configR.status === "fulfilled" ? configR.value : null;
  const paused = config?.globalPause ?? false;

  return (
    <div className="space-y-8">
      {/* SYSTEM CONTROLS */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
              <Power className="h-4 w-4" />
              System Controls
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              Global Pause is read by every Make.com agent at the start of each
              run. When paused, agents terminate immediately.
            </p>
          </div>
          <div
            className={
              "rounded-lg border px-4 py-2 text-sm font-medium " +
              (paused
                ? "border-brand-danger/40 bg-brand-danger/10 text-brand-danger"
                : "border-brand-success/40 bg-brand-success/10 text-brand-success")
            }
          >
            <div className="label-caps text-text-muted">Status</div>
            <div className="mt-0.5">{paused ? "Paused" : "Running"}</div>
          </div>
        </div>

        <div className="mt-5">
          <PauseToggle paused={paused} isAdmin={isAdmin} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="label-caps text-text-muted">Last Pause Event</div>
            <div className="mt-0.5 text-text-primary">
              {config?.lastPauseEvent
                ? new Date(config.lastPauseEvent).toLocaleString()
                : "—"}
            </div>
          </div>
          <div>
            <div className="label-caps text-text-muted">Last Resume Event</div>
            <div className="mt-0.5 text-text-primary">
              {config?.lastResumeEvent
                ? new Date(config.lastResumeEvent).toLocaleString()
                : "—"}
            </div>
          </div>
        </div>
      </section>

      {/* HEALTH SUMMARY + LOG */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-text-primary">
            Error Log
          </h2>
          <span className="text-xs text-text-secondary">
            {snap.total} unresolved
          </span>
        </div>
        <HealthLogTable
          initial={{
            ...snap,
            globalPause: paused,
            lastPauseEvent: config?.lastPauseEvent ?? null,
            lastResumeEvent: config?.lastResumeEvent ?? null,
          }}
        />
      </section>
    </div>
  );
}
