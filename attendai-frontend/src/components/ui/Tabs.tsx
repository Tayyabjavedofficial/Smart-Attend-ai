"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center p-1 rounded-xl bg-ink-100/60 gap-1", className)}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className={cn(
              "px-3 h-8 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5",
              active
                ? "bg-white text-ink-900 shadow-glass"
                : "text-ink-500 hover:text-ink-800"
            )}
          >
            {it.label}
            {it.count !== undefined ? (
              <span className={cn(
                "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[0.65rem] font-semibold",
                active ? "bg-brand-50 text-brand-700" : "bg-ink-200/70 text-ink-600"
              )}>
                {it.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
