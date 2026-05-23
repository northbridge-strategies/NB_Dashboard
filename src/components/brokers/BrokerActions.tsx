"use client";

import { Check } from "lucide-react";
import { useAction } from "@/lib/hooks/useAction";

export function BrokerApproveButton({ id }: { id: string }) {
  const approve = useAction();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void approve.run(`/api/brokers/${id}/approve`);
      }}
      disabled={approve.state === "pending" || approve.state === "success"}
      className="inline-flex items-center gap-1.5 rounded-md border border-brand-success/40 bg-brand-success/10 px-2.5 py-1 text-xs font-medium text-brand-success hover:bg-brand-success/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Check className="h-3.5 w-3.5" />
      {approve.state === "success" ? "Approved" : "Approve"}
    </button>
  );
}
