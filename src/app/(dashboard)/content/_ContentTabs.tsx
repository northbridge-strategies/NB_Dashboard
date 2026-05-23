"use client";

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge, type BadgeTone } from "@/components/ui/StatusBadge";
import { AddContentForm } from "@/components/content/AddContentForm";
import { EmptyState } from "@/components/ui/states";
import type { ContentItem, ContentStatus } from "@/lib/notion/content";

const STATUS_ORDER: ContentStatus[] = [
  "Draft",
  "Ready to Publish",
  "Published",
  "Archived",
];

const STATUS_TONE: Record<ContentStatus, BadgeTone> = {
  Draft: "muted",
  "Ready to Publish": "warning",
  Published: "success",
  Archived: "neutral",
};

function listColumns(): Column<ContentItem>[] {
  return [
    {
      key: "title",
      header: "Title",
      sort: (r) => r.title.toLowerCase(),
      render: (r) => <span className="font-medium">{r.title || "—"}</span>,
    },
    {
      key: "type",
      header: "Type",
      sort: (r) => r.contentType ?? "",
      render: (r) =>
        r.contentType ? (
          <StatusBadge label={r.contentType} tone="info" />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sort: (r) => r.status ?? "",
      render: (r) =>
        r.status ? (
          <StatusBadge label={r.status} tone={STATUS_TONE[r.status]} />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "platform",
      header: "Platform",
      sort: (r) => r.platform ?? "",
      render: (r) =>
        r.platform ? r.platform : <span className="text-text-muted">—</span>,
    },
    {
      key: "publish",
      header: "Publish Date",
      sort: (r) => r.publishDate ?? "",
      render: (r) =>
        r.publishDate ? (
          new Date(r.publishDate).toLocaleDateString()
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "utm",
      header: "Link",
      width: "w-16",
      render: (r) =>
        r.utmLink ? (
          <a
            href={r.utmLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-brand-info hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "engagement",
      header: "Engagement Notes",
      render: (r) =>
        r.engagementNotes ? (
          <span className="line-clamp-1 max-w-md text-xs text-text-secondary">
            {r.engagementNotes}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
  ];
}

export function ContentTabs({ items }: { items: ContentItem[] }) {
  const grouped = useMemo(() => {
    const map = new Map<ContentStatus, ContentItem[]>();
    for (const s of STATUS_ORDER) map.set(s, []);
    for (const item of items) {
      if (!item.status) continue;
      map.get(item.status)?.push(item);
    }
    return map;
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">
          Manage Doug&apos;s LinkedIn posts, Substack articles, and other content.
        </p>
        <AddContentForm />
      </div>

      <Tabs
        tabs={[
          {
            id: "board",
            label: "Board",
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {STATUS_ORDER.map((status) => {
                  const cards = grouped.get(status) ?? [];
                  return (
                    <div
                      key={status}
                      className="flex flex-col rounded-xl border border-border bg-bg/40"
                    >
                      <div className="flex items-center justify-between border-b border-border px-3 py-2">
                        <span className="text-sm font-medium text-text-primary">
                          {status}
                        </span>
                        <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs text-text-secondary">
                          {cards.length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 p-2">
                        {cards.length === 0 ? (
                          <div className="px-2 py-6 text-center text-xs text-text-muted">
                            —
                          </div>
                        ) : (
                          cards.map((c) => (
                            <div
                              key={c.id}
                              className="rounded-lg border border-border bg-surface p-3"
                            >
                              <div className="truncate text-sm font-medium text-text-primary">
                                {c.title || "(untitled)"}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                {c.contentType && (
                                  <StatusBadge label={c.contentType} tone="info" />
                                )}
                                {c.platform && (
                                  <span className="label-caps text-text-muted">
                                    {c.platform}
                                  </span>
                                )}
                              </div>
                              {c.publishDate && (
                                <div className="mt-2 text-xs text-text-secondary">
                                  {new Date(c.publishDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ),
          },
          {
            id: "list",
            label: "List",
            count: items.length,
            content:
              items.length === 0 ? (
                <EmptyState title="No content yet" description="Click Add Content to create your first item." />
              ) : (
                <DataTable
                  rows={items}
                  columns={listColumns()}
                  searchable={(r) => `${r.title} ${r.topic}`}
                  searchPlaceholder="Search title or topic…"
                />
              ),
          },
        ]}
      />
    </div>
  );
}
