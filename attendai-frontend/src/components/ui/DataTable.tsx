"use client";

import { type ReactNode, useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, MoreVertical } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;            // e.g. "w-32"
  align?: "left" | "right" | "center";
  sortable?: boolean;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  searchPlaceholder?: string;
  searchField?: (row: T) => string;       // string to match against the search input
  pageSize?: number;
  rowActions?: (row: T) => ReactNode;     // dropdown / icons at right of row
  emptyTitle?: string;
  emptyHint?: string;
  onRowClick?: (row: T) => void;
  toolbar?: ReactNode;                    // extra controls (filters etc.)
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchPlaceholder = "Search…",
  searchField,
  pageSize = 10,
  rowActions,
  emptyTitle = "Nothing here yet",
  emptyHint = "Try adjusting your filters.",
  onRowClick,
  toolbar,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    if (!searchField || !query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) => searchField(row).toLowerCase().includes(q));
  }, [data, query, searchField]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    return [...filtered].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = sorted.slice(page * pageSize, page * pageSize + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-ink-100/60">
        {searchField ? (
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-300" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder={searchPlaceholder}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/70 border border-ink-200/60 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        ) : <div className="flex-1" />}
        {toolbar}
        <span className="text-xs text-ink-400 numeral whitespace-nowrap">
          {sorted.length} {sorted.length === 1 ? "result" : "results"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[0.65rem] uppercase tracking-wider text-ink-400 bg-white/40">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-4 py-2.5 font-medium",
                    c.width,
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                    c.align !== "right" && c.align !== "center" && "text-left",
                  )}
                >
                  {c.sortable && c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={cn(
                        "inline-flex items-center gap-1 hover:text-ink-700 transition-colors",
                        sortKey === c.key && "text-brand-700"
                      )}
                    >
                      {c.header}
                      <ArrowUpDown className="size-3" />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
              {rowActions ? <th className="w-12 px-2 py-2.5" /> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100/60">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)} className="text-center py-16">
                  <p className="font-display text-xl text-ink-700">{emptyTitle}</p>
                  <p className="text-sm text-ink-400 mt-1">{emptyHint}</p>
                </td>
              </tr>
            ) : (
              pageData.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    "transition-colors hover:bg-white/50",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-4 py-3 align-middle",
                        c.align === "right" && "text-right",
                        c.align === "center" && "text-center",
                      )}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                  {rowActions ? (
                    <td className="px-2 py-3 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                      {rowActions(row)}
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > pageSize ? (
        <div className="flex items-center justify-between gap-3 p-3 border-t border-ink-100/60 text-xs text-ink-500">
          <span>
            Page <span className="numeral text-ink-700 font-medium">{page + 1}</span> of <span className="numeral text-ink-700 font-medium">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="size-8 grid place-items-center rounded-lg hover:bg-white/70 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="size-8 grid place-items-center rounded-lg hover:bg-white/70 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Convenience component for the row actions dropdown trigger
export function RowMenuButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="size-7 grid place-items-center rounded-lg hover:bg-white/70 text-ink-400 hover:text-ink-700 transition-colors"
    >
      <MoreVertical className="size-4" />
    </button>
  );
}
