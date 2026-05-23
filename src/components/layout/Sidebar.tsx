"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { visibleNav } from "@/lib/constants/nav";
import { cn } from "@/lib/utils/classnames";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu, type UserMenuUser } from "./UserMenu";

const ONE_YEAR = 60 * 60 * 24 * 365;

function setSidebarCookie(collapsed: boolean) {
  document.cookie = `sidebar-collapsed=${collapsed ? "1" : "0"}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`;
}

export function Sidebar({
  user,
  initialCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  user: UserMenuUser;
  initialCollapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  // On desktop, "collapsed" means narrow rail. Mobile ignores collapsed —
  // the drawer is always full-width when open.
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const pathname = usePathname();
  const items = visibleNav(user.role);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    if (mobileOpen) onCloseMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    setSidebarCookie(next);
  };

  return (
    <aside
      aria-label="Primary"
      className={cn(
        "z-40 flex h-screen flex-col border-r border-border bg-surface",
        // Mobile: full-screen drawer, fixed-positioned, slide in/out
        "fixed inset-y-0 left-0 w-64 transition-transform duration-200",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: sticky in flow, contributes to layout width
        "lg:sticky lg:top-0 lg:translate-x-0 lg:transition-[width]",
        collapsed ? "lg:w-16" : "lg:w-64",
      )}
    >
      {/* Floating collapse toggle — desktop only */}
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute right-0 top-20 z-30 hidden h-7 w-7 translate-x-1/2 items-center justify-center rounded-full border border-border bg-surface text-text-secondary shadow-sm transition hover:bg-surface-elevated hover:text-text-primary lg:inline-flex"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Header: logo + mobile-only close button */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-3",
          collapsed ? "lg:justify-center" : "lg:justify-start",
          "justify-between",
        )}
      >
        <Link
          href="/"
          aria-label="Northbridge Strategies — Home"
          title="Northbridge Strategies"
          className={cn(
            "flex items-center",
            collapsed && "lg:justify-center",
          )}
        >
          <Image
            src="/logo.png"
            alt="Northbridge Strategies"
            width={collapsed ? 40 : 140}
            height={collapsed ? 40 : 40}
            className={cn(
              "object-contain",
              collapsed ? "lg:h-9 lg:w-9" : "",
            )}
            priority
          />
        </Link>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close menu"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                collapsed && "lg:justify-center lg:px-0",
                active
                  ? "bg-brand-primary text-white"
                  : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className={cn("truncate", collapsed && "lg:hidden")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: theme toggle + user */}
      <div className="space-y-2 border-t border-border p-2">
        <div
          className={cn(
            "flex items-center",
            collapsed ? "lg:justify-center" : "lg:justify-between",
            "justify-between",
          )}
        >
          <ThemeToggle />
          <span
            className={cn(
              "label-caps text-text-muted",
              collapsed && "lg:hidden",
            )}
          >
            v0.1
          </span>
        </div>
        <UserMenu user={user} collapsed={collapsed} />
      </div>
    </aside>
  );
}
