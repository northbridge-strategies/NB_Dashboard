"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Search, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils/classnames";
import { EmptyState } from "@/components/ui/states";

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Optional width class, e.g. "w-32". */
  width?: string;
  /** Numeric/string accessor used for sorting. Falsy to disable sort on this column. */
  sort?: (row: T) => string | number | null;
  /** Cell renderer. */
  render: (row: T) => ReactNode;
  /** Right-align numeric columns. */
  align?: "left" | "right" | "center";
  /** Hide on mobile (<sm). For dense columns that would push the layout. */
  hideOnMobile?: boolean;
  /** Hide on small tablets (<md). */
  hideOnTablet?: boolean;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  /** When provided, displays a search input matching against this row -> string fn. */
  searchable?: (row: T) => string;
  searchPlaceholder?: string;
  /** Click a row -> opens slide-over etc. */
  onRowClick?: (row: T) => void;
  /** Page size — pagination kicks in past this. */
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Stable key per row. Defaults to (row as any).id. */
  rowKey?: (row: T) => string;
  /** Optional per-row class — for highlighting stale/urgent rows. */
  rowClassName?: (row: T) => string | undefined;
  /** Optional toolbar slot (right of search). */
  toolbar?: ReactNode;
}

export function DataTable<T>({
  rows,
  columns,
  searchable,
  searchPlaceholder = "Search…",
  onRowClick,
  pageSize = 50,
  emptyTitle = "No results",
  emptyDescription,
  rowKey,
  rowClassName,
  toolbar,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!query || !searchable) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => searchable(r).toLowerCase().includes(q));
  }, [rows, query, searchable]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sort) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = col.sort!(a);
      const bv = col.sort!(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  function toggleSort(key: string) {
    setPage(0);
    setSort((cur) => {
      if (!cur || cur.key !== key) return { key, dir: "asc" };
      if (cur.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  return (
    <div className="space-y-3">
      {(searchable || toolbar) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative w-full max-w-sm flex-1 sm:flex-initial">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="search"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                className="w-full rounded-md border border-border bg-bg py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          )}
          {toolbar && <div className="ml-auto flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-elevated/60">
                  {columns.map((col) => {
                    const isSorted = sort?.key === col.key;
                    const sortable = !!col.sort;
                    return (
                      <th
                        key={col.key}
                        scope="col"
                        className={cn(
                          "label-caps select-none whitespace-nowrap px-4 py-3 text-left font-medium text-text-muted",
                          col.width,
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          col.hideOnMobile && "hidden sm:table-cell",
                          col.hideOnTablet && "hidden md:table-cell",
                        )}
                      >
                        {sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(col.key)}
                            className={cn(
                              "inline-flex items-center gap-1 transition hover:text-text-primary",
                              col.align === "right" && "ml-auto flex-row-reverse",
                              col.align === "center" && "mx-auto",
                            )}
                          >
                            <span>{col.header}</span>
                            {isSorted ? (
                              sort?.dir === "asc" ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </button>
                        ) : (
                          col.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => {
                  const id = rowKey?.(row) ?? (row as { id?: string }).id ?? String(i);
                  const extraClass = rowClassName?.(row);
                  return (
                    <tr
                      key={id}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        "border-b border-border transition-colors last:border-0",
                        onRowClick && "cursor-pointer hover:bg-surface-elevated/50",
                        extraClass,
                      )}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-4 py-3 align-middle text-text-primary",
                            col.align === "right" && "text-right",
                            col.align === "center" && "text-center",
                            col.hideOnMobile && "hidden sm:table-cell",
                            col.hideOnTablet && "hidden md:table-cell",
                          )}
                        >
                          {col.render(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary">
          <span>
            {sorted.length} {sorted.length === 1 ? "row" : "rows"} — page{" "}
            {safePage + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded-md border border-border px-3 py-1.5 text-text-secondary transition hover:bg-surface-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="rounded-md border border-border px-3 py-1.5 text-text-secondary transition hover:bg-surface-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
