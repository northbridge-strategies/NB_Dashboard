import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/notion/users";
import { getSidebarCollapsed } from "@/lib/utils/cookies";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Enrich the session-cached user with a fresh avatar URL from Notion.
  // Falls back to the session if the lookup fails.
  const profile = await findUserById(session.id).catch(() => null);

  const sidebarUser = {
    id: session.id,
    name: profile?.name || session.name,
    email: session.email,
    role: session.role,
    avatarUrl: profile?.avatarUrl ?? null,
  };

  const collapsed = getSidebarCollapsed();

  return (
    <DashboardShell user={sidebarUser} initialCollapsed={collapsed}>
      {children}
    </DashboardShell>
  );
}
