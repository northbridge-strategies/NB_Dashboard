"use client";

import { useState } from "react";
import { Save, Loader2, ImageIcon } from "lucide-react";
import { useAction } from "@/lib/hooks/useAction";
import {
  StatusBadge,
  toneForLifecycle,
} from "@/components/ui/StatusBadge";
import { formatRelative } from "@/lib/utils/dates";

export interface ProfileInitial {
  name: string;
  email: string;
  role: "Admin" | "Staff" | "Client";
  avatarUrl: string | null;
  createdTime: string;
  lastSignIn: string | null;
}

function initials(name: string, email: string): string {
  const src = (name || email).trim();
  return (
    src
      .split(/\s+|@|\./)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const [name, setName] = useState(initial.name);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? "");
  const action = useAction();

  const dirty = name !== initial.name || (avatarUrl || null) !== initial.avatarUrl;

  async function save() {
    if (!dirty) return;
    await action.run("/api/profile", {
      method: "PATCH",
      body: {
        name: name.trim() || initial.name,
        avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
      },
    });
  }

  const previewSrc = avatarUrl.trim() || null;

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <h3 className="text-sm font-semibold text-text-primary">Account info</h3>

      <div className="mt-5 flex items-start gap-5">
        {/* Avatar preview */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-20 w-20 overflow-hidden rounded-full">
            {previewSrc ? (
              // Use a plain <img> for arbitrary remote URLs — Next/Image
              // requires the host to be in next.config remotePatterns.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt={name || initial.email}
                className="h-20 w-20 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary text-xl font-semibold text-white">
                {initials(name, initial.email)}
              </div>
            )}
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </Field>

          <Field label="Email">
            <input
              value={initial.email}
              readOnly
              className="w-full cursor-not-allowed rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text-secondary"
            />
          </Field>

          <Field label="Role" hint="Admin only — managed in Settings.">
            <div className="pt-2">
              <StatusBadge label={initial.role} tone={toneForLifecycle(initial.role)} />
            </div>
          </Field>

          <Field
            label="Last Sign-In"
            hint={initial.lastSignIn ? new Date(initial.lastSignIn).toLocaleString() : "—"}
          >
            <div className="pt-2 text-xs text-text-secondary">
              {initial.lastSignIn ? formatRelative(initial.lastSignIn) : "Never"}
            </div>
          </Field>

          <Field
            label="Avatar URL"
            hint="Paste a public URL to a square image. File upload coming in Phase 2."
            className="sm:col-span-2"
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-text-muted" />
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </Field>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
        {action.error ? (
          <span className="text-brand-danger">{action.error}</span>
        ) : action.state === "success" && !dirty ? (
          <span className="text-brand-success">Saved.</span>
        ) : (
          <span className="text-text-muted">
            {dirty ? "Unsaved changes" : "Up to date"}
          </span>
        )}

        <button
          type="button"
          onClick={save}
          disabled={!dirty || action.state === "pending"}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {action.state === "pending" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save Profile
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={"block " + (className ?? "")}>
      <span className="label-caps mb-1.5 block text-text-secondary">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-text-muted">{hint}</span>}
    </label>
  );
}
