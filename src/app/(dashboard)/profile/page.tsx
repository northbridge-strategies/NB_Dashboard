import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/notion/users";
import { ErrorState } from "@/components/ui/states";
import { ProfileForm } from "./_ProfileForm";
import { PasswordForm } from "./_PasswordForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await findUserById(session.id).catch(() => null);

  if (!user) {
    return (
      <ErrorState
        title="Profile not found"
        description="Your account record couldn't be loaded from Notion. If this persists, contact an admin."
      />
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <h2 className="text-base font-semibold text-text-primary">Your Profile</h2>
        <p className="mt-1 text-xs text-text-secondary">
          Stored in the <span className="font-mono">Dashboard Users</span> Notion
          database. Email and role are read-only — ask an admin to change those.
        </p>
      </header>

      <ProfileForm
        initial={{
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          createdTime: user.createdTime,
          lastSignIn: user.lastSignIn,
        }}
      />

      <PasswordForm />
    </div>
  );
}
