"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { useAction } from "@/lib/hooks/useAction";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function ScoreActions({ id }: { id: string }) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const approve = useAction();
  const reject = useAction();

  return (
    <>
      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setApproveOpen(true);
          }}
          disabled={approve.state === "pending" || approve.state === "success"}
          aria-label="Approve"
          title="Approve report"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-brand-success/40 bg-brand-success/10 text-brand-success hover:bg-brand-success/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {approve.state === "pending" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setRejectOpen(true);
          }}
          aria-label="Reject"
          title="Reject and send to Manual Review"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-brand-danger/40 bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/20"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {(approve.error || reject.error) && (
        <div className="mt-1 text-xs text-brand-danger">
          {approve.error || reject.error}
        </div>
      )}

      <ConfirmDialog
        open={approveOpen}
        title="Approve report draft"
        description="This will mark the report as approved and send it to the next stage. This action cannot be undone from the dashboard."
        confirmLabel="Approve"
        pending={approve.state === "pending"}
        onCancel={() => setApproveOpen(false)}
        onConfirm={async () => {
          const r = await approve.run(`/api/scores/${id}/approve`);
          if (r.ok) setApproveOpen(false);
        }}
      />

      <ConfirmDialog
        open={rejectOpen}
        title="Reject report draft"
        description="The score will move to Manual Review. Add a note explaining why (optional)."
        destructive
        confirmLabel="Reject"
        pending={reject.state === "pending"}
        onCancel={() => setRejectOpen(false)}
        onConfirm={async () => {
          const r = await reject.run(`/api/scores/${id}/reject`, {
            body: notes ? { notes } : undefined,
          });
          if (r.ok) {
            setRejectOpen(false);
            setNotes("");
          }
        }}
      >
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Why is this draft being rejected?"
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        />
      </ConfirmDialog>
    </>
  );
}
