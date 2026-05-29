"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays, ChevronLeft, ChevronRight, Radio, CheckCircle2, Clock,
  XCircle, CalendarClock, BookOpen,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useTeacherSessions, useActiveSessions, useHistory } from "@/lib/hooks";
import { dayKey } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { AttendanceHistoryRow, Role } from "@/types/api";

type Tone = "live" | "present" | "late" | "missed" | "scheduled";

interface SchedEvent {
  id: string;
  date: Date;
  courseCode: string;
  title: string;     // course name / section
  tone: Tone;
  statusLabel: string;
  href?: string;
}

const toneMeta: Record<Tone, { Icon: typeof Radio; wrap: string; badge: "live" | "success" | "warning" | "danger" | "neutral" }> = {
  live: { Icon: Radio, wrap: "bg-brand-100 text-brand-700", badge: "live" },
  present: { Icon: CheckCircle2, wrap: "bg-emerald-50 text-emerald-600", badge: "success" },
  late: { Icon: Clock, wrap: "bg-amber-50 text-amber-700", badge: "warning" },
  missed: { Icon: XCircle, wrap: "bg-rose-50 text-rose-600", badge: "danger" },
  scheduled: { Icon: CalendarClock, wrap: "bg-ink-100 text-ink-600", badge: "neutral" },
};

export function ScheduleView({ role }: { role: Role }) {
  return role === "TEACHER" ? <TeacherSchedule /> : <StudentSchedule />;
}

function TeacherSchedule() {
  const { data: sessions = [] } = useTeacherSessions();
  const events = useMemo<SchedEvent[]>(() => {
    return sessions
      .filter((s) => s.startTime)
      .map((s) => {
        const tone: Tone = s.status === "ACTIVE" ? "live" : (s.status === "SCHEDULED" ? "scheduled" : "present");
        return {
          id: `s-${s.id}`,
          date: new Date(s.startTime as string),
          courseCode: s.courseCode,
          title: `${s.courseName} · ${s.sectionName}`,
          tone,
          statusLabel: s.status[0] + s.status.slice(1).toLowerCase(),
          href: "/teacher/sessions",
        };
      });
  }, [sessions]);
  return <ScheduleShell role="TEACHER" events={events} subtitle="Your attendance sessions, organised by day." />;
}

function StudentSchedule() {
  const { data: live = [] } = useActiveSessions();
  const { data: history } = useHistory();

  const events = useMemo<SchedEvent[]>(() => {
    const out: SchedEvent[] = [];
    live.forEach((s) => out.push({
      id: `live-${s.id}`,
      date: s.startTime ? new Date(s.startTime) : new Date(),
      courseCode: s.courseCode,
      title: `${s.courseName} · ${s.sectionName}`,
      tone: "live",
      statusLabel: "Live now",
      href: "/student/attendance",
    }));
    const rows = ((history as { content?: AttendanceHistoryRow[] } | undefined)?.content ?? []) as AttendanceHistoryRow[];
    rows.forEach((r) => {
      const tone: Tone =
        r.status === "PRESENT" || r.status === "MANUAL_PRESENT" ? "present" :
        r.status === "LATE" ? "late" :
        r.status === "ABSENT" || r.status === "REJECTED" ? "missed" : "scheduled";
      out.push({
        id: `h-${r.recordId}`,
        date: new Date(r.markedAt),
        courseCode: r.courseCode,
        title: r.status[0] + r.status.slice(1).toLowerCase().replace("_", " "),
        tone,
        statusLabel: r.status.replace("_", " "),
        href: "/student/history",
      });
    });
    return out;
  }, [live, history]);

  return <ScheduleShell role="STUDENT" events={events} subtitle="Live classes and your attendance, day by day." />;
}

// ---- Shared agenda shell with week selector ----

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
}

