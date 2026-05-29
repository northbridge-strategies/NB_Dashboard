import { listAllLeads } from "@/lib/notion/leads";
import { listRevenue } from "@/lib/notion/revenue";
import { ErrorState } from "@/components/ui/states";
import { ChannelsTable, type ChannelRow } from "./_ChannelsTable";

export const revalidate = 30;

export default async function ChannelsPage({
  searchParams,
}: {
  searchParams?: { range?: string };
}) {
  const range = (searchParams?.range as "7" | "30" | "90" | "all") ?? "all";

  const [leadsR, revR] = await Promise.allSettled([listAllLeads(), listRevenue()]);
  if (leadsR.status === "rejected") {
    return (
      <ErrorState
        title="Channels failed to load"
        description={(leadsR.reason as Error)?.message}
      />
    );
  }

  const leads = leadsR.value;
  const revenue = revR.status === "fulfilled" ? revR.value : [];

  // Filter leads by date range based on createdTime
  const cutoff =
    range === "all"
      ? null
      : new Date(Date.now() - parseInt(range, 10) * 86_400_000).toISOString();

  const leadsInRange = cutoff ? leads.filter((l) => l.createdTime >= cutoff) : leads;

  // Build per-channel buckets keyed by Traffic Source
  type Bucket = {
    channel: string;
    leadIds: Set<string>;
    qualified: number;
    paid: number;
    revenue: number;
  };
  const channels = new Map<string, Bucket>();
  for (const lead of leadsInRange) {
    const key = lead.trafficSource ?? "Unknown";
    const b = channels.get(key) ?? {
      channel: key,
      leadIds: new Set(),
      qualified: 0,
      paid: 0,
      revenue: 0,
    };
    b.leadIds.add(lead.id);
    if (lead.lifecycleState && lead.lifecycleState !== "Lead") b.qualified += 1;
    if (lead.lifecycleState === "Paid" || lead.lifecycleState === "Active") b.paid += 1;
    channels.set(key, b);
  }

  // Add revenue per channel — match revenue records via Lead relation
  const leadById = new Map(leads.map((l) => [l.id, l]));
  for (const r of revenue) {
    if (r.status !== "Paid" || !r.leadId) continue;
    const lead = leadById.get(r.leadId);
    if (!lead) continue;
    if (cutoff && (r.paymentDate ?? r.lastEditedTime) < cutoff) continue;
    const channel = lead.trafficSource ?? "Unknown";
    const b = channels.get(channel);
    if (b) b.revenue += r.amount ?? 0;
  }

  const maxLeads = Math.max(1, ...Array.from(channels.values()).map((b) => b.leadIds.size));

  const rows: ChannelRow[] = Array.from(channels.values())
    .map((b) => {
      const total = b.leadIds.size;
      return {
        channel: b.channel,
        totalLeads: total,
        qualified: b.qualified,
        paid: b.paid,
        revenue: b.revenue,
        conversionRate: total > 0 ? (b.paid / total) * 100 : 0,
        relativeFill: (b.leadIds.size / maxLeads) * 100,
        cpl: null,
        cpa: null,
      };
    })
    .sort((a, b) => b.totalLeads - a.totalLeads);

  return <ChannelsTable rows={rows} range={range} />;
}
