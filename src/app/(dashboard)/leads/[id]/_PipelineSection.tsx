"use client";

import { useState } from "react";
import { ListChecks, Loader2, CheckCircle } from "lucide-react";
import { StatusBadge, toneForPriority } from "@/components/ui/StatusBadge";
import { SectionCard, EmptySection } from "./_SectionCard";
import { formatRelative } from "@/lib/utils/dates";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/classnames";
import { ALL_PIPELINE_STAGES, type PipelineStage, type Priority } from "@/lib/types/domain";
import type { PipelineEntry } from "@/lib/notion/pipeline";
import { useRouter } from "next/navigation";

const CALL_OUTCOMES = [
  "Interested-Moving to Purchase",
  "Needs More Time",
  "Not a Fit",
  "No Show",
] as const;

type SaveState = "idle" | "saving" | "saved" | "error";

export function PipelineSection({
  entry: initialEntry,
  all,
  leadId,
}: {
  entry: PipelineEntry | null;
  all: PipelineEntry[];
  leadId: string;
}) {
  const router = useRouter();

  // Local state — initialised from the server-rendered entry
  const [entry, setEntry] = useState<PipelineEntry | null>(initialEntry);
  const [editStage, setEditStage] = useState<PipelineStage | "">(initialEntry?.stage ?? "");
  const [editPriority, setEditPriority] = useState<Priority | "">(initialEntry?.priority ?? "");
  const [editMeetingDate, setEditMeetingDate] = useState(initialEntry?.meetingDate ?? "");
  const [editCallOutcome, setEditCallOutcome] = useState(initialEntry?.callOutcome ?? "");
  const [editNotes, setEditNotes] = useState(initialEntry?.notes ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Suppress unused-var lint — leadId is kept in the signature for future use
  void leadId;

  if (!entry) {
    return (
      <SectionCard icon={ListChecks} title="Pipeline" tone="accent">
        <EmptySection message="No pipeline entry yet. Will appear once the lead is qualified or booked for a call." />
      </SectionCard>
    );
  }

  const isDirty =
    editStage !== (entry.stage ?? "") ||
    editPriority !== (entry.priority ?? "") ||
    editMeetingDate !== (entry.meetingDate ?? "") ||
    editCallOutcome !== (entry.callOutcome ?? "") ||
    editNotes !== (entry.notes ?? "");

  async function handleSave() {
    if (!entry) return;
    setSaveState("saving");
    setSaveError(null);

    const body: Record<string, unknown> = {
      meetingDate: editMeetingDate || null,
      callOutcome: editCallOutcome || null,
      notes: editNotes,
    };
    if (editStage) body.stage = editStage;
    if (editPriority) body.priority = editPriority;

    try {
      const res = await fetch(`/api/pipeline/${entry.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `Request failed (${res.status})`);
      }

      // Apply locally so the section reflects the change without waiting for a full refresh
      setEntry((prev) =>
        prev
          ? {
              ...prev,
              stage: (editStage as PipelineStage) || prev.stage,
              priority: (editPriority as Priority) || prev.priority,
              meetingDate: editMeetingDate || null,
              callOutcome: editCallOutcome || null,
              notes: editNotes,
            }
          : prev,
      );
      setSaveState("saved");
      router.refresh();
    } catch (err) {
      setSaveError((err as Error).message);
      setSaveState("error");
    }
  }

  return (
    <SectionCard
      icon={ListChecks}
      title="Pipeline"
      count={all.length > 1 ? all.length : undefined}
      notionId={entry.id}
      tone="accent"
    >
      <div className="space-y-5">
        {/* Current status strip */}
        <div className="flex flex-wrap items-center gap-2">
          {entry.stage && <StatusBadge label={entry.stage} tone="info" />}
          {entry.priority && (
            <StatusBadge label={entry.priority} tone={toneForPriority(entry.priority)} />
          )}
          {entry.stageDate && (
            <span className="ml-auto text-xs text-text-muted">
              In stage since {formatRelative(entry.stageDate)}
            </span>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* Editable fields */}
        <div className="space-y-4">
          {/* Stage */}
          <FormField label="Move to Stage">
            <select
              value={editStage}
              onChange={(e) => { setEditStage(e.target.value as PipelineStage); setSaveState("idle"); }}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="">— current: {entry.stage ?? "none"} —</option>
              {ALL_PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FormField>

          {/* Priority */}
          <FormField label="Priority">
            <div className="flex gap-2">
              {(["Hot", "Warm", "Cold"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setEditPriority(p); setSaveState("idle"); }}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition",
                    editPriority === p
                      ? p === "Hot"
                        ? "border-brand-danger bg-brand-danger text-white"
                        : p === "Warm"
                        ? "border-brand-warning bg-brand-warning text-white"
                        : "border-brand-info bg-brand-info text-white"
                      : "border-border bg-surface text-text-secondary hover:bg-surface-elevated",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Meeting Date */}
            <FormField label="Meeting Date">
              <input
                type="date"
                value={editMeetingDate}
                onChange={(e) => { setEditMeetingDate(e.target.value); setSaveState("idle"); }}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </FormField>

            {/* Call Outcome */}
            <FormField label="Call Outcome">
              <select
                value={editCallOutcome}
                onChange={(e) => { setEditCallOutcome(e.target.value); setSaveState("idle"); }}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="">— none —</option>
                {CALL_OUTCOMES.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Notes */}
          <FormField label="Notes">
            <textarea
              rows={3}
              value={editNotes}
              onChange={(e) => { setEditNotes(e.target.value); setSaveState("idle"); }}
              placeholder="Add notes…"
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </FormField>
        </div>

        {/* Read-only info pills */}
        {(entry.tierIPaymentDate || entry.tierIAmount != null) && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            {entry.tierIPaymentDate && (
              <InfoTile label="Tier I Payment" value={new Date(entry.tierIPaymentDate).toLocaleDateString()} />
            )}
            {entry.tierIAmount != null && (
              <InfoTile label="Tier I Amount" value={formatCurrency(entry.tierIAmount)} />
            )}
          </div>
        )}

        {/* Save button */}
        <div className="space-y-1.5 border-t border-border pt-4">
          {saveError && <p className="text-xs text-brand-danger">{saveError}</p>}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saveState === "saving" || !isDirty}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveState === "saving" ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : saveState === "saved" ? (
              <><CheckCircle className="h-4 w-4" /> Saved</>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-caps mb-1.5 block text-text-muted">{label}</label>
      {children}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-bg/40 p-3">
      <div className="label-caps text-text-muted">{label}</div>
      <div className="mt-1 text-text-primary">{value}</div>
    </div>
  );
}
