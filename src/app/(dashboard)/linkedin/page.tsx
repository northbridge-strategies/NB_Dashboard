import {
  listOutreach,
  listOutreachNeedingAttention,
} from "@/lib/notion/linkedin";
import { ErrorState } from "@/components/ui/states";
import { LinkedInTabs, type OutreachRow } from "./_LinkedInTabs";
import { daysBetween } from "@/lib/utils/dates";

export const revalidate = 30;

function toRow(o: Awaited<ReturnType<typeof listOutreach>>[number]): OutreachRow {
  return {
    id: o.id,
    contactName: o.contactName,
    company: o.company,
    linkedinUrl: o.linkedinUrl,
    stage: o.stage,
    draftDM: o.draftDM,
    hitlAction: o.hitlAction,
    lastMessageDate: o.lastMessageDate,
    hitlActionDate: o.hitlActionDate,
    isStale:
      o.hitlAction === "Pending" &&
      !!o.hitlActionDate &&
      daysBetween(o.hitlActionDate) >= 1,
  };
}

export default async function LinkedInPage() {
  const [allR, attentionR] = await Promise.allSettled([
    listOutreach(),
    listOutreachNeedingAttention(),
  ]);

  if (allR.status === "rejected") {
    return (
      <ErrorState
        title="LinkedIn Outreach failed to load"
        description={(allR.reason as Error)?.message}
      />
    );
  }

  const all = allR.value.map(toRow);
  const attention =
    attentionR.status === "fulfilled" ? attentionR.value.map(toRow) : [];

  return <LinkedInTabs all={all} attention={attention} />;
}
