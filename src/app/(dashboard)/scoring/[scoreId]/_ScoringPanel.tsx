"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Flag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils/classnames";
import type { Tier1Criterion, Tier1Response } from "@/lib/notion/tier1";
import { GATE_META } from "@/lib/notion/criteria-seed";

// ── Types ────────────────────────────────────────────────────────────────────

interface LocalResponse {
  responsePageId?: string;
  score: number | null;
  fieldNote: string;
  evidenceRequested: string;
  residualRiskFlag: boolean;
  severity: string;
  priority: string;
  saving: boolean;
  saved: boolean;
  error: string | null;
  dirty: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "error";

interface Props {
  scoreId: string;
  leadId: string;
  leadName: string;
  companyName: string;
  criteria: Tier1Criterion[];
  initialResponses: Tier1Response[];
}

// ── Score button colours ─────────────────────────────────────────────────────

const SCORE_STYLES = {
  1: {
    label: "1 — Red",
    sublabel: "Critical Fragility",
    active: "border-red-600 bg-red-600 text-white",
    inactive: "border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950",
    dot: "bg-red-600",
  },
  2: {
    label: "2 — Yellow",
    sublabel: "Material Weakness",
    active: "border-amber-500 bg-amber-500 text-white",
    inactive: "border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950",
    dot: "bg-amber-500",
  },
  3: {
    label: "3 — Light Green",
    sublabel: "Institutionally Acceptable",
    active: "border-lime-600 bg-lime-600 text-white",
    inactive: "border-lime-400 text-lime-700 hover:bg-lime-50 dark:hover:bg-lime-950",
    dot: "bg-lime-600",
  },
  4: {
    label: "4 — Dark Green",
    sublabel: "Premium Grade",
    active: "border-emerald-700 bg-emerald-700 text-white",
    inactive: "border-emerald-400 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950",
    dot: "bg-emerald-700",
  },
} as const;

// ── Main component ───────────────────────────────────────────────────────────

export function ScoringPanel({
  scoreId,
  leadId,
  leadName,
  companyName,
  criteria,
  initialResponses,
}: Props) {
  const router = useRouter();

  // Group criteria by gate
  const gateOrder = GATE_META.map(g => g.name);
  const criteriaByGate = gateOrder.reduce<Record<string, Tier1Criterion[]>>((acc, gate) => {
    acc[gate] = criteria.filter(c => c.gate === gate);
    return acc;
  }, {});

  const [activeGateIdx, setActiveGateIdx] = useState(0);
  const activeGate = gateOrder[activeGateIdx]!;
  const gateCriteria = criteriaByGate[activeGate] ?? [];

  // Build initial local state from existing responses
  const buildInitial = useCallback((): Record<string, LocalResponse> => {
    const map: Record<string, LocalResponse> = {};
    for (const c of criteria) {
      const existing = initialResponses.find(r => r.criterionCode === c.criterionId);
      map[c.criterionId] = {
        responsePageId: existing?.id,
        score: existing?.score ?? null,
        fieldNote: existing?.fieldNote ?? "",
        evidenceRequested: existing?.evidenceRequested ?? "",
        residualRiskFlag: existing?.residualRiskFlag ?? false,
        severity: existing?.severity ?? c.defaultSeverity,
        priority: existing?.priority ?? c.defaultPriority,
        saving: false,
        saved: Boolean(existing?.score),
        error: null,
        dirty: false,
      };
    }
    return map;
  }, [criteria, initialResponses]);

  const [responses, setResponses] = useState<Record<string, LocalResponse>>(buildInitial);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [completeState, setCompleteState] = useState<SaveState>("idle");
  const [completeError, setCompleteError] = useState<string | null>(null);

  const saveTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Auto-save debounce (1.5s after last change)
  const scheduleSave = useCallback((criterionId: string, data: LocalResponse, criterion: Tier1Criterion) => {
    if (saveTimeouts.current[criterionId]) clearTimeout(saveTimeouts.current[criterionId]);
    saveTimeouts.current[criterionId] = setTimeout(() => {
      void doSave(criterionId, data, criterion);
    }, 1500);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doSave = useCallback(async (criterionId: string, data: LocalResponse, criterion: Tier1Criterion) => {
    setResponses(prev => ({ ...prev, [criterionId]: { ...prev[criterionId]!, saving: true, error: null } }));
    try {
      const res = await fetch("/api/tier1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responsePageId: data.responsePageId,
          leadId,
          scoreRecordId: scoreId,
          criterionPageId: criterion.id,
          criterionCode: criterionId,
          gate: criterion.gate,
          gateWeight: criterion.gateWeight,
          score: data.score,
          fieldNote: data.fieldNote,
          evidenceRequested: data.evidenceRequested,
          residualRiskFlag: data.residualRiskFlag,
          severity: data.severity,
          priority: data.priority,
          criticalCriterion: criterion.criticalCriterion,
        }),
      });
      const json = await res.json() as { ok?: boolean; pageId?: string; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Save failed");
      setResponses(prev => ({
        ...prev,
        [criterionId]: {
          ...prev[criterionId]!,
          saving: false,
          saved: true,
          dirty: false,
          error: null,
          responsePageId: json.pageId ?? prev[criterionId]?.responsePageId,
        },
      }));
    } catch (err) {
      setResponses(prev => ({
        ...prev,
        [criterionId]: { ...prev[criterionId]!, saving: false, error: (err as Error).message },
      }));
    }
  }, [leadId, scoreId]);

  const updateResponse = useCallback((criterionId: string, update: Partial<LocalResponse>, criterion: Tier1Criterion) => {
    setResponses(prev => {
      const next = { ...prev[criterionId]!, ...update, dirty: true };
      scheduleSave(criterionId, next, criterion);
      return { ...prev, [criterionId]: next };
    });
  }, [scheduleSave]);

  // ── Progress calculations ────────────────────────────────────────────────
  const totalScored = criteria.filter(c => responses[c.criterionId]?.score != null).length;
  const totalWithNote = criteria.filter(c => {
    const r = responses[c.criterionId];
    return r?.score != null && r.fieldNote.trim().length > 0;
  }).length;
  const gateScored = gateCriteria.filter(c => responses[c.criterionId]?.score != null).length;
  const canComplete = totalScored === 25 && totalWithNote === 25;

  // ── Mark Scoring Complete ────────────────────────────────────────────────
  async function handleComplete() {
    if (!canComplete) return;
    setCompleteState("saving");
    setCompleteError(null);
    try {
      // Update the Diagnostic Score record in Notion to set Tier I Draft Requested = true
      const res = await fetch(`/api/tier1/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreRecordId: scoreId }),
      });
      const j = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) throw new Error(j.error ?? "Failed");
      setCompleteState("saved");
      router.push(`/scores`);
    } catch (err) {
      setCompleteError((err as Error).message);
      setCompleteState("error");
    }
  }

  const getAnchorText = (score: number, c: Tier1Criterion): string => {
    if (score === 1) return c.score1Response;
    if (score === 2) return c.score2Response;
    if (score === 3) return c.score3Response;
    return c.score4Response;
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Session header */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold text-text-primary">
              {leadName} — Tier I Underwriting Session
            </h1>
            {companyName && (
              <p className="text-sm text-text-secondary">{companyName}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {/* Overall progress */}
            <div className="text-right">
              <div className="label-caps text-text-muted">Overall</div>
              <div className="text-sm font-semibold tabular-nums text-text-primary">
                {totalScored} <span className="font-normal text-text-muted">/ 25</span>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-right">
              <div className="label-caps text-text-muted">With notes</div>
              <div className={cn("text-sm font-semibold tabular-nums", totalWithNote < totalScored ? "text-brand-warning" : "text-brand-success")}>
                {totalWithNote} <span className="font-normal text-text-muted">/ {totalScored}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-surface-elevated">
          <div
            className="h-1.5 rounded-full bg-brand-primary transition-all"
            style={{ width: `${(totalScored / 25) * 100}%` }}
          />
        </div>
      </div>

      {/* Gate navigation */}
      <div className="flex gap-1 overflow-x-auto">
        {GATE_META.map((gate, idx) => {
          const gCriteria = criteriaByGate[gate.name] ?? [];
          const gScored = gCriteria.filter(c => responses[c.criterionId]?.score != null).length;
          const gComplete = gScored === gCriteria.length;
          return (
            <button
              key={gate.name}
              type="button"
              onClick={() => setActiveGateIdx(idx)}
              className={cn(
                "flex shrink-0 flex-col items-start rounded-lg border px-3 py-2 text-xs transition",
                idx === activeGateIdx
                  ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                  : "border-border bg-surface text-text-secondary hover:bg-surface-elevated",
              )}
            >
              <span className="label-caps font-bold">{gate.code}</span>
              <span className="mt-0.5 font-medium leading-tight">
                {gate.name.replace(/^Gate \d+ — /, "")}
              </span>
              <span className={cn("mt-1 tabular-nums", gComplete ? "text-brand-success" : "")}>
                {gScored}/{gCriteria.length}
                {gComplete && <CheckCircle2 className="ml-1 inline h-3 w-3" />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Gate header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">{activeGate}</h2>
          <p className="text-xs text-text-muted">
            {gateScored} of {gateCriteria.length} criteria scored
            {" · "}Weight {GATE_META[activeGateIdx]?.weight}×
            {" · "}Max {GATE_META[activeGateIdx]?.max} weighted points
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={activeGateIdx === 0}
            onClick={() => setActiveGateIdx(i => i - 1)}
            className="rounded-md border border-border p-1.5 text-text-secondary transition hover:bg-surface-elevated disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={activeGateIdx === GATE_META.length - 1}
            onClick={() => setActiveGateIdx(i => i + 1)}
            className="rounded-md border border-border p-1.5 text-text-secondary transition hover:bg-surface-elevated disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Criteria cards */}
      <div className="space-y-4">
        {gateCriteria.map((criterion, cidx) => {
          const r = responses[criterion.criterionId];
          if (!r) return null;
          const isScored = r.score != null;
          const hasNote = r.fieldNote.trim().length > 0;
          const showEvidencePanel = expandedEvidence[criterion.criterionId] ?? false;

          return (
            <div
              key={criterion.criterionId}
              className={cn(
                "rounded-xl border bg-surface p-5 transition",
                isScored && hasNote
                  ? "border-brand-success/30"
                  : isScored
                  ? "border-brand-warning/40"
                  : "border-border",
              )}
            >
              {/* Criterion header */}
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-elevated text-xs font-mono text-text-muted">
                  {criterion.criterionId}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">{criterion.criterionName}</span>
                    {criterion.criticalCriterion && (
                      <span className="label-caps rounded-full border border-brand-danger/40 bg-brand-danger/10 px-2 py-0.5 text-xs text-brand-danger">
                        Critical
                      </span>
                    )}
                    {isScored && hasNote && (
                      <CheckCircle2 className="ml-auto h-4 w-4 text-brand-success" />
                    )}
                    {isScored && !hasNote && (
                      <AlertCircle className="ml-auto h-4 w-4 text-brand-warning" />
                    )}
                    {r.saving && (
                      <Loader2 className="ml-auto h-4 w-4 animate-spin text-text-muted" />
                    )}
                    {r.saved && !r.dirty && !r.saving && (
                      <Save className="ml-auto h-3.5 w-3.5 text-text-muted" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-text-muted">{criterion.gate}</p>
                </div>
              </div>

              {/* Operator question */}
              <div className="mb-5 rounded-lg border border-border bg-bg/60 p-4">
                <div className="label-caps mb-1.5 text-text-muted">Operator Question</div>
                <p className="text-sm leading-relaxed text-text-primary">
                  {criterion.operatorQuestion}
                </p>
              </div>

              {/* Score buttons */}
              <div className="mb-4">
                <div className="label-caps mb-2 text-text-muted">Score</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {([1, 2, 3, 4] as const).map(s => {
                    const style = SCORE_STYLES[s];
                    const isActive = r.score === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateResponse(criterion.criterionId, { score: s }, criterion)}
                        className={cn(
                          "flex flex-col items-start rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition",
                          isActive ? style.active : style.inactive,
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={cn("h-2.5 w-2.5 rounded-full", isActive ? "bg-white/80" : style.dot)} />
                          <span>{style.label}</span>
                        </div>
                        <span className={cn("mt-0.5 text-xs font-normal", isActive ? "opacity-80" : "opacity-60")}>
                          {style.sublabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Anchor text preview */}
              {r.score != null && (
                <div className={cn(
                  "mb-4 rounded-lg border p-3 text-xs leading-relaxed",
                  r.score === 1 ? "border-red-200 bg-red-50/50 text-red-900 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-200" :
                  r.score === 2 ? "border-amber-200 bg-amber-50/50 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200" :
                  r.score === 3 ? "border-lime-200 bg-lime-50/50 text-lime-900 dark:border-lime-900/30 dark:bg-lime-950/20 dark:text-lime-200" :
                  "border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-200"
                )}>
                  <div className="label-caps mb-1.5 opacity-60">Anchor — Score {r.score}</div>
                  {getAnchorText(r.score, criterion)}
                </div>
              )}

              {/* Field Note */}
              <div className="mb-3">
                <label className="label-caps mb-1.5 block text-text-muted">
                  Field Note
                  <span className="ml-1 text-brand-danger">*</span>
                  <span className="ml-2 font-normal normal-case text-text-muted">
                    — capture specific client language, numbers, named employees
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={r.fieldNote}
                  onChange={e => updateResponse(criterion.criterionId, { fieldNote: e.target.value }, criterion)}
                  placeholder="Write at least one specific sentence. Vague notes produce generic report language. Specific notes produce institutional findings."
                  className={cn(
                    "w-full rounded-md border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-primary",
                    !hasNote && isScored
                      ? "border-brand-warning focus:border-brand-warning focus:ring-brand-warning"
                      : "border-border focus:border-brand-primary",
                  )}
                />
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className={cn(
                    !hasNote && isScored ? "text-brand-warning" : "text-text-muted"
                  )}>
                    {!hasNote && isScored ? "⚠ Field note required before report can be drafted" : `${r.fieldNote.length} chars`}
                  </span>
                </div>
              </div>

              {/* Evidence Requested (collapsible) */}
              <div>
                <button
                  type="button"
                  onClick={() => setExpandedEvidence(prev => ({ ...prev, [criterion.criterionId]: !prev[criterion.criterionId] }))}
                  className="flex items-center gap-1.5 text-xs text-text-muted transition hover:text-text-primary"
                >
                  {showEvidencePanel ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  Evidence Requested (optional)
                  {r.evidenceRequested && <span className="rounded-full bg-brand-info/20 px-1.5 py-0.5 text-brand-info">filled</span>}
                </button>
                {showEvidencePanel && (
                  <textarea
                    rows={2}
                    value={r.evidenceRequested}
                    onChange={e => updateResponse(criterion.criterionId, { evidenceRequested: e.target.value }, criterion)}
                    placeholder="Documents or records you asked the client to produce…"
                    className="mt-2 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                )}
              </div>

              {/* Residual Risk Flag */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`rrisk-${criterion.criterionId}`}
                  checked={r.residualRiskFlag}
                  onChange={e => updateResponse(criterion.criterionId, { residualRiskFlag: e.target.checked }, criterion)}
                  className="h-4 w-4 rounded border-border bg-bg accent-brand-danger"
                />
                <label htmlFor={`rrisk-${criterion.criterionId}`} className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                  <Flag className="h-3.5 w-3.5" />
                  Residual Risk Flag — score may change pending evidence
                </label>
              </div>

              {r.error && (
                <p className="mt-2 text-xs text-brand-danger">{r.error}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Gate navigation footer */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <button
          type="button"
          disabled={activeGateIdx === 0}
          onClick={() => { setActiveGateIdx(i => i - 1); window.scrollTo(0, 0); }}
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-text-secondary transition hover:bg-surface-elevated disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous Gate
        </button>

        {activeGateIdx < GATE_META.length - 1 ? (
          <button
            type="button"
            onClick={() => { setActiveGateIdx(i => i + 1); window.scrollTo(0, 0); }}
            className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-hover"
          >
            Next Gate
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          /* Mark Scoring Complete — only on last gate, only when all 25 scored + all notes filled */
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              disabled={!canComplete || completeState === "saving"}
              onClick={() => void handleComplete()}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition",
                canComplete
                  ? "bg-brand-success text-white hover:opacity-90"
                  : "cursor-not-allowed bg-surface-elevated text-text-muted",
              )}
            >
              {completeState === "saving" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Marking complete…</>
              ) : completeState === "saved" ? (
                <><CheckCircle2 className="h-4 w-4" /> Scoring complete</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Mark Scoring Complete</>
              )}
            </button>
            {!canComplete && (
              <p className="text-xs text-text-muted">
                {25 - totalScored > 0 && `${25 - totalScored} criteria not scored. `}
                {totalScored - totalWithNote > 0 && `${totalScored - totalWithNote} missing field notes.`}
              </p>
            )}
            {completeError && (
              <p className="text-xs text-brand-danger">{completeError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
