import "server-only";
import { cached, TAG } from "./cache";
import { recentLeadActivity } from "./leads";
import { recentScoreActivity } from "./scores";
import { recentPipelineActivity } from "./pipeline";
import { recentRevenueActivity } from "./revenue";
import { recentOutreachActivity } from "./linkedin";
import type { ActivityItem } from "@/lib/types/domain";

/**
 * Aggregated recent-activity feed across the 5 lead-relevant DBs.
 * Each source returns its top-N most-recently-edited records; we merge,
 * sort by timestamp desc, and slice.
 */
export const recentActivity = cached(
  async (limit = 10): Promise<ActivityItem[]> => {
    const results = await Promise.allSettled([
      recentLeadActivity(limit),
      recentScoreActivity(limit),
      recentPipelineActivity(limit),
      recentRevenueActivity(limit),
      recentOutreachActivity(limit),
    ]);
    const merged: ActivityItem[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") merged.push(...r.value);
      // Failed source is silently dropped — feed degrades gracefully.
    }
    merged.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return merged.slice(0, limit);
  },
  ["activity:recent"],
  {
    tags: [
      TAG.activity,
      TAG.leads,
      TAG.scores,
      TAG.pipeline,
      TAG.revenue,
      TAG.linkedin,
    ],
  },
);
