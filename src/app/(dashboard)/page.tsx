import {
  Users,
  Flame,
  DollarSign,
  FileText,
  Building2,
  AlertCircle,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { ActivityFeed } from "@/components/home/ActivityFeed";
import { QuickActions } from "@/components/home/QuickActions";
import {
  UpcomingMeetings,
  type MeetingRow,
} from "@/components/home/UpcomingMeetings";
import { ErrorState } from "@/components/ui/states";
import {
  countActiveLeads,
  countHotLeads,
  countLeadsInRange,
  getLeadNames,
} from "@/lib/notion/leads";
import { countPendingReports } from "@/lib/notion/scores";
import { sumRevenueInRange, sumRevenueThisMonth } from "@/lib/notion/revenue";
import { countAwaitingReviewBrokers } from "@/lib/notion/brokers";
import { countUnresolvedHealth } from "@/lib/notion/health";
import { recentActivity } from "@/lib/notion/activity";
import { listMeetings, type MeetingsList } from "@/lib/notion/pipeline";
import { getProductionConfig, type SystemConfig } from "@/lib/notion/config";
import { getSession } from "@/lib/auth/session";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import type { ActivityItem } from "@/lib/types/domain";

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export default async function HomePage() {
  const user = await getSession();

  // Run every read in parallel — degrade gracefully if any single one fails.
  const settled = await Promise.allSettled([
    countActiveLeads(),
    countHotLeads(),
    sumRevenueThisMonth(),
    countPendingReports(),
    countAwaitingReviewBrokers(),
    countUnresolvedHealth(),
    countLeadsInRange(7, 0),
    countLeadsInRange(14, 7),
    sumRevenueInRange(7, 0),
    sumRevenueInRange(14, 7),
    recentActivity(10),
    getProductionConfig(),
    listMeetings(),
  ]);

  const get = <T,>(idx: number, fallback: T): T => {
    const r = settled[idx];
    return r.status === "fulfilled" ? (r.value as T) : fallback;
  };

  const activeLeads = get<number>(0, 0);
  const hotLeads = get<number>(1, 0);
  const revenueMonth = get<number>(2, 0);
  const pendingReports = get<number>(3, 0);
  const brokersAwaiting = get<number>(4, 0);
  const unresolvedErrors = get<number>(5, 0);
  const newLeadsThisWeek = get<number>(6, 0);
  const newLeadsLastWeek = get<number>(7, 0);
  const revenueThisWeek = get<number>(8, 0);
  const revenueLastWeek = get<number>(9, 0);
  const activity = get<ActivityItem[]>(10, []);
  const config = get<SystemConfig | null>(11, null);
  const meetingsRaw = get<MeetingsList>(12, { upcoming: [], previous: [] });

  // Resolve lead names for meeting rows. The Pipeline rollup gives us Company,
  // but the Lead title still has to be fetched separately.
  const meetingLeadIds = [
    ...meetingsRaw.upcoming.map((m) => m.leadId),
    ...meetingsRaw.previous.map((m) => m.leadId),
  ].filter((id): id is string => !!id);
  const leadNames = meetingLeadIds.length
    ? await getLeadNames(meetingLeadIds).catch(() => new Map<string, string>())
    : new Map<string, string>();

  const enrichMeeting = (
    m: MeetingsList["upcoming"][number],
  ): MeetingRow => ({
    id: m.id,
    leadName: m.leadId ? leadNames.get(m.leadId) ?? "" : "",
    company: m.company,
    stage: m.stage,
    priority: m.priority,
    meetingDate: m.meetingDate,
  });
  const upcomingMeetings = meetingsRaw.upcoming.map(enrichMeeting);
  const previousMeetings = meetingsRaw.previous.map(enrichMeeting);

  const anyFailed = settled.some((r) => r.status === "rejected");

  return (
    <div className="space-y-8">
      {anyFailed && (
        <ErrorState
          title="Some Notion data failed to load"
          description="Showing partial data. Refresh to retry; check /health for details."
        />
      )}

      <section>
        <h2 className="label-caps mb-3 text-text-muted">Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Active Leads"
            value={formatNumber(activeLeads)}
            href="/hot-leads"
            icon={Users}
            trend={pctChange(newLeadsThisWeek, newLeadsLastWeek)}
          />
          <StatCard
            label="Hot Leads"
            value={formatNumber(hotLeads)}
            href="/hot-leads"
            icon={Flame}
            accent="warning"
            trend={null}
            trendLabel="Priority = Hot"
          />
          <StatCard
            label="Revenue This Month"
            value={formatCurrency(revenueMonth)}
            href="/revenue"
            icon={DollarSign}
            accent="success"
            trend={pctChange(revenueThisWeek, revenueLastWeek)}
          />
          <StatCard
            label="Reports Pending Review"
            value={formatNumber(pendingReports)}
            href="/scores"
            icon={FileText}
            trend={null}
            trendLabel="Awaiting HITL"
          />
          <StatCard
            label="Brokers Awaiting Review"
            value={formatNumber(brokersAwaiting)}
            href="/brokers"
            icon={Building2}
            trend={null}
            trendLabel="In queue"
          />
          <StatCard
            label="Unresolved Errors"
            value={formatNumber(unresolvedErrors)}
            href="/health"
            icon={AlertCircle}
            accent={unresolvedErrors > 0 ? "danger" : "default"}
            trend={null}
            trendLabel="System Health Log"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="label-caps mb-3 text-text-muted">Recent Activity</h2>
          <ActivityFeed items={activity} />
        </div>
        <div className="space-y-3">
          <h2 className="label-caps mb-3 text-text-muted">Quick Actions</h2>
          <UpcomingMeetings
            upcoming={upcomingMeetings}
            previous={previousMeetings}
          />
          {user && (
            <QuickActions
              role={user.role}
              initialPaused={config?.globalPause ?? false}
              initialLastPause={config?.lastPauseEvent ?? null}
              initialLastResume={config?.lastResumeEvent ?? null}
            />
          )}
        </div>
      </section>
    </div>
  );
}

// Cache the whole page server render at the route level (parents of cached() helpers).
export const revalidate = 30;
