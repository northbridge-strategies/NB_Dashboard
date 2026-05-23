import { AlertTriangle } from "lucide-react";
import { listManualReviewScores } from "@/lib/notion/scores";
import { listAllLeads } from "@/lib/notion/leads";
import { ErrorState } from "@/components/ui/states";
import { ManualReviewTable, type ManualReviewRow } from "./_ManualReviewTable";

export const revalidate = 30;

export default async function ManualReviewPage() {
  const [scoresR, leadsR] = await Promise.allSettled([
    listManualReviewScores(),
    listAllLeads(),
  ]);

  if (scoresR.status === "rejected") {
    return (
      <ErrorState
        title="Manual Review failed to load"
        description={(scoresR.reason as Error)?.message}
      />
    );
  }

  const scores = scoresR.value;
  const leads = leadsR.status === "fulfilled" ? leadsR.value : [];
  const leadById = new Map(leads.map((l) => [l.id, l]));

  const rows: ManualReviewRow[] = scores.map((s) => {
    const lead = s.leadId ? leadById.get(s.leadId) : undefined;
    return {
      id: s.id,
      leadName: lead?.name ?? s.title ?? "—",
      company: lead?.company ?? "",
      scorePct: s.scorePct,
      classification: s.classification,
      reportDraftUrl: s.reportDraftUrl,
      lastEditedTime: s.lastEditedTime,
      manualReviewNotes: s.manualReviewNotes,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-brand-warning/40 bg-brand-warning/10 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-brand-warning" />
        <div>
          <div className="text-sm font-semibold text-text-primary">
            Nothing exits this queue automatically
          </div>
          <div className="mt-0.5 text-xs text-text-secondary">
            Review each item manually. Notes you save here are written to the
            <span className="font-mono"> Manual Review Notes</span> property on the Diagnostic Score record.
          </div>
        </div>
      </div>

      <ManualReviewTable rows={rows} />
    </div>
  );
}
