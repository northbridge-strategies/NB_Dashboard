import { Users } from "lucide-react";
import { listAllLeads } from "@/lib/notion/leads";
import { listScores } from "@/lib/notion/scores";
import { ErrorState } from "@/components/ui/states";
import { AllLeadsTable, type AllLeadRow } from "./_AllLeadsTable";
import { daysBetween } from "@/lib/utils/dates";

export const revalidate = 30;

export default async function LeadsPage() {
  const [leadsR, scoresR] = await Promise.allSettled([
    listAllLeads(),
    listScores(),
  ]);

  if (leadsR.status === "rejected") {
    return (
      <ErrorState
        title="Leads failed to load"
        description={(leadsR.reason as Error)?.message}
      />
    );
  }

  const leads = leadsR.value;
  const scores = scoresR.status === "fulfilled" ? scoresR.value : [];

  const scoreByLead = new Map<string, (typeof scores)[number]>();
  for (const s of scores) {
    if (!s.leadId) continue;
    const prev = scoreByLead.get(s.leadId);
    if (!prev || s.lastEditedTime > prev.lastEditedTime) scoreByLead.set(s.leadId, s);
  }

  const rows: AllLeadRow[] = leads.map((l) => {
    const s = scoreByLead.get(l.id);
    const refDate = l.lastContacted ?? l.lastActivityDate;
    return {
      id: l.id,
      name: l.name,
      company: l.company,
      email: l.email,
      phone: l.phone,
      industry: l.industry,
      lifecycleState: l.lifecycleState,
      source: l.source,
      priority: l.priority,
      classification: s?.classification ?? null,
      scorePct: s?.scorePct ?? null,
      lastActivityDate: l.lastActivityDate,
      daysSinceContact: refDate ? daysBetween(refDate) : null,
      createdTime: l.createdTime,
    };
  });

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
          <Users className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-text-primary">All Leads</h2>
          <p className="text-xs text-text-secondary">
            Every lead in the system. Click a row for the full Lead 360° view.
          </p>
        </div>
        <span className="ml-auto rounded-full bg-surface-elevated px-2.5 py-0.5 text-xs font-medium text-text-secondary">
          {rows.length} total
        </span>
      </header>

      <AllLeadsTable rows={rows} />
    </div>
  );
}
