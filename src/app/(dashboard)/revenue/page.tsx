import { listRevenue } from "@/lib/notion/revenue";
import { listAllLeads } from "@/lib/notion/leads";
import { ErrorState } from "@/components/ui/states";
import { RevenueTabs } from "./_RevenueTabs";

export const revalidate = 30;

export default async function RevenuePage() {
  const [revR, leadsR] = await Promise.allSettled([listRevenue(), listAllLeads()]);

  if (revR.status === "rejected") {
    return (
      <ErrorState
        title="Revenue failed to load"
        description={(revR.reason as Error)?.message}
      />
    );
  }

  const revenue = revR.value;
  const leads = leadsR.status === "fulfilled" ? leadsR.value : [];
  const leadNameById = new Map(leads.map((l) => [l.id, l.name]));

  // Aggregate by Month (YYYY-MM)
  const byMonth = new Map<string, { month: string; count: number; total: number }>();
  for (const r of revenue) {
    if (r.status !== "Paid") continue;
    const key = r.month || (r.paymentDate ? r.paymentDate.slice(0, 7) : "—");
    if (!key) continue;
    const cur = byMonth.get(key) ?? { month: key, count: 0, total: 0 };
    cur.count += 1;
    cur.total += r.amount ?? 0;
    byMonth.set(key, cur);
  }
  const monthlyRows = Array.from(byMonth.values()).sort((a, b) =>
    a.month.localeCompare(b.month),
  );

  const grandTotal = revenue
    .filter((r) => r.status === "Paid")
    .reduce((acc, r) => acc + (r.amount ?? 0), 0);

  // Qualified = any lead past the "Lead" lifecycle state
  const qualifiedLeads = leads.filter(
    (l) => l.lifecycleState && l.lifecycleState !== "Lead",
  ).length;

  return (
    <RevenueTabs
      payments={revenue.map((r) => ({
        id: r.id,
        leadName: r.leadId ? leadNameById.get(r.leadId) ?? "—" : "—",
        service: r.service,
        amount: r.amount,
        paymentDate: r.paymentDate,
        stripePaymentId: r.stripePaymentId,
        status: r.status,
      }))}
      monthly={monthlyRows}
      grandTotal={grandTotal}
      qualifiedLeads={qualifiedLeads}
    />
  );
}
