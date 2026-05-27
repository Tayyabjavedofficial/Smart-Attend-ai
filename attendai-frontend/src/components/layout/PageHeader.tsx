"use client";

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

interface Crumb {
  label: string;
  href?: string;
}

export function PageHeader({
  title,
  subtitle,
  crumbs,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {crumbs && crumbs.length > 0 ? (
        <nav className="flex items-center gap-1.5 text-[0.72rem] text-ink-400 mb-3">
          {crumbs.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              {c.href ? (
                <Link href={c.href} className="hover:text-brand-700 transition-colors">
                  {c.label}
                </Link>
              ) : (
                <span className={i === crumbs.length - 1 ? "text-ink-600" : ""}>{c.label}</span>
              )}
              {i < crumbs.length - 1 ? <ChevronRight className="size-3 text-ink-300" /> : null}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="size-11 rounded-2xl bg-brand-50 text-brand-700 grid place-items-center shrink-0 mt-0.5">
              <Icon className="size-5" />
            </div>
          ) : null}
          <div>
            <h1 className="font-display text-[2.25rem] leading-none tracking-tight text-ink-900">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-sm text-ink-500 max-w-[60ch] balance">{subtitle}</p> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
