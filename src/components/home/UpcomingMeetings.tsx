"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Building2 } from "lucide-react";
import { SlideOver } from "@/components/ui/SlideOver";
import {
  StatusBadge,
  toneForPriority,
} from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/utils/classnames";

export interface MeetingRow {
  id: string;
  leadName: string;
  company: string;
  stage: string | null;
  priority: string | null;
  meetingDate: string;
}

export function UpcomingMeetings({
  upcoming,
  previous,
}: {
  upcoming: MeetingRow[];
  previous: MeetingRow[];
}) {
  const [open, setOpen] = useState(false);
  const next = upcoming[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2.5 text-left transition hover:border-brand-primary/40 hover:bg-surface-elevated"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-info/10 text-brand-info">
            <Calendar className="h-3.5 w-3.5" />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">
              Upcoming Meetings
            </span>
            <span className="text-xs text-text-secondary">
              {upcoming.length === 0
                ? "No meetings scheduled"
                : next
                ? `Next: ${formatMeetingDate(next.meetingDate, "short")}`
                : `${upcoming.length} scheduled`}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          {upcoming.length > 0 && (
            <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs font-semibold text-white">
              {upcoming.length}
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-text-muted transition group-hover:translate-x-0.5 group-hover:text-text-primary" />
        </span>
      </button>

      <SlideOver
        open={open}
        onClose={() => setOpen(false)}
        title="Meetings"
        width="max-w-xl"
      >
        <div className="space-y-6">
          <Section
            title="Upcoming"
            count={upcoming.length}
            tone="upcoming"
            empty="Nothing on the calendar yet."
          >
            {upcoming.map((m) => (
              <MeetingCard key={m.id} meeting={m} variant="upcoming" />
            ))}
          </Section>

          <Section
            title="Previous"
            count={previous.length}
            tone="previous"
            empty="No past meetings on file."
          >
            {previous.map((m) => (
              <MeetingCard key={m.id} meeting={m} variant="previous" />
            ))}
          </Section>

          <div className="border-t border-border pt-4">
            <Link
              href="/pipeline"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-brand-info hover:underline"
            >
              Open Pipeline board →
            </Link>
          </div>
        </div>
      </SlideOver>
    </>
  );
}

function Section({
  title,
  count,
  tone,
  empty,
  children,
}: {
  title: string;
  count: number;
  tone: "upcoming" | "previous";
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="label-caps text-text-muted">{title}</h3>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            tone === "upcoming"
              ? "bg-brand-info/10 text-brand-info"
              : "bg-surface-elevated text-text-secondary",
          )}
        >
          {count}
        </span>
      </div>
      {count === 0 ? (
        <EmptyState title={empty} />
      ) : (
        <ul className="space-y-2">{children}</ul>
      )}
    </section>
  );
}

function MeetingCard({
  meeting,
  variant,
}: {
  meeting: MeetingRow;
  variant: "upcoming" | "previous";
}) {
  const isPast = variant === "previous";
  const relative = relativeTime(meeting.meetingDate);
  return (
    <li
      className={cn(
        "rounded-lg border p-3 transition",
        isPast
          ? "border-border bg-surface opacity-80"
          : "border-border bg-surface hover:border-brand-info/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={cn(
              "truncate text-sm font-medium",
              isPast ? "text-text-secondary" : "text-text-primary",
            )}
          >
            {meeting.leadName ||
              meeting.company ||
              meeting.id.slice(0, 8)}
          </div>
          {meeting.company && meeting.leadName && (
            <div className="flex items-center gap-1 truncate text-xs text-text-secondary">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{meeting.company}</span>
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div
            className={cn(
              "whitespace-nowrap text-xs font-medium",
              isPast ? "text-text-muted" : "text-brand-info",
            )}
          >
            {formatMeetingDate(meeting.meetingDate, "long")}
          </div>
          {relative && (
            <div className="mt-0.5 text-xs text-text-muted">{relative}</div>
          )}
        </div>
      </div>

      {(meeting.stage || meeting.priority) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {meeting.priority && (
            <StatusBadge
              label={meeting.priority}
              tone={toneForPriority(meeting.priority)}
            />
          )}
          {meeting.stage && (
            <span className="label-caps text-text-muted">{meeting.stage}</span>
          )}
        </div>
      )}
    </li>
  );
}

function formatMeetingDate(iso: string, mode: "short" | "long"): string {
  const d = new Date(iso);
  const hasTime = !iso.endsWith("Z") || /T\d{2}:\d{2}/.test(iso);
  // Notion sends dates either as "YYYY-MM-DD" (no time) or full ISO.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);

  if (mode === "short") {
    if (dateOnly) {
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (dateOnly || !hasTime) {
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function relativeTime(iso: string): string | null {
  const d = new Date(iso);
  const ms = d.getTime() - Date.now();
  const dayMs = 86_400_000;
  const days = Math.round(ms / dayMs);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 0 && days < 14) return `in ${days} days`;
  if (days < 0 && days > -14) return `${Math.abs(days)}d ago`;
  return null;
}
