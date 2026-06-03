import { notFound } from "next/navigation";
import { notion } from "@/lib/notion/client";
import { isFullPage } from "@/lib/notion/parsers";
import { parseScore } from "@/lib/notion/scores";
import { listCriteria, listResponsesForEngagement } from "@/lib/notion/tier1";
import { getLead } from "@/lib/notion/leads";
import { ErrorState } from "@/components/ui/states";
import { DB } from "@/lib/notion/ids";
import { ScoringPanel } from "./_ScoringPanel";

export const dynamic = "force-dynamic";

export default async function ScoringSessionPage({
  params,
}: {
  params: { scoreId: string };
}) {
  if (!DB.tier1Criteria || !DB.tier1Responses) {
    return (
      <ErrorState
        title="Tier I databases not configured"
        description="Run /api/tier1/setup to create the databases, then add the IDs to Vercel env vars."
      />
    );
  }

  // Load score record to get lead info
  const scorePage = await notion.pages.retrieve({ page_id: params.scoreId }).catch(() => null);
  if (!scorePage || !isFullPage(scorePage)) notFound();

  const score = parseScore(scorePage);
  const lead = score.leadId ? await getLead(score.leadId).catch(() => null) : null;

  const [criteria, responses] = await Promise.all([
    listCriteria().catch(() => []),
    listResponsesForEngagement(params.scoreId).catch(() => []),
  ]);

  if (criteria.length === 0) {
    return (
      <ErrorState
        title="No criteria found"
        description="The Tier I Criteria database appears to be empty. Run /api/tier1/setup to seed the 25 criteria."
      />
    );
  }

  return (
    <ScoringPanel
      scoreId={params.scoreId}
      leadId={score.leadId ?? ""}
      leadName={lead?.name ?? "(unnamed)"}
      companyName={lead?.company ?? ""}
      criteria={criteria}
      initialResponses={responses}
    />
  );
}
