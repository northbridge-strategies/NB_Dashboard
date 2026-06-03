import Link from "next/link";
import { ClipboardList, ArrowRight, CheckCircle2 } from "lucide-react";
import { listAllLeads } from "@/lib/notion/leads";
import { listScores } from "@/lib/notion/scores";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { StatusBadge, toneForClassification } from "@/components/ui/StatusBadge";
import { DB } from "@/lib/notion/ids";

export const dynamic = "force-dynamic";

export default async function ScoringPage() {
  const isSetup = Boolean(DB.tier1Criteria && DB.tier1Responses);

  if (!isSetup) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-brand-warning/30 bg-brand-warning/5 p-6">
          <h2 className="text-base font-semibold text-brand-warning">Setup Required</h2>
          <p className="mt-2 text-sm text-text-secondary">
            The Tier I Criteria and Responses databases have not been created yet.
            Run the one-shot setup to create them in Notion and seed all 25 criteria.
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-xs text-text-muted font-mono">Step 1: POST to /api/tier1/setup (while logged in as Admin)</p>
            <p className="text-xs text-text-muted font-mono">Step 2: Add the returned DB IDs to Vercel env vars</p>
            <p className="text-xs text-text-muted font-mono">Step 3: Redeploy</p>
          </div>
          <a
            href="/api/tier1/setup"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand-warning px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Check Setup Status
          </a>
        </div>
      </div>
    );
  }

  const [leadsR, scoresR] = await Promise.allSettled([listAllLeads(), listScores()]);

  if (leadsR.status === "rejected") {
    return <ErrorState title="Failed to load leads" description={(leadsR.reason as Error)?.message} />;
  }

  const leads = leadsR.value;
  const scores = scoresR.status === "fulfilled" ? scoresR.value : [];

  // Only show leads that are Paid, Active, or Complete (have a paid engagement)
  const eligibleLeads = leads.filter(l =>
    l.lifecycleState === "Paid" || l.lifecycleState === "Active" || l.lifecycleState === "Complete"
  );

  // Map scores by lead ID
  const scoreByLead = new Map(scores.map(s => [s.leadId, s]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Live Scoring Sessions</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Select a paid engagement to open the Tier I underwriting panel. Score all 25 criteria during the live session.
        </p>
      </div>

      {eligibleLeads.length === 0 ? (
        <EmptyState
          title="No eligible engagements"
          description="Leads with Lifecycle State = Paid, Active, or Complete will appear here for scoring."
        />
      ) : (
        <ul className="space-y-3">
          {eligibleLeads.map(lead => {
            const score = scoreByLead.get(lead.id);
            const hasScore = Boolean(score);
            const classification = score?.classification ?? null;

            return (
              <li key={lead.id}>
                <Link
                  href={`/scoring/${score?.id ?? lead.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition hover:border-brand-primary/40 hover:bg-surface-elevated"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{lead.name || "(unnamed)"}</span>
                      {lead.lifecycleState && (
                        <span className="label-caps rounded-full bg-brand-success/10 px-2 py-0.5 text-xs text-brand-success">
                          {lead.lifecycleState}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-sm text-text-secondary">{lead.company}</div>
                    {hasScore && (
                      <div className="mt-2 flex items-center gap-2">
                        {classification ? (
                          <StatusBadge label={classification} tone={toneForClassification(classification)} />
                        ) : (
                          <span className="label-caps text-text-muted">Score record exists · not yet scored</span>
                        )}
                        {score?.rawScore != null && (
                          <span className="text-xs text-text-muted">{score.rawScore}/50 raw</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-2">
                    {hasScore && classification ? (
                      <CheckCircle2 className="h-4 w-4 text-brand-success" />
                    ) : (
                      <ClipboardList className="h-4 w-4 text-text-muted" />
                    )}
                    <ArrowRight className="h-4 w-4 text-text-muted" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-xl border border-border bg-surface p-4 text-xs text-text-muted">
        <p className="font-medium text-text-secondary mb-1">Session protocol reminders</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Read each operator question exactly as written. Do not paraphrase.</li>
          <li>Score against the behavioral anchor — not the client&apos;s preferred framing.</li>
          <li>Write a specific field note for every criterion before advancing.</li>
          <li>Do not share running scores or classification during the session.</li>
          <li>Do not give advice, recommendations, or describe Tier II/III.</li>
        </ul>
      </div>
    </div>
  );
}
