"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell, Megaphone, Radio, ShieldAlert, AlertTriangle, Info, CheckCheck, ArrowRight, BellOff,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import {
  useAnnouncements, useActiveSessions, usePercentage, useMyCourses,
  useTeacherSessions, useTeacherAlerts, useTeacherAnalytics,
  useAdminDashboard, useProxyAlerts,
} from "@/lib/hooks";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { PercentageResult } from "@/lib/api";
import type { Role } from "@/types/api";

type Kind = "announcement" | "live" | "alert" | "warning" | "info";

interface NotiItem {
  id: string;
  kind: Kind;
  title: string;
  desc?: string;
  time?: string;       // ISO timestamp for ordering / display
  href?: string;
}

const kindMeta: Record<Kind, { Icon: typeof Bell; wrap: string }> = {
  announcement: { Icon: Megaphone, wrap: "bg-brand-50 text-brand-600" },
  live: { Icon: Radio, wrap: "bg-brand-100 text-brand-700" },
  alert: { Icon: ShieldAlert, wrap: "bg-rose-50 text-rose-600" },
  warning: { Icon: AlertTriangle, wrap: "bg-amber-50 text-amber-700" },
  info: { Icon: Info, wrap: "bg-ink-100 text-ink-600" },
};

export function NotificationsView({ role }: { role: Role }) {
  if (role === "ADMIN") return <AdminNotifications />;
  if (role === "TEACHER") return <TeacherNotifications />;
  return <StudentNotifications />;
}

// ---- Role aggregators (each only calls its own role's hooks) ----

function StudentNotifications() {
  const { data: anns = [] } = useAnnouncements();
  const { data: live = [] } = useActiveSessions();
  const { data: pct } = usePercentage();
  const { data: courses = [] } = useMyCourses();

  const items = useMemo<NotiItem[]>(() => {
    const out: NotiItem[] = [];
    live.forEach((s) => out.push({
      id: `live-${s.id}`, kind: "live",
      title: `${s.courseCode} is live now`,
      desc: `${s.courseName} · ${s.sectionName} — mark before it closes`,
      href: "/student/attendance",
    }));
    const p = pct as PercentageResult | undefined;
    if (p?.overall != null && p.overall < 75) {
      out.push({ id: "low-overall", kind: "warning", title: "Attendance below 75%", desc: `Your overall attendance is ${p.overall.toFixed(1)}%. Don't miss upcoming sessions.`, href: "/student/history" });
    }
    p?.perCourse?.filter((c) => c.percentage < 75).slice(0, 3).forEach((c) =>
      out.push({ id: `low-${c.courseCode}`, kind: "warning", title: `Low in ${c.courseCode}`, desc: `${c.courseName} — ${c.percentage.toFixed(0)}% attendance`, href: "/student/courses" }));
    anns.forEach((a) => out.push({ id: `ann-${a.id}`, kind: "announcement", title: a.title, desc: a.body, time: a.createdAt, href: "/student/announcements" }));
    if (courses.length === 0) out.push({ id: "no-courses", kind: "info", title: "You're not enrolled in any class", desc: "Browse available classes and enroll to start tracking attendance.", href: "/student/courses" });
    return out;
  }, [anns, live, pct, courses]);

  return <NotificationsShell role="STUDENT" items={items} />;
}

function TeacherNotifications() {
  const { data: anns = [] } = useAnnouncements();
  const { data: sessions = [] } = useTeacherSessions();
  const { data: alerts = [] } = useTeacherAlerts();
  const { data: analytics } = useTeacherAnalytics();

  const items = useMemo<NotiItem[]>(() => {
    const out: NotiItem[] = [];
    sessions.filter((s) => s.status === "ACTIVE").forEach((s) => out.push({
      id: `live-${s.id}`, kind: "live", title: `Your ${s.courseCode} session is live`,
      desc: `${s.courseName} · ${s.sectionName}`, href: "/teacher/sessions",
    }));
    alerts.filter((a) => a.status === "OPEN" || a.status === "PENDING").slice(0, 6).forEach((a) => out.push({
      id: `alert-${a.id}`, kind: "alert", title: a.description || a.alertType,
      desc: `Risk ${a.riskScore} · ${a.severity}`, time: a.createdAt, href: "/teacher/alerts",
    }));
    analytics?.perClass?.filter((c) => c.attendancePct < 75).slice(0, 4).forEach((c) => out.push({
      id: `low-${c.courseCode}-${c.sectionName}`, kind: "warning",
      title: `${c.courseCode} attendance is low`, desc: `${c.sectionName} — ${c.attendancePct.toFixed(0)}% across ${c.students} students`, href: "/teacher/analytics",
    }));
    anns.forEach((a) => out.push({ id: `ann-${a.id}`, kind: "announcement", title: a.title, desc: a.body, time: a.createdAt, href: "/teacher/announcements" }));
    return out;
  }, [anns, sessions, alerts, analytics]);

  return <NotificationsShell role="TEACHER" items={items} />;
}

