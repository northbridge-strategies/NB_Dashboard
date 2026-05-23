import { KanbanBoard, type KanbanLeadInfo } from "@/components/pipeline/KanbanBoard";
import { ErrorState } from "@/components/ui/states";
import { listPipeline } from "@/lib/notion/pipeline";
import { listAllLeads } from "@/lib/notion/leads";
import { listScores } from "@/lib/notion/scores";

export const revalidate = 30;

export default async function PipelinePage() {
  const [entriesR, leadsR, scoresR] = await Promise.allSettled([
    listPipeline(),
    listAllLeads(),
    listScores(),
  ]);

  if (entriesR.status === "rejected") {
    return (
      <ErrorState
        title="Pipeline failed to load"
        description="Could not fetch from Notion. Try refreshing."
      />
    );
  }

  const entries = entriesR.value;
  const leads = leadsR.status === "fulfilled" ? leadsR.value : [];
  const scores = scoresR.status === "fulfilled" ? scoresR.value : [];

  // Latest score per lead (Diagnostic Scores has at most one current per lead, but be safe)
  const latestScoreByLead = new Map<string, (typeof scores)[number]>();
  for (const s of scores) {
    if (!s.leadId) continue;
    const prev = latestScoreByLead.get(s.leadId);
    if (!prev || (s.lastEditedTime > prev.lastEditedTime)) {
      latestScoreByLead.set(s.leadId, s);
    }
  }

  const leadById = new Map<string, KanbanLeadInfo>();
  for (const lead of leads) {
    const score = latestScoreByLead.get(lead.id);
    leadById.set(lead.id, {
      name: lead.name,
      company: lead.company,
      scorePct: score?.scorePct ?? null,
      classification: score?.classification ?? null,
      email: lead.email,
      phone: lead.phone,
      industry: lead.industry,
      lifecycleState: lead.lifecycleState,
    });
  }

  return <KanbanBoard entries={entries} leadById={leadById} />;
}
