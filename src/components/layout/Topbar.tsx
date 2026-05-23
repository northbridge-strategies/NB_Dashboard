"use client";

import { Menu, Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants/nav";
import { SystemHealthDot } from "@/components/ui/SystemHealthDot";

function pageTitleFor(pathname: string): string {
  if (pathname === "/") return "Home";
  if (pathname.startsWith("/profile")) return "Profile";
  const match = NAV_ITEMS.find(
    (n) => n.href !== "/" && pathname.startsWith(n.href),
  );
  return match?.label ?? "Dashboard";
}

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const pathname = usePathname() ?? "/";
  const title = pageTitleFor(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-bg/85 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open menu"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-text-secondary transition hover:bg-surface-elevated hover:text-text-primary lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <div className="label-caps text-text-muted">Operations</div>
          <h1 className="truncate text-base font-semibold text-text-primary sm:text-lg">
            {title}
          </h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <SystemHealthDot />
        <button
          type="button"
          aria-label="Notifications"
          className="hidden h-9 w-9 items-center justify-center rounded-md border border-border text-text-secondary transition hover:bg-surface-elevated hover:text-text-primary sm:inline-flex"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
