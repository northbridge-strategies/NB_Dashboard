import { redirect } from "next/navigation";
import { Users, Cog, Plug, Bell } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { listUsers } from "@/lib/auth/users";
import { getProductionConfig } from "@/lib/notion/config";
import {
  StatusBadge,
  toneForLifecycle,
} from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "Admin") {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <h2 className="text-base font-semibold text-text-primary">
          Access denied
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Settings are restricted to Admin users.
        </p>
      </div>
    );
  }

  const [users, config] = await Promise.all([
    listUsers().catch(() => []),
    getProductionConfig().catch(() => null),
  ]);

  // Detect which env-var-backed integrations are connected.
  const integrations = [
    { name: "Notion", env: "NOTION_TOKEN" },
    { name: "NextAuth", env: "NEXTAUTH_SECRET" },
    { name: "Stripe", env: "STRIPE_SECRET_KEY" },
    { name: "Twilio", env: "TWILIO_AUTH_TOKEN" },
    { name: "Make.com", env: "MAKE_WEBHOOK_URL" },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* USERS */}
      <Section icon={Users} title="User Management">
        <p className="mb-3 text-xs text-text-secondary">
          Users live in the <span className="font-mono">Dashboard Users</span> Notion
          database. Each person can edit their own profile and password from{" "}
          <a href="/profile" className="text-brand-info hover:underline">
            /profile
          </a>
          . To add a new user, create a row in Notion (or extend this UI later).
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-elevated/50">
                <th className="label-caps px-4 py-2.5 text-left font-medium text-text-muted">
                  Name
                </th>
                <th className="label-caps px-4 py-2.5 text-left font-medium text-text-muted">
                  Email
                </th>
                <th className="label-caps px-4 py-2.5 text-left font-medium text-text-muted">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={u.role} tone={toneForLifecycle(u.role)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* SYSTEM CONFIG */}
      <Section icon={Cog} title="System Config">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ConfigTile
            label="Global Pause"
            value={config ? (config.globalPause ? "Paused" : "Running") : "—"}
            tone={config?.globalPause ? "danger" : "success"}
          />
          <ConfigTile
            label="Last Pause Event"
            value={
              config?.lastPauseEvent
                ? new Date(config.lastPauseEvent).toLocaleString()
                : "—"
            }
          />
          <ConfigTile
            label="Last Resume Event"
            value={
              config?.lastResumeEvent
                ? new Date(config.lastResumeEvent).toLocaleString()
                : "—"
            }
          />
        </div>
      </Section>

      {/* API STATUS */}
      <Section icon={Plug} title="API Status">
        <p className="mb-3 text-xs text-text-secondary">
          Connection state is inferred from environment variables. A connected
          integration means a token/secret is set in this environment — it does
          not validate the credential.
        </p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {integrations.map((i) => {
            const connected = Boolean(process.env[i.env]);
            return (
              <li
                key={i.name}
                className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium text-text-primary">
                    {i.name}
                  </div>
                  <div className="font-mono text-xs text-text-muted">
                    {i.env}
                  </div>
                </div>
                <StatusBadge
                  label={connected ? "Connected" : "Not configured"}
                  tone={connected ? "success" : "muted"}
                />
              </li>
            );
          })}
        </ul>
      </Section>

      {/* NOTIFICATION PREFS */}
      <Section icon={Bell} title="Notification Preferences">
        <p className="text-xs text-text-secondary">
          Notification routing (Doug&apos;s mobile for SMS, email for critical
          alerts) is configured in Make.com scenario settings, not here. This
          panel is reserved for future per-user dashboard preferences.
        </p>
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Users;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-text-primary">
        <Icon className="h-4 w-4" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function ConfigTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "danger";
}) {
  const colorClass =
    tone === "success"
      ? "text-brand-success"
      : tone === "danger"
      ? "text-brand-danger"
      : "text-text-primary";
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="label-caps text-text-muted">{label}</div>
      <div className={"mt-2 text-sm font-medium " + colorClass}>{value}</div>
    </div>
  );
}
