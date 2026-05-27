"use client";

import { useState, useMemo } from "react";
import {
  Radio, Plus, BookOpen, Eye, Square, ArrowRight, Calendar,
  Clock as ClockIcon, Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { SESSIONS, type SessionRow } from "@/lib/mockData";
import { cn } from "@/lib/cn";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

const statusTone: Record<SessionRow["status"], "live" | "success" | "neutral" | "danger"> = {
  ACTIVE: "live",
  SCHEDULED: "neutral",
  CLOSED: "success",
  EXPIRED: "danger",
};

export default function TeacherSessionsPage() {
  const [sessions] = useState(SESSIONS);
  const [tab, setTab] = useState("active");

  const counts = useMemo(() => ({
    active: sessions.filter(s => s.status === "ACTIVE").length,
    scheduled: sessions.filter(s => s.status === "SCHEDULED").length,
    closed: sessions.filter(s => s.status === "CLOSED").length,
    expired: sessions.filter(s => s.status === "EXPIRED").length,
  }), [sessions]);

  const filtered = useMemo(() => {
    if (tab === "all") return sessions;
    return sessions.filter(s => s.status.toLowerCase() === tab);
  }, [sessions, tab]);

  return (
    <>
      <PageHeader
        title="Attendance Sessions"
        subtitle="Live sessions, upcoming classes, and past attendance."
        icon={Radio}
        crumbs={[{ label: "Teacher", href: "/teacher" }, { label: "Sessions" }]}
        action={<Button><Plus className="size-4" /> Start New Session</Button>}
      />

      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "active", label: "Live", count: counts.active },
            { value: "scheduled", label: "Scheduled", count: counts.scheduled },
            { value: "closed", label: "Closed", count: counts.closed },
            { value: "expired", label: "Expired", count: counts.expired },
            { value: "all", label: "All", count: sessions.length },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full glass rounded-2xl p-12 text-center">
            <Radio className="size-8 text-ink-300 mx-auto mb-2" />
            <p className="font-display text-xl text-ink-700">No sessions in this view</p>
            <p className="text-sm text-ink-400 mt-1">Switch tabs to see other sessions.</p>
          </div>
        ) : filtered.map(s => {
          const pct = s.total > 0 ? (s.present / s.total) * 100 : 0;
          const isLive = s.status === "ACTIVE";

          return (
            <Card key={s.id} className="relative">
              {isLive ? (
                <div className="absolute -top-1 -right-1">
                  <Badge tone="live" dot>Live</Badge>
                </div>
              ) : null}

              <div className="flex items-start gap-3 mb-4">
                <div className={cn(
                  "size-11 rounded-xl grid place-items-center shrink-0",
                  isLive ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700"
                )}>
                  <BookOpen className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.7rem] uppercase tracking-wider text-ink-400 numeral">{s.sessionCode}</p>
                  <h3 className="font-display text-[1.25rem] leading-tight text-ink-900 mt-0.5 truncate">
                    <span className="numeral">{s.courseCode}</span> — {s.courseName}
                  </h3>
                  <p className="text-xs text-ink-500 mt-0.5">Section {s.section}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-ink-500 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3 text-ink-400" />
                  <span>{formatDate(s.startTime)}</span>
                </div>
                {s.endTime ? (
                  <div className="flex items-center gap-2">
                    <ClockIcon className="size-3 text-ink-400" />
                    <span>Ended {formatDate(s.endTime)}</span>
                  </div>
                ) : null}
              </div>

              {/* Attendance progress (if applicable) */}
              {s.status !== "SCHEDULED" ? (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
                      <Users className="size-3 text-ink-400" />
                      <span className="numeral">{s.present}</span> of <span className="numeral">{s.total}</span>
                    </span>
                    <span className={cn(
                      "numeral text-sm font-medium",
                      pct >= 85 ? "text-brand-700" : pct >= 70 ? "text-accent-amber" : "text-accent-rose"
                    )}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        isLive ? "bg-gradient-to-r from-brand-500 to-brand-600 animate-pulse-soft" : "bg-brand-500"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-2.5 rounded-lg bg-amber-50/60 text-[0.72rem] text-amber-800">
                  Scheduled — students cannot mark attendance yet.
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-ink-100/80">
                <Badge tone={statusTone[s.status]} dot={isLive}>
                  {s.status[0] + s.status.slice(1).toLowerCase()}
                </Badge>
                <div className="flex items-center gap-1">
                  {isLive ? (
                    <button className="inline-flex items-center gap-1 px-2.5 h-7 text-xs rounded-lg bg-ink-100 hover:bg-ink-200 text-ink-700 transition-colors">
                      <Square className="size-3" />
                      Close
                    </button>
                  ) : null}
                  <button className="inline-flex items-center gap-1 px-2.5 h-7 text-xs rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 transition-colors">
                    {isLive ? "Monitor" : "View"}
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
