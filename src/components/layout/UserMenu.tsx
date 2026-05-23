"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import type { Role } from "@/lib/types/auth";
import { cn } from "@/lib/utils/classnames";
import { initials } from "@/lib/utils/format";

export interface UserMenuUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
}

function Avatar({
  user,
  size = 36,
}: {
  user: UserMenuUser;
  size?: number;
}) {
  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={user.name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        unoptimized
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white"
      style={{ width: size, height: size }}
    >
      {initials(user.name || user.email)}
    </div>
  );
}

export function UserMenu({
  user,
  collapsed,
}: {
  user: UserMenuUser;
  /** Collapsed on desktop only — mobile drawer always shows the full layout. */
  collapsed: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md p-2",
        collapsed && "lg:justify-center lg:px-0",
      )}
    >
      <Link
        href="/profile"
        aria-label="Edit your profile"
        title="Edit your profile"
        className="shrink-0 rounded-full ring-offset-2 ring-offset-surface transition hover:ring-2 hover:ring-brand-primary/40"
      >
        <Avatar user={user} size={36} />
      </Link>

      <Link
        href="/profile"
        className={cn(
          "min-w-0 flex-1 transition hover:opacity-80",
          collapsed && "lg:hidden",
        )}
      >
        <div className="truncate text-sm font-medium text-text-primary">
          {user.name || user.email}
        </div>
        <div className="label-caps text-text-muted">{user.role}</div>
      </Link>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        aria-label="Sign out"
        title="Sign out"
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary",
          collapsed && "lg:hidden",
        )}
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
