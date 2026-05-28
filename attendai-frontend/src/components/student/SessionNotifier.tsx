"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radio, X, ArrowRight } from "lucide-react";
import { useActiveSessions } from "@/lib/hooks";

/**
 * Floating "a session just went live" toast for students. Polls active
 * sessions (every 15s via the query's refetchInterval) and pops a card when
 * one is live, with a one-tap link into the marking flow. Dismissals are
 * per-session so a new session re-notifies. Hidden on the attendance page
 * itself (you're already there).
 */
export function SessionNotifier() {
  const pathname = usePathname();
  const { data: sessions = [] } = useActiveSessions();
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  if (pathname?.startsWith("/student/attendance")) return null;

  const visible = sessions.filter((s) => !dismissed.has(s.id)).slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 w-[min(92vw,360px)]">
      {visible.map((s) => (
        <div
          key={s.id}
          className="glass rounded-2xl shadow-xl ring-1 ring-brand-200/60 p-4 animate-in-up"
        >
          <div className="flex items-start gap-3">
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Radio className="size-4" />
              <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-rose-400 ring-2 ring-white animate-pulse" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[0.7rem] uppercase tracking-wider text-brand-600 font-medium">Attendance is live</p>
              <p className="text-[0.9rem] text-ink-900 truncate">
                <span className="numeral font-medium">{s.courseCode}</span> — {s.courseName}
              </p>
              <p className="text-[0.7rem] text-ink-400 truncate">{s.sectionName}</p>
              <Link
                href="/student/attendance"
                onClick={() => setDismissed((d) => new Set(d).add(s.id))}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                Mark attendance <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setDismissed((d) => new Set(d).add(s.id))}
              className="text-ink-300 hover:text-ink-600 shrink-0"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
