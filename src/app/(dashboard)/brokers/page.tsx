import {
  listAllBrokers,
  listAwaitingReviewBrokers,
} from "@/lib/notion/brokers";
import { ErrorState } from "@/components/ui/states";
import { BrokersTable, type BrokerRow } from "./_BrokersTable";

export const revalidate = 30;

export default async function BrokersPage({
  searchParams,
}: {
  searchParams?: { all?: string };
}) {
  const showAll = searchParams?.all === "1";

  const r = await Promise.allSettled([
    showAll ? listAllBrokers() : listAwaitingReviewBrokers(),
  ]);
  if (r[0].status === "rejected") {
    return (
      <ErrorState
        title="Brokers failed to load"
        description={(r[0].reason as Error)?.message}
      />
    );
  }

  const rows: BrokerRow[] = r[0].value.map((b) => ({
    id: b.id,
    listingTitle: b.listingTitle,
    askingPrice: b.askingPrice,
    industry: b.industry,
    location: b.location,
    ownerDependencySignals: b.ownerDependencySignals,
    brokerName: b.brokerName,
    brokerLinkedInUrl: b.brokerLinkedInUrl,
    dateDiscovered: b.dateDiscovered,
    source: b.source,
    status: b.status,
    approvedByDoug: b.approvedByDoug,
  }));

  return <BrokersTable rows={rows} showAll={showAll} />;
}
