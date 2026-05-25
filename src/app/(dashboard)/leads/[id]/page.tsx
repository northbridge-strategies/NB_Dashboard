import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  ExternalLink,
} from "lucide-react";
import { getLead } from "@/lib/notion/leads";
import { getScoresForLead } from "@/lib/notion/scores";
import { getPipelineForLead } from "@/lib/notion/pipeline";
import { getRevenueForLead } from "@/lib/notion/revenue";
import { getOutreachForLead } from "@/lib/notion/linkedin";
import { getHealthForLead } from "@/lib/notion/health";
import {
  StatusBadge,
  toneForClassification,
  toneForLifecycle,
  toneForPriority,
} from "@/components/ui/StatusBadge";
import { ScoreSection } from "./_ScoreSection";
import { ReportsSection } from "./_ReportsSection";
import { PipelineSection } from "./_PipelineSection";
import { RevenueSection } from "./_RevenueSection";
import { OutreachSection } from "./_OutreachSection";
import { HealthSection } from "./_HealthSection";
import { initials, formatPhone } from "@/lib/utils/format";

export const revalidate = 30;

function notionPageUrl(id: string): string {
  return `https://www.notion.so/${id.replace(/-/g, "")}`;
}

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const lead = await getLead(params.id).catch(() => null);
  if (!lead) notFound();

  const [scores, pipeline, revenue, outreach, health] = await Promise.all([
    getScoresForLead(lead.id).catch(() => []),
    getPipelineForLead(lead.id).catch(() => []),
    getRevenueForLead(lead.id).catch(() => []),
    getOutreachForLead(lead.id).catch(() => []),
    getHealthForLead(lead.id).catch(() => []),
  ]);

  const latestScore = scores[0] ?? null;
  const latestPipeline = pipeline[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/leads"
        className="inline-flex items-center gap-1.5 text-xs text-text-secondary transition hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Leads
      </Link>

      {/* Header card */}
      <header className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-primary text-lg font-semibold text-white ring-2 ring-offset-2 ring-offset-surface"
            style={
              latestScore?.classification
                ? {
                    boxShadow: `0 0 0 2px var(--ring, transparent)`,
                  }
                : undefined
            }
          >
            {initials(lead.name || lead.email || "?")}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold text-text-primary sm:text-2xl">
              {lead.name || "(unnamed lead)"}
            </h1>
            {lead.company && (
              <div className="mt-1 flex items-center gap-1.5 truncate text-sm text-text-secondary">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="truncate">{lead.company}</span>
                {lead.industry && (
                  <span className="text-text-muted">· {lead.industry}</span>
                )}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {lead.priority && (
                <StatusBadge label={lead.priority} tone={toneForPriority(lead.priority)} />
              )}
              {latestScore?.classification && (
                <StatusBadge
                  label={latestScore.classification}
                  tone={toneForClassification(latestScore.classification)}
                />
              )}
              {lead.lifecycleState && (
                <StatusBadge
                  label={lead.lifecycleState}
                  tone={toneForLifecycle(lead.lifecycleState)}
                />
              )}
              {lead.source && (
                <StatusBadge label={lead.source} tone="info" />
              )}
              {lead.trafficSource && (
                <span className="label-caps text-text-muted">
                  via {lead.trafficSource}
                </span>
              )}
            </div>

            {/* Contact actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary transition hover:border-brand-primary/40 hover:bg-surface-elevated hover:text-text-primary"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {lead.email}
                </a>
              )}
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary transition hover:border-brand-primary/40 hover:bg-surface-elevated hover:text-text-primary"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span className="tabular-nums">{formatPhone(lead.phone)}</span>
                </a>
              )}
              <a
                href={notionPageUrl(lead.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary transition hover:border-brand-primary/40 hover:bg-surface-elevated hover:text-text-primary"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View in Notion
              </a>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        {(lead.revenueRange || lead.lastActivityDate || lead.lastContacted) && (
          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-border pt-4 text-xs sm:grid-cols-3">
            <Field label="Revenue Range" value={lead.revenueRange} />
            <Field label="Last Activity" value={lead.lastActivityDate} />
            <Field label="Last Contacted" value={lead.lastContacted} />
          </div>
        )}
      </header>

      {/* Section cards */}
      <ScoreSection score={latestScore} all={scores} leadId={lead.id} />
      <ReportsSection scores={scores} leadId={lead.id} />
      <PipelineSection entry={latestPipeline} all={pipeline} leadId={lead.id} />
      <RevenueSection entries={revenue} leadId={lead.id} />
      <OutreachSection entries={outreach} leadId={lead.id} />
      <HealthSection entries={health} leadId={lead.id} />
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <div className="label-caps text-text-muted">{label}</div>
      <div className="mt-0.5 text-text-primary">{value || "—"}</div>
    </div>
  );
}
