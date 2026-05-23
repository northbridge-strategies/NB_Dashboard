// Cross-cutting domain types shared by per-DB Notion modules and UI components.

export type Classification =
  | "Founder-Dependent"
  | "Transitional"
  | "Stabilized"
  | "Transfer-Ready";

export type Priority = "Hot" | "Warm" | "Cold";

export type LifecycleState =
  | "Lead"
  | "Qualified"
  | "Engaged"
  | "Paid"
  | "Active"
  | "Complete"
  | "Closed Lost";

export type HITLAction =
  | "Pending"
  | "Approved"
  | "Edited-Approved"
  | "Rejected-Manual Review";

export type Severity = "Critical" | "Warning" | "Info";

export type PipelineStage =
  | "New Lead"
  | "Qualifier Completed"
  | "Email Sequence Active"
  | "Call Booked"
  | "Call Completed"
  | "Follow-Up Sent"
  | "Tier I Paid"
  | "Report In Progress"
  | "Report Delivered"
  | "Tier II Discussion"
  | "Closed Won"
  | "Closed Lost"
  | "Not Qualified"
  | "Manual Review";

/** Stages shown on the Kanban board by default (per spec). */
export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  "New Lead",
  "Qualifier Completed",
  "Email Sequence Active",
  "Call Booked",
  "Call Completed",
  "Follow-Up Sent",
  "Tier I Paid",
  "Report In Progress",
  "Report Delivered",
  "Closed Won",
  "Closed Lost",
];

/** Additional stages revealed by the "Show all stages" toggle. */
export const EXTRA_PIPELINE_STAGES: PipelineStage[] = [
  "Tier II Discussion",
  "Not Qualified",
  "Manual Review",
];

export const ALL_PIPELINE_STAGES: PipelineStage[] = [
  ...DEFAULT_PIPELINE_STAGES,
  ...EXTRA_PIPELINE_STAGES,
];

export type ActivitySource = "lead" | "score" | "pipeline" | "revenue" | "linkedin";

export interface ActivityItem {
  source: ActivitySource;
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  href: string;
}
