"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Loader2, CheckCircle } from "lucide-react";
import { PipelineCard, type CardLeadInfo } from "./PipelineCard";
import { SlideOver } from "@/components/ui/SlideOver";
import {
  StatusBadge,
  toneForLifecycle,
  toneForPriority,
  toneForClassification,
} from "@/components/ui/StatusBadge";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/utils/classnames";
import type { PipelineEntry } from "@/lib/notion/pipeline";
import {
  ALL_PIPELINE_STAGES,
  DEFAULT_PIPELINE_STAGES,
  type Classification,
  type PipelineStage,
  type Priority,
} from "@/lib/types/domain";
import { useRouter } from "next/navigation";

export interface KanbanLeadInfo extends CardLeadInfo {
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
  lifecycleState?: string | null;
}

const CALL_OUTCOMES = [
  "Interested-Moving to Purchase",
  "Needs More Time",
  "Not a Fit",
  "No Show",
] as const;

type SaveState = "idle" | "saving" | "saved" | "error";

export function KanbanBoard({
  entries,
  leadById,
}: {
  entries: PipelineEntry[];
  leadById: Map<string, KanbanLeadInfo>;
}) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [classFilter, setClassFilter] = useState<"all" | Classification>("all");
  const [search, setSearch] = useState("");
  const [openEntry, setOpenEntry] = useState<PipelineEntry | null>(null);

  // Local optimistic overrides — keyed by entry id
  const [overrides, setOverrides] = useState<Map<string, Partial<PipelineEntry>>>(new Map());

  // Edit form state (populated when a card is opened)
  const [editStage, setEditStage] = useState<PipelineStage | "">("");
  const [editPriority, setEditPriority] = useState<Priority | "">("");
  const [editMeetingDate, setEditMeetingDate] = useState("");
  const [editCallOutcome, setEditCallOutcome] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const stages: PipelineStage[] = showAll ? ALL_PIPELINE_STAGES : DEFAULT_PIPELINE_STAGES;

  // Merge entries with any local optimistic overrides
  const mergedEntries = useMemo(() => {
    return entries.map((e) => {
      const ov = overrides.get(e.id);
      return ov ? { ...e, ...ov } : e;
    });
  }, [entries, overrides]);

  const filtered = useMemo(() => {
    return mergedEntries.filter((e) => {
      if (priorityFilter !== "all" && e.priority !== priorityFilter) return false;
      const lead = e.leadId ? leadById.get(e.leadId) : undefined;
      if (classFilter !== "all" && lead?.classification !== classFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = (lead?.name ?? "") + " " + (lead?.company ?? "") + " " + (e.title ?? "");
        if (!hay.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [mergedEntries, priorityFilter, classFilter, search, leadById]);

  const grouped = useMemo(() => {
    const map = new Map<PipelineStage, PipelineEntry[]>();
    for (const stage of stages) map.set(stage, []);
    for (const entry of filtered) {
      if (!entry.stage) continue;
      const list = map.get(entry.stage as PipelineStage);
      if (list) list.push(entry);
    }
    return map;
  }, [filtered, stages]);

  function openCard(entry: PipelineEntry) {
    const merged = { ...entry, ...(overrides.get(entry.id) ?? {}) };
    setOpenEntry(merged);
    setEditStage(merged.stage ?? "");
    setEditPriority(merged.priority ?? "");
    setEditMeetingDate(merged.meetingDate ?? "");
    setEditCallOutcome(merged.callOutcome ?? "");
    setEditNotes(merged.notes ?? "");
    setSaveState("idle");
    setSaveError(null);
  }

  function closeSlideOver() {
    setOpenEntry(null);
    setSaveState("idle");
    setSaveError(null);
  }

  async function handleSave() {
    if (!openEntry) return;
    setSaveState("saving");
    setSaveError(null);

    const body: Record<string, unknown> = {};
    if (editStage) body.stage = editStage;
    if (editPriority) body.priority = editPriority;
    body.meetingDate = editMeetingDate || null;
    body.callOutcome = editCallOutcome || null;
    body.notes = editNotes;

    try {
      const res = await fetch(`/api/pipeline/${openEntry.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `Request failed (${res.status})`);
      }

      // Apply optimistic override so the board updates immediately
      setOverrides((prev) => {
        const next = new Map(prev);
        next.set(openEntry.id, {
          stage: (editStage as PipelineStage) || openEntry.stage,
          priority: (editPriority as Priority) || openEntry.priority,
          meetingDate: editMeetingDate || null,
          callOutcome: editCallOutcome || null,
          notes: editNotes,
        });
        return next;
      });

      setSaveState("saved");
      // Background revalidation so server data eventually catches up
      router.refresh();
    } catch (err) {
      setSaveError((err as Error).message);
      setSaveState("error");
    }
  }

  const openLead = openEntry?.leadId ? leadById.get(openEntry.leadId) : undefined;

  // Has the user changed anything from what was originally on the entry?
  const isDirty =
    openEntry &&
    (editStage !== (openEntry.stage ?? "") ||
      editPriority !== (openEntry.priority ?? "") ||
      editMeetingDate !== (openEntry.meetingDate ?? "") ||
      editCallOutcome !== (openEntry.callOutcome ?? "") ||
      editNotes !== (openEntry.notes ?? ""));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="search"
            placeholder="Search lead or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-bg py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>
        <FilterSelect
          label="Priority"
          value={priorityFilter}
          options={["all", "Hot", "Warm", "Cold"]}
          onChange={(v) => setPriorityFilter(v as typeof priorityFilter)}
        />
        <FilterSelect
          label="Classification"
          value={classFilter}
          options={["all", "Founder-Dependent", "Transitional", "Stabilized", "Transfer-Ready"]}
          onChange={(v) => setClassFilter(v as typeof classFilter)}
        />
        <label className="ml-auto inline-flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-bg accent-brand-primary"
          />
          Show all stages
        </label>
      </div>

      {/* Board */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No pipeline entries match your filters"
          description="Adjust filters or clear the search."
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {stages.map((stage) => {
            const cards = grouped.get(stage) ?? [];
            return (
              <div
                key={stage}
                className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-bg/40"
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <span className="text-sm font-medium text-text-primary">{stage}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      cards.length ? "bg-surface-elevated text-text-secondary" : "text-text-muted",
                    )}
                  >
                    {cards.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-2">
                  {cards.length === 0 ? (
                    <div className="px-2 py-6 text-center text-xs text-text-muted">—</div>
                  ) : (
                    cards.map((entry) => (
                      <PipelineCard
                        key={entry.id}
                        entry={entry}
                        lead={entry.leadId ? leadById.get(entry.leadId) : undefined}
                        onClick={() => openCard(entry)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editable SlideOver */}
      <SlideOver
        open={!!openEntry}
        title={openLead?.name ?? openEntry?.title ?? "Pipeline entry"}
        onClose={closeSlideOver}
      >
        {openEntry && (
          <div className="flex h-full flex-col gap-5">
            {/* Lead meta — read-only */}
            <div className="space-y-1">
              {openLead?.company && (
                <div className="text-sm text-text-secondary">{openLead.company}</div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {openLead?.classification && (
                  <StatusBadge
                    label={openLead.classification}
                    tone={toneForClassification(openLead.classification)}
                  />
                )}
                {openLead?.lifecycleState && (
                  <StatusBadge
                    label={openLead.lifecycleState}
                    tone={toneForLifecycle(openLead.lifecycleState)}
                  />
                )}
              </div>
              {openLead?.scorePct != null && (
                <div className="pt-1">
                  <ScoreBar pct={openLead.scorePct} />
                </div>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Editable fields */}
            <div className="flex-1 space-y-4 overflow-y-auto">
              {/* Stage */}
              <FormField label="Stage">
                <select
                  value={editStage}
                  onChange={(e) => { setEditStage(e.target.value as PipelineStage); setSaveState("idle"); }}
                  className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="">— select stage —</option>
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

              {/* Notes */}
              <FormField label="Notes">
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={(e) => { setEditNotes(e.target.value); setSaveState("idle"); }}
                  placeholder="Add notes…"
                  className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </FormField>

              {/* Read-only info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <InfoField label="Email" value={openLead?.email} type="email" />
                <InfoField label="Phone" value={openLead?.phone} type="phone" />
                <InfoField label="Industry" value={openLead?.industry} />
                <InfoField label="Stage Date" value={openEntry.stageDate} />
                {openEntry.tierIPaymentDate && (
                  <InfoField label="Tier I Payment" value={openEntry.tierIPaymentDate} />
                )}
                {openEntry.tierIAmount != null && (
                  <InfoField label="Tier I Amount" value={`$${openEntry.tierIAmount.toLocaleString()}`} />
                )}
              </div>
            </div>

            {/* Save bar */}
            <div className="space-y-2 border-t border-border pt-4">
              {saveError && (
                <p className="text-xs text-brand-danger">{saveError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saveState === "saving" || !isDirty}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saveState === "saving" ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  ) : saveState === "saved" ? (
                    <><CheckCircle className="h-4 w-4" /> Saved</>
                  ) : (
                    "Save changes"
                  )}
                </button>
                {openEntry.leadId && (
                  <Link
                    href={`/leads/${openEntry.leadId}`}
                    onClick={closeSlideOver}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2.5 text-sm text-text-secondary transition hover:bg-surface-elevated hover:text-text-primary"
                  >
                    Full detail
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="label-caps text-text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-bg px-2 py-1.5 text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "all" ? `All ${label.toLowerCase()}` : o}
          </option>
        ))}
      </select>
    </label>
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

function InfoField({
  label,
  value,
  type,
}: {
  label: string;
  value: string | null | undefined;
  type?: "email" | "phone";
}) {
  return (
    <div className="rounded-md border border-border bg-bg/40 p-2">
      <div className="label-caps text-text-muted">{label}</div>
      <div className="mt-0.5 truncate text-text-primary">
        {value && type === "email" ? (
          <a href={`mailto:${value}`} className="text-brand-info hover:underline">{value}</a>
        ) : value && type === "phone" ? (
          <a href={`tel:${value}`} className="text-brand-info hover:underline">{value}</a>
        ) : (
          value || "—"
        )}
      </div>
    </div>
  );
}
