"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils/classnames";

export interface TabDef {
  id: string;
  label: string;
  count?: number;
  content: ReactNode;
}

export function Tabs({
  tabs,
  defaultTab,
  urlParam,
  className,
}: {
  tabs: TabDef[];
  defaultTab?: string;
  /** If provided, the active tab id is synced to this URL search param. */
  urlParam?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initial = urlParam
    ? (searchParams.get(urlParam) ?? defaultTab ?? tabs[0]?.id ?? "")
    : (defaultTab ?? tabs[0]?.id ?? "");
  const [active, setActive] = useState(initial);

  // Keep state in sync when the URL param changes externally (e.g. back button)
  useEffect(() => {
    if (!urlParam) return;
    const fromUrl = searchParams.get(urlParam);
    if (fromUrl && fromUrl !== active) setActive(fromUrl);
  }, [searchParams, urlParam, active]);

  const handleSelect = useCallback(
    (id: string) => {
      setActive(id);
      if (urlParam) {
        const params = new URLSearchParams(searchParams.toString());
        params.set(urlParam, id);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    },
    [urlParam, router, pathname, searchParams],
  );

  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className={cn("space-y-4", className)}>
      <div role="tablist" className="flex gap-1 border-b border-border">
        {tabs.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelect(t.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition",
                isActive
                  ? "text-text-primary"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              <span>{t.label}</span>
              {typeof t.count === "number" && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs",
                    isActive
                      ? "bg-brand-primary text-white"
                      : "bg-surface-elevated text-text-secondary",
                  )}
                >
                  {t.count}
                </span>
              )}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-primary" />
              )}
            </button>
          );
        })}
      </div>
      <div>{current?.content}</div>
    </div>
  );
}
