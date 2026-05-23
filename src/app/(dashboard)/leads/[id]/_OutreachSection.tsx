import { Linkedin } from "lucide-react";
import {
  StatusBadge,
  toneForHITL,
} from "@/components/ui/StatusBadge";
import { SectionCard, EmptySection } from "./_SectionCard";
import { formatRelative } from "@/lib/utils/dates";
import type { OutreachEntry } from "@/lib/notion/linkedin";

export function OutreachSection({
  entries,
  leadId: _leadId,
}: {
  entries: OutreachEntry[];
  leadId: string;
}) {
  if (entries.length === 0) {
    // LinkedIn outreach is uncommon — only show empty state when there's data.
    // For most leads, hide entirely.
    return null;
  }

  return (
    <SectionCard
      icon={Linkedin}
      title="LinkedIn Outreach"
      count={entries.length}
      tone="info"
    >
      <ul className="space-y-2">
        {entries.map((o) => (
          <li
            key={o.id}
            className="rounded-lg border border-border bg-bg/40 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-text-primary">
                {o.contactName}
              </span>
              {o.company && (
                <span className="text-xs text-text-secondary">
                  · {o.company}
                </span>
              )}
              {o.stage && <StatusBadge label={o.stage} tone="info" />}
              {o.hitlAction && (
                <StatusBadge
                  label={o.hitlAction}
                  tone={toneForHITL(o.hitlAction)}
                />
              )}
              {o.lastMessageDate && (
                <span className="ml-auto text-xs text-text-muted">
                  {formatRelative(o.lastMessageDate)}
                </span>
              )}
            </div>
            {o.draftDM && (
              <p className="mt-2 line-clamp-3 text-xs text-text-secondary">
                {o.draftDM}
              </p>
            )}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

// Default export to satisfy any potential expectations; not used directly.
export default OutreachSection;

// Empty section helper if needed by route
export { EmptySection };