function ScheduleShell({ role, events, subtitle }: { role: Role; events: SchedEvent[]; subtitle: string }) {
  const base = `/${role.toLowerCase()}`;
  const today = new Date();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState<string>(() => dayKey(new Date()));

  const byDay = useMemo(() => {
    const m = new Map<string, SchedEvent[]>();
    events.forEach((e) => {
      const k = dayKey(e.date);
      const arr = m.get(k) ?? [];
      arr.push(e);
      m.set(k, arr);
    });
    // newest first within a day
    m.forEach((arr) => arr.sort((a, b) => b.date.getTime() - a.date.getTime()));
    return m;
  }, [events]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  }), [weekStart]);

  const weekCount = days.reduce((sum, d) => sum + (byDay.get(dayKey(d))?.length ?? 0), 0);
  const selectedEvents = byDay.get(selected) ?? [];
  const selectedDate = new Date(selected + "T00:00:00");

  function shiftWeek(delta: number) {
    const w = new Date(weekStart);
    w.setDate(weekStart.getDate() + delta * 7);
    setWeekStart(w);
  }
  function goToday() {
    setWeekStart(startOfWeek(new Date()));
    setSelected(dayKey(new Date()));
  }

  const monthLabel = weekStart.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <>
      <PageHeader
        title="Schedule"
        subtitle={subtitle}
        icon={CalendarDays}
        crumbs={[{ label: role.charAt(0) + role.slice(1).toLowerCase(), href: base }, { label: "Schedule" }]}
        action={<Button variant="secondary" onClick={goToday}><CalendarDays className="size-4" /> Today</Button>}
      />

      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl text-ink-900">{monthLabel}</span>
            <Badge tone="info">{weekCount} this week</Badge>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => shiftWeek(-1)} className="size-8 grid place-items-center rounded-lg hover:bg-white/70 text-ink-500 transition-colors" aria-label="Previous week"><ChevronLeft className="size-4" /></button>
            <button onClick={() => shiftWeek(1)} className="size-8 grid place-items-center rounded-lg hover:bg-white/70 text-ink-500 transition-colors" aria-label="Next week"><ChevronRight className="size-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const k = dayKey(d);
            const isToday = k === dayKey(today);
            const isSelected = k === selected;
            const count = byDay.get(k)?.length ?? 0;
            return (
              <button
                key={k}
                onClick={() => setSelected(k)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all border",
                  isSelected ? "bg-brand-600 text-white border-brand-600 shadow-glass"
                    : "bg-white/50 border-transparent hover:bg-white/80 text-ink-700"
                )}
              >
                <span className={cn("text-[0.6rem] uppercase tracking-wide", isSelected ? "text-white/70" : "text-ink-400")}>
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <span className={cn("text-lg font-display leading-none", isToday && !isSelected && "text-brand-600")}>{d.getDate()}</span>
                <span className={cn("size-1.5 rounded-full", count > 0 ? (isSelected ? "bg-white" : "bg-brand-500") : "bg-transparent")} />
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-medium text-ink-900 mb-1">
          {selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </h3>
        <p className="text-xs text-ink-400 mb-4">{selectedEvents.length} {selectedEvents.length === 1 ? "item" : "items"}</p>

        {selectedEvents.length === 0 ? (
          <div className="text-center py-10">
            <div className="size-12 rounded-2xl bg-brand-50 text-brand-500 grid place-items-center mx-auto mb-2">
              <BookOpen className="size-5" />
            </div>
            <p className="text-sm text-ink-500">Nothing scheduled for this day.</p>
          </div>
        ) : (
          <ul className="space-y-2.5 stagger">
            {selectedEvents.map((e) => {
              const meta = toneMeta[e.tone];
              const Icon = meta.Icon;
              const inner = (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 hover:bg-white/80 transition-colors">
                  <div className={cn("size-11 rounded-xl grid place-items-center shrink-0", meta.wrap)}>
                    <Icon className={cn("size-5", e.tone === "live" && "animate-pulse-soft")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.9rem] font-medium text-ink-900 truncate"><span className="numeral">{e.courseCode}</span></p>
                    <p className="text-[0.75rem] text-ink-500 truncate">{e.title}</p>
                    <p className="text-[0.68rem] text-ink-400 numeral mt-0.5">{e.date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                  <Badge tone={meta.badge} dot={e.tone === "live"}>{e.statusLabel}</Badge>
                </div>
              );
              return <li key={e.id}>{e.href ? <Link href={e.href} className="block">{inner}</Link> : inner}</li>;
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
