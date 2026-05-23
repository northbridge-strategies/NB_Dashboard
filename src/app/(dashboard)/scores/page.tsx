import { listScores } from "@/lib/notion/scores";
import { listAllLeads } from "@/lib/notion/leads";
import { ErrorState } from "@/components/ui/states";
import { ScoresTable, type ScoreRow } from "./_ScoresTable";

export const revalidate = 30;

export default async function ScoresPage() {
  const [scoresR, leadsR] = await Promise.allSettled([listScores(), listAllLeads()]);
  if (scoresR.status === "rejected") {
    return (
      <ErrorState
        title="Diagnostic Scores failed to load"
        description={(scoresR.reason as Error)?.message}
      />
    );
  }

  const scores = scoresR.value;
  const leads = leadsR.status === "fulfilled" ? leadsR.value : [];
  const leadById = new Map(leads.map((l) => [l.id, l]));

  const rows: ScoreRow[] = scores.map((s) => {
    const lead = s.leadId ? leadById.get(s.leadId) : undefined;
    return {
      id: s.id,
      leadId: s.leadId,
      leadName: lead?.name ?? s.title ?? "—",
      company: lead?.company ?? "",
      rawScore: s.rawScore,
      scorePct: s.scorePct,
      classification: s.classification,
      authority: s.authority,
      process: s.process,
      pricing: s.pricing,
      revenue: s.revenue,
      financial: s.financial,
      flags: s.flags,
      manualReviewNotes: s.manualReviewNotes,
      reportDraftGenerated: s.reportDraftGenerated,
      reportDraftUrl: s.reportDraftUrl,
      hitlAction: s.hitlAction,
      dateCompleted: s.dateCompleted,
    };
  });

  return <ScoresTable rows={rows} />;
}