function AdminNotifications() {
  const { data: anns = [] } = useAnnouncements();
  const { data: alerts = [] } = useProxyAlerts();
  const { data: dash } = useAdminDashboard();

  const items = useMemo<NotiItem[]>(() => {
    const out: NotiItem[] = [];
    const counters = dash as { activeSessionsNow?: number; openProxyAlerts?: number } | undefined;
    if (counters?.activeSessionsNow) out.push({ id: "live-campus", kind: "live", title: `${counters.activeSessionsNow} session${counters.activeSessionsNow > 1 ? "s" : ""} live across campus`, desc: "Real-time attendance is being collected now.", href: "/admin" });
    alerts.slice(0, 8).forEach((a) => out.push({
      id: `alert-${a.id}`, kind: a.severity === "CRITICAL" || a.severity === "HIGH" ? "alert" : "warning",
      title: a.alertType, desc: `Student #${a.studentId} · Risk ${a.riskScore} · ${a.severity}`, time: a.createdAt, href: "/admin/alerts",
    }));
    anns.forEach((a) => out.push({ id: `ann-${a.id}`, kind: "announcement", title: a.title, desc: a.body, time: a.createdAt, href: "/admin/announcements" }));
    return out;
  }, [anns, alerts, dash]);

  return <NotificationsShell role="ADMIN" items={items} />;
}

// ---- Shared shell with read-state + filtering ----

function NotificationsShell({ role, items }: { role: Role; items: NotiItem[] }) {
  const base = `/${role.toLowerCase()}`;
  const storageKey = `attendai.noti.read.${role}`;
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState("all");

  // Load persisted read ids once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setReadSet(new Set(JSON.parse(raw) as string[]));
    } catch { /* ignore */ }
  }, [storageKey]);

  function persist(next: Set<string>) {
    setReadSet(next);
    try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch { /* ignore */ }
  }
  function markRead(id: string) {
    if (readSet.has(id)) return;
    persist(new Set(readSet).add(id));
  }
  function markAll() {
    persist(new Set(items.map((i) => i.id)));
  }

  // Newest first: items with a timestamp sort by it; live/warnings (no time) float to top.
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ta = a.time ? new Date(a.time).getTime() : Infinity;
      const tb = b.time ? new Date(b.time).getTime() : Infinity;
      return tb - ta;
    });
  }, [items]);

  const unreadCount = sorted.filter((i) => !readSet.has(i.id)).length;
  const visible = tab === "unread" ? sorted.filter((i) => !readSet.has(i.id)) : sorted;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Everything that needs your attention, in one place."
        icon={Bell}
        crumbs={[{ label: role.charAt(0) + role.slice(1).toLowerCase(), href: base }, { label: "Notifications" }]}
        action={unreadCount > 0 ? <Button variant="secondary" onClick={markAll}><CheckCheck className="size-4" /> Mark all read</Button> : undefined}
      />

      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "all", label: "All", count: sorted.length },
            { value: "unread", label: "Unread", count: unreadCount },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <Card className="text-center py-14">
          <div className="size-14 rounded-2xl bg-brand-50 text-brand-600 grid place-items-center mx-auto mb-3">
            <BellOff className="size-6" />
          </div>
          <p className="font-display text-2xl text-ink-900">{tab === "unread" ? "You're all caught up" : "Nothing here yet"}</p>
          <p className="text-sm text-ink-500 mt-1">{tab === "unread" ? "No unread notifications." : "Notifications will appear as things happen."}</p>
        </Card>
      ) : (
        <Card className="p-2 sm:p-3">
          <ul className="divide-y divide-ink-100/70 stagger">
            {visible.map((item) => {
              const meta = kindMeta[item.kind];
              const Icon = meta.Icon;
              const unread = !readSet.has(item.id);
              const Row = (
                <div className={cn("flex items-start gap-3 p-3 rounded-xl transition-colors", item.href && "hover:bg-white/60", unread && "bg-brand-50/40")}>
                  <div className={cn("size-10 rounded-xl grid place-items-center shrink-0", meta.wrap)}>
                    <Icon className={cn("size-[18px]", item.kind === "live" && "animate-pulse-soft")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.9rem] text-ink-900 font-medium truncate">{item.title}</p>
                    {item.desc ? <p className="text-[0.78rem] text-ink-500 line-clamp-2 mt-0.5">{item.desc}</p> : null}
                    {item.time ? <p className="text-[0.68rem] text-ink-400 numeral mt-1">{timeAgo(item.time)}</p> : null}
                  </div>
                  {unread ? <span className="size-2 rounded-full bg-brand-500 shrink-0 mt-2" /> : null}
                  {item.href ? <ArrowRight className="size-4 text-ink-300 shrink-0 mt-2" /> : null}
                </div>
              );
              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link href={item.href} onClick={() => markRead(item.id)} className="block">{Row}</Link>
                  ) : (
                    <button type="button" onClick={() => markRead(item.id)} className="block w-full text-left">{Row}</button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}
