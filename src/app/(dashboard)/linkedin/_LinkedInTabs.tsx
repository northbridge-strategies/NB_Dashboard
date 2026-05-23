"use client";

import { Linkedin } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge, toneForHITL } from "@/components/ui/StatusBadge";
import { OutreachActions } from "@/components/linkedin/OutreachActions";
import { formatRelative } from "@/lib/utils/dates";

export interface OutreachRow {
  id: string;
  contactName: string;
  company: string;
  linkedinUrl: string | null;
  stage: string | null;
  draftDM: string;
  hitlAction: string | null;
  lastMessageDate: string | null;
  hitlActionDate: string | null;
  isStale: boolean;
}

function buildColumns(showActions: boolean): Column<OutreachRow>[] {
  const cols: Column<OutreachRow>[] = [
    {
      key: "contact",
      header: "Contact",
      sort: (r) => r.contactName.toLowerCase(),
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{r.contactName || "—"}</div>
          {r.company && (
            <div className="truncate text-xs text-text-secondary">{r.company}</div>
          )}
        </div>
      ),
    },
    {
      key: "linkedin",
      header: "LinkedIn",
      width: "w-20",
      hideOnMobile: true,
      render: (r) =>
        r.linkedinUrl ? (
          <a
            href={r.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-brand-info hover:underline"
            aria-label="Open LinkedIn profile"
            title={r.linkedinUrl}
          >
            <Linkedin className="h-4 w-4" />
          </a>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "stage",
      header: "Stage",
      sort: (r) => r.stage ?? "",
      render: (r) =>
        r.stage ? (
          <StatusBadge label={r.stage} tone="info" />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "draft",
      header: "Draft DM",
      hideOnTablet: true,
      render: (r) =>
        r.draftDM ? (
          <span className="line-clamp-2 max-w-md text-xs text-text-secondary">
            {r.draftDM}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "hitl",
      header: "HITL",
      sort: (r) => r.hitlAction ?? "",
      render: (r) =>
        r.hitlAction ? (
          <StatusBadge label={r.hitlAction} tone={toneForHITL(r.hitlAction)} />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "lastMessage",
      header: "Last Message",
      sort: (r) => r.lastMessageDate ?? "",
      hideOnMobile: true,
      render: (r) =>
        r.lastMessageDate ? (
          formatRelative(r.lastMessageDate)
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
  ];

  if (showActions) {
    cols.push({
      key: "actions",
      header: "",
      width: "w-32",
      render: (r) =>
        r.hitlAction === "Pending" ? (
          <OutreachActions id={r.id} initialDM={r.draftDM} />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    });
  }

  return cols;
}

export function LinkedInTabs({
  all,
  attention,
}: {
  all: OutreachRow[];
  attention: OutreachRow[];
}) {
  return (
    <Tabs
      defaultTab={attention.length > 0 ? "attention" : "all"}
      tabs={[
        {
          id: "attention",
          label: "Needs Attention",
          count: attention.length,
          content: (
            <div className="space-y-3">
              {attention.some((a) => a.isStale) && (
                <div className="rounded-md border border-brand-warning/40 bg-brand-warning/10 px-4 py-3 text-xs text-text-primary">
                  Some pending drafts are over 24 hours old — highlighted in amber below.
                </div>
              )}
              <DataTable
                rows={attention}
                columns={buildColumns(true)}
                searchable={(r) => `${r.contactName} ${r.company}`}
                searchPlaceholder="Search contact or company…"
                emptyTitle="Nothing needs attention"
                emptyDescription="When a draft is awaiting approval or a contact has replied, it will show up here."
                rowKey={(r) => r.id}
              />
            </div>
          ),
        },
        {
          id: "all",
          label: "All Outreach",
          count: all.length,
          content: (
            <DataTable
              rows={all}
              columns={buildColumns(false)}
              searchable={(r) => `${r.contactName} ${r.company}`}
              searchPlaceholder="Search contact or company…"
              emptyTitle="No outreach yet"
            />
          ),
        },
      ]}
    />
  );
}

