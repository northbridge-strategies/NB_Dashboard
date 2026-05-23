"use client";

import { useState } from "react";
import { Lock, Loader2, Save, Eye, EyeOff } from "lucide-react";
import { useAction } from "@/lib/hooks/useAction";

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const action = useAction();

  const matchError = next && confirm && next !== confirm ? "Passwords don't match" : null;
  const lengthError = next.length > 0 && next.length < 8 ? "Use at least 8 characters" : null;
  const localError = matchError || lengthError;
  const canSubmit =
    current.length > 0 &&
    next.length >= 8 &&
    next === confirm &&
    action.state !== "pending";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const r = await action.run("/api/profile/password", {
      method: "PUT",
      body: { currentPassword: current, newPassword: next },
    });
    if (r.ok) {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Lock className="h-4 w-4" />
        Change password
      </h3>
      <p className="mt-1 text-xs text-text-secondary">
        You&apos;ll stay signed in after changing your password.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <PasswordField
          label="Current password"
          value={current}
          onChange={setCurrent}
          show={showPasswords}
          autoComplete="current-password"
        />
        <PasswordField
          label="New password"
          value={next}
          onChange={setNext}
          show={showPasswords}
          autoComplete="new-password"
          hint="At least 8 characters."
        />
        <PasswordField
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          show={showPasswords}
          autoComplete="new-password"
        />

        <label className="flex items-center gap-2 text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={showPasswords}
            onChange={(e) => setShowPasswords(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border bg-bg accent-brand-primary"
          />
          {showPasswords ? (
            <>
              <EyeOff className="h-3.5 w-3.5" /> Hide passwords
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" /> Show passwords
            </>
          )}
        </label>

        <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
          {action.error ? (
            <span className="text-brand-danger">{action.error}</span>
          ) : localError ? (
            <span className="text-brand-warning">{localError}</span>
          ) : action.state === "success" ? (
            <span className="text-brand-success">Password updated.</span>
          ) : (
            <span className="text-text-muted">Min 8 chars, must match.</span>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {action.state === "pending" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Update Password
          </button>
        </div>
      </form>
    </section>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  autoComplete: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="label-caps mb-1.5 block text-text-secondary">{label}</span>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
      />
      {hint && <span className="mt-1 block text-xs text-text-muted">{hint}</span>}
    </label>
  );
}
