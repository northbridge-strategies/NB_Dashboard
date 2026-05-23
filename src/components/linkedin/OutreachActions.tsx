"use client";

import { useState } from "react";
import { Check, X, Pencil } from "lucide-react";
import { useAction } from "@/lib/hooks/useAction";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function OutreachActions({
  id,
  initialDM,
}: {
  id: string;
  initialDM: string;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [draft, setDraft] = useState(initialDM);
  const [rejectNotes, setRejectNotes] = useState("");
  const approve = useAction();
  const reject = useAction();

  const editedFromOriginal = draft.trim() !== initialDM.trim();

  return (
    <>
      <div className="flex flex-wrap justify-end gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void approve.run(`/api/linkedin/${id}/approve`);
          }}
          disabled={approve.state === "pending" || approve.state === "success"}
          aria-label="Approve as-is"
          title="Approve DM as-is"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-brand-success/40 bg-brand-success/10 text-brand-success hover:bg-brand-success/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditOpen(true);
          }}
          aria-label="Edit and approve"
          title="Edit and approve"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-brand-info/40 bg-brand-info/10 text-brand-info hover:bg-brand-info/20"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setRejectOpen(true);
          }}
          aria-label="Reject"
          title="Reject DM"
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
        open={editOpen}
        title="Edit and approve DM"
        description="Edit the draft below — only your edited copy will be sent."
        confirmLabel={editedFromOriginal ? "Save & Approve" : "Approve"}
        pending={approve.state === "pending"}
        onCancel={() => setEditOpen(false)}
        onConfirm={async () => {
          const r = await approve.run(`/api/linkedin/${id}/approve`, {
            body: editedFromOriginal ? { editedDM: draft } : undefined,
          });
          if (r.ok) setEditOpen(false);
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={8}
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={rejectOpen}
        title="Reject DM"
        description="The DM will move to Manual Review."
        destructive
        confirmLabel="Reject"
        pending={reject.state === "pending"}
        onCancel={() => setRejectOpen(false)}
        onConfirm={async () => {
          const r = await reject.run(`/api/linkedin/${id}/reject`, {
            body: rejectNotes ? { notes: rejectNotes } : undefined,
          });
          if (r.ok) {
            setRejectOpen(false);
            setRejectNotes("");
          }
        }}
      >
        <textarea
          value={rejectNotes}
          onChange={(e) => setRejectNotes(e.target.value)}
          rows={4}
          placeholder="Why is this draft being rejected? (optional)"
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        />
      </ConfirmDialog>
    </>
  );
}
