"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useAction } from "@/lib/hooks/useAction";

export function ReportDeliverButton({
  scoreId,
  delivered,
}: {
  scoreId: string;
  delivered: boolean;
}) {
  const action = useAction();

  if (delivered || action.state === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-brand-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Report Delivered
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => void action.run(`/api/scores/${scoreId}/deliver`)}
        disabled={action.state === "pending"}
        className="inline-flex items-center gap-1.5 rounded-md border border-brand-success/40 bg-brand-success/10 px-3 py-1.5 text-xs font-medium text-brand-success transition hover:bg-brand-success/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {action.state === "pending" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" />
        )}
        {action.state === "pending" ? "Marking…" : "Mark Report Delivered"}
      </button>
      {action.error && (
        <span className="text-xs text-brand-danger">{action.error}</span>
      )}
    </div>
  );
}
