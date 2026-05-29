"use client";

import Link from "next/link";
import { Megaphone, Pin } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { useAnnouncements } from "@/lib/hooks";
import { timeAgo } from "@/lib/format";
import type { Role } from "@/types/api";

/** Compact "latest announcements" widget for the role dashboards. */
export function LatestAnnouncements({ role, className }: { role: Role; className?: string }) {
  const base = `/${role.toLowerCase()}/announcements`;
  const { data: items = [], isLoading } = useAnnouncements();
  const top = items.slice(0, 4);

  return (
    <Card className={className}>
      <CardHeader
        title="Announcements"
        subtitle="Latest campus notices"
        right={<Link className="text-xs text-brand-700 hover:underline" href={base}>View all</Link>}
      />
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-ink-100/60 animate-pulse-soft" />)}
        </div>
      ) : top.length === 0 ? (
        <div className="text-center py-6 text-ink-400">
          <Megaphone className="size-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No announcements yet.</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {top.map((a) => (
            <li key={a.id}>
              <Link href={base} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-brand-50/60 transition-colors group">
                <div className="size-9 rounded-lg bg-brand-50 text-brand-600 grid place-items-center shrink-0">
                  {a.pinned ? <Pin className="size-4" /> : <Megaphone className="size-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.85rem] text-ink-900 truncate group-hover:text-brand-700 transition-colors">{a.title}</p>
                  <p className="text-[0.7rem] text-ink-400 truncate">{a.authorName} · <span className="numeral">{timeAgo(a.createdAt)}</span></p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
