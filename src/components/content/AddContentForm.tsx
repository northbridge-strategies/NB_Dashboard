"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAction } from "@/lib/hooks/useAction";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const TYPES = ["LinkedIn Post", "Substack Article", "Video Script", "Ad Copy"] as const;
const STATUSES = ["Draft", "Ready to Publish", "Published", "Archived"] as const;
const PLATFORMS = ["LinkedIn", "Substack", "YouTube", "Other"] as const;

export function AddContentForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState<(typeof TYPES)[number] | "">("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Draft");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number] | "">("");
  const [publishDate, setPublishDate] = useState("");
  const [utmLink, setUtmLink] = useState("");
  const action = useAction();

  function reset() {
    setTitle("");
    setTopic("");
    setContentType("");
    setStatus("Draft");
    setPlatform("");
    setPublishDate("");
    setUtmLink("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-hover"
      >
        <Plus className="h-4 w-4" />
        Add Content
      </button>

      <ConfirmDialog
        open={open}
        title="Add Content"
        confirmLabel="Create"
        pending={action.state === "pending"}
        onCancel={() => {
          setOpen(false);
          reset();
        }}
        onConfirm={async () => {
          if (!title.trim()) return;
          const r = await action.run("/api/content", {
            body: {
              title: title.trim(),
              topic: topic.trim() || undefined,
              contentType: contentType || undefined,
              status,
              platform: platform || undefined,
              publishDate: publishDate || null,
              utmLink: utmLink || null,
            },
          });
          if (r.ok) {
            setOpen(false);
            reset();
          }
        }}
      >
        <div className="space-y-3">
          <Field label="Title" required>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </Field>
          <Field label="Topic">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Content Type">
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as typeof contentType)}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="">Select…</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Platform">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as typeof platform)}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="">Select…</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Publish Date">
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </Field>
          </div>
          <Field label="UTM Link">
            <input
              type="url"
              value={utmLink}
              onChange={(e) => setUtmLink(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </Field>
        </div>
      </ConfirmDialog>
    </>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="label-caps mb-1.5 block text-text-secondary">
        {label}
        {required && <span className="ml-1 text-brand-danger">*</span>}
      </span>
      {children}
    </label>
  );
}
