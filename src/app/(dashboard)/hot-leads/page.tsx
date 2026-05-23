import { Flame } from "lucide-react";
import { listHotLeads } from "@/lib/notion/leads";
import { listScores } from "@/lib/notion/scores";
import { ErrorState } from "@/components/ui/states";
import { HotLeadsTable, type HotLeadRow } from "./_HotLeadsTable";
import { daysBetween } from "@/lib/utils/dates";

export const revalidate = 30;

export default async function HotLeadsPage() {
  const [leadsR, scoresR] = await Promise.allSettled([listHotLeads(), listScores()]);

  if (leadsR.status === "rejected") {
    return (
      <ErrorState
        title="Hot Leads failed to load"
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

  const rows: HotLeadRow[] = leads.map((l) => {
    const s = scoreByLead.get(l.id);
    const refDate = l.lastContacted ?? l.lastActivityDate;
    return {
      id: l.id,
      name: l.name,
      company: l.company,
      scorePct: s?.scorePct ?? null,
      classification: s?.classification ?? null,
      phone: l.phone,
      email: l.email,
      source: l.source,
      lastActivityDate: l.lastActivityDate,
      daysSinceContact: refDate ? daysBetween(refDate) : null,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-brand-accent/40 bg-brand-accent/10 p-4">
        <Flame className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent" />
        <div>
          <div className="text-sm font-semibold text-text-primary">
            Check this first every morning
          </div>
          <div className="mt-0.5 text-xs text-text-secondary">
            These leads have Priority = Hot via the Pipeline rollup. Sort by
            &ldquo;Last Activity&rdquo; or &ldquo;Days since contact&rdquo; to
            triage.
          </div>
        </div>
      </div>

      <HotLeadsTable rows={rows} />
    </div>
  );
}
