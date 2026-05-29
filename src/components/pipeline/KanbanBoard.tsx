"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
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
  DEFAULT_PIPELINE_STAGES,
  ALL_PIPELINE_STAGES,
  type Classification,
  type PipelineStage,
  type Priority,
} from "@/lib/types/domain";

export interface KanbanLeadInfo extends CardLeadInfo {
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
  lifecycleState?: string | null;
}

export function KanbanBoard({
  entries,
  leadById,
}: {
  entries: PipelineEntry[];
  leadById: Map<string, KanbanLeadInfo>;
}) {
  const [showAll, setShowAll] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [classFilter, setClassFilter] = useState<"all" | Classification>("all");
  const [search, setSearch] = useState("");
  const [openEntry, setOpenEntry] = useState<PipelineEntry | null>(null);

  const stages: PipelineStage[] = showAll
    ? ALL_PIPELINE_STAGES
    : DEFAULT_PIPELINE_STAGES;

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (priorityFilter !== "all" && e.priority !== priorityFilter) return false;
      const lead = e.leadId ? leadById.get(e.leadId) : undefined;
      if (
        classFilter !== "all" &&
        lead?.classification !== classFilter
      )
        return false;
      if (search) {
        const q = search.toLowerCase();
        const hay =
          (lead?.name ?? "") + " " + (lead?.company ?? "") + " " + (e.title ?? "");
        if (!hay.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [entries, priorityFilter, classFilter, search, leadById]);

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

  const openLead = openEntry?.leadId ? leadById.get(openEntry.leadId) : undefined;

  return (
    <div className="space-y-4">
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
          options={[
            "all",
            "Founder-Dependent",
            "Transitional",
            "Stabilized",
            "Transfer-Ready",
          ]}
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
                  <span className="text-sm font-medium text-text-primary">
                    {stage}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      cards.length
                        ? "bg-surface-elevated text-text-secondary"
                        : "text-text-muted",
                    )}
                  >
                    {cards.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-2">
                  {cards.length === 0 ? (
                    <div className="px-2 py-6 text-center text-xs text-text-muted">
                      —
                    </div>
                  ) : (
                    cards.map((entry) => (
                      <PipelineCard
                        key={entry.id}
                        entry={entry}
                        lead={entry.leadId ? leadById.get(entry.leadId) : undefined}
                        onClick={() => setOpenEntry(entry)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SlideOver
        open={!!openEntry}
        title={openLead?.name ?? openEntry?.title ?? "Pipeline entry"}
        onClose={() => setOpenEntry(null)}
      >
        {openEntry && (
          <div className="space-y-5">
            <div className="space-y-1">
              {openLead?.company && (
                <div className="text-sm text-text-secondary">{openLead.company}</div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {openEntry.stage && <StatusBadge label={openEntry.stage} tone="info" />}
                {openEntry.priority && (
                  <StatusBadge
                    label={openEntry.priority}
                    tone={toneForPriority(openEntry.priority)}
                  />
                )}
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
            </div>

            {openLead?.scorePct != null && (
              <div>
                <div className="label-caps mb-1 text-text-muted">Score</div>
                <ScoreBar pct={openLead.scorePct} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Email" value={openLead?.email} type="email" />
              <Field label="Phone" value={openLead?.phone} type="phone" />
              <Field label="Industry" value={openLead?.industry} />
              <Field label="Stage Date" value={openEntry.stageDate} />
              <Field label="Call Outcome" value={openEntry.callOutcome} />
              <Field label="Next Action" value={openEntry.nextAction} />
              <Field
                label="Tier I Payment"
                value={
                  openEntry.tierIPaymentDate
                    ? `${openEntry.tierIPaymentDate}`
                    : null
                }
              />
              <Field
                label="Tier I Amount"
                value={
                  openEntry.tierIAmount != null
                    ? `$${openEntry.tierIAmount.toLocaleString()}`
                    : null
                }
              />
            </div>

            {openEntry.notes && (
              <div>
                <div className="label-caps mb-1 text-text-muted">Notes</div>
                <p className="whitespace-pre-wrap text-sm text-text-secondary">
                  {openEntry.notes}
                </p>
              </div>
            )}

            {openEntry.leadId && (
              <div className="border-t border-border pt-4">
                <Link
                  href={`/leads/${openEntry.leadId}`}
                  onClick={() => setOpenEntry(null)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-hover"
                >
                  View Full Lead Detail
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
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

function Field({
  label,
  value,
  type,
}: {
  label: string;
  value: string | null | undefined;
  type?: "email" | "phone";
}) {
  const display = value || "—";
  return (
    <div>
      <div className="label-caps text-text-muted">{label}</div>
      {value && type === "email" ? (
        <a href={`mailto:${value}`} className="text-brand-info hover:underline truncate block text-sm">
          {value}
        </a>
      ) : value && type === "phone" ? (
        <a href={`tel:${value}`} className="text-brand-info hover:underline text-sm">
          {value}
        </a>
      ) : (
        <div className="text-text-primary text-sm">{display}</div>
      )}
    </div>
  );
}
