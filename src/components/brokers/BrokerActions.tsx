"use client";

import { Check, Loader2 } from "lucide-react";
import { useAction } from "@/lib/hooks/useAction";

export function BrokerApproveButton({ id }: { id: string }) {
  const approve = useAction();
  return (
    <div className="flex flex-col items-start gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => void approve.run(`/api/brokers/${id}/approve`)}
        disabled={approve.state === "pending" || approve.state === "success"}
        className="inline-flex items-center gap-1.5 rounded-md border border-brand-success/40 bg-brand-success/10 px-2.5 py-1 text-xs font-medium text-brand-success hover:bg-brand-success/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {approve.state === "pending" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        {approve.state === "pending" ? "Approving…" : approve.state === "success" ? "Approved" : "Approve"}
      </button>
      {approve.error && (
        <span className="text-xs text-brand-danger">{approve.error}</span>
      )}
    </div>
  );
}
