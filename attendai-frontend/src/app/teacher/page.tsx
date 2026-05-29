"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Users, TrendingUp, Radio, BookOpen, AlertTriangle, ArrowRight,
  Eye, Wifi, WifiOff, ShieldAlert, BarChart3,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { DonutChart } from "@/components/charts/DonutChart";
import { useAuthStore } from "@/store/authStore";
import { useTeacherSessions, useSessionLive, useTeacherAnalytics, useTeacherAlerts } from "@/lib/hooks";
import { useSessionLiveStream } from "@/lib/stomp";
import { isMock } from "@/lib/api";
import { cn } from "@/lib/cn";

export default function TeacherDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.fullName?.split(" ").slice(0, 2).join(" ") ?? "Teacher";

  const { data: sessions = [] } = useTeacherSessions();
  const { data: analytics } = useTeacherAnalytics();
  const { data: alerts = [] } = useTeacherAlerts();

  const activeSession = useMemo(() => sessions.find((s) => s.status === "ACTIVE"), [sessions]);

  const liveQuery = useSessionLive(activeSession?.id ?? null);
  const stomp = useSessionLiveStream(activeSession?.id ?? null, { enabled: !isMock });
  const counters = stomp.counters ?? liveQuery.data ?? null;

  const liveTotal = counters?.total ?? 0;
  const livePresent = counters?.present ?? 0;
  const liveLate = counters?.late ?? 0;
  const liveAbsent = counters?.absent ?? 0;

  const openAlerts = useMemo(() => alerts.filter((a) => a.status === "OPEN" || a.status === "PENDING"), [alerts]);

  return (
    <>
      <PageHeader
        title="Teacher Dashboard"
        subtitle={`Welcome back, ${firstName}. Here's your teaching at a glance.`}
        icon={BarChart3}
        crumbs={[{ label: "Teacher", href: "/teacher" }, { label: "Dashboard" }]}
        action={
          <Link href="/teacher/sessions">
            <Button><Radio className="size-4" /> Manage sessions</Button>
          </Link>
        }
      />

      {/* Stat cards — real analytics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={analytics?.totalStudents ?? "—"} caption={`Across ${analytics?.totalCourses ?? 0} classes`} icon={Users} accent="brand" />
        <StatCard label="Overall Attendance" value={analytics != null ? `${analytics.overallAttendancePct.toFixed(1)}%` : "—"} caption={`${analytics?.totalSessions ?? 0} sessions held`} icon={TrendingUp} accent="brand" />
        <StatCard
          label="Active Session"
          value={activeSession?.courseCode ?? "—"}
          caption={activeSession ? `Section ${activeSession.sectionName} · ${livePresent}/${liveTotal}` : "No active session"}
          icon={Radio}
          accent="blue"
          chip={activeSession ? { label: "Live", tone: "live" } : undefined}
        />
        <StatCard label="Open Alerts" value={openAlerts.length} caption={openAlerts.length ? "Proxy attempts flagged" : "All clear"} icon={ShieldAlert} accent={openAlerts.length ? "rose" : "amber"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 mt-4">
        {/* Live Attendance — real STOMP */}
        <Card>
          <CardHeader
            title={`Live Attendance${activeSession ? ` · ${activeSession.courseCode}` : ""}`}
            right={<ConnectionPill enabled={!isMock} sessionId={activeSession?.id ?? null} state={stomp.state} />}
          />
          {activeSession ? (
            <div className="flex items-center gap-5">
              <DonutChart
                data={[
                  { name: "Present", value: livePresent, color: "#1D9E75" },
                  { name: "Absent", value: liveAbsent, color: "#C2576B" },
                  { name: "Late", value: liveLate, color: "#EF9F27" },
                ]}
                size={150}
                centerLabel="Marked"
                centerValue={String(liveTotal || "—")}
              />
              <ul className="flex-1 space-y-2.5 text-sm">
                {[
                  { label: "Present", color: "#1D9E75", value: livePresent },
                  { label: "Late", color: "#EF9F27", value: liveLate },
                  { label: "Absent", color: "#C2576B", value: liveAbsent },
                ].map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-ink-600">
                      <span className="size-2 rounded-full" style={{ background: row.color }} /> {row.label}
                    </span>
                    <span className="numeral text-ink-900 font-medium">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-10 text-ink-400">
              <Radio className="size-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active session right now.</p>
              <Link href="/teacher/sessions" className="text-xs text-brand-700 hover:underline mt-1 inline-block">Start a session →</Link>
            </div>
          )}
        </Card>

        {/* Class performance — real per-class analytics */}
        <Card>
          <CardHeader title="Class Performance" subtitle="Attendance by class" right={<Link className="text-xs text-brand-700 hover:underline" href="/teacher/analytics">Details</Link>} />
          {analytics && analytics.perClass.length > 0 ? (
            <ul className="space-y-3">
              {analytics.perClass.slice(0, 6).map((c, i) => {
                const low = c.attendancePct < 75;
                return (
                  <li key={i}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[0.82rem] text-ink-900 truncate min-w-0">
                        <span className="numeral font-medium">{c.courseCode}</span> <span className="text-ink-400">· {c.sectionName} · {c.students} students</span>
                      </p>
                      <span className={cn("numeral text-sm font-medium shrink-0", low ? "text-accent-rose" : "text-brand-700")}>{c.attendancePct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", low ? "bg-accent-rose" : "bg-gradient-to-r from-brand-500 to-brand-600")} style={{ width: `${c.attendancePct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-10 text-ink-400">
              <BookOpen className="size-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No classes assigned yet.</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 mt-4">
        {/* Recent sessions — real */}
        <Card>
          <CardHeader title="Recent Sessions" right={<Link className="text-xs text-brand-700 hover:underline" href="/teacher/sessions">View all</Link>} />
          <ul className="divide-y divide-ink-100/80">
            {sessions.slice(0, 5).map((s) => (
              <li key={s.id} className="py-3 flex items-center gap-3 first:pt-0 last:pb-0">
                <div className="size-9 rounded-lg bg-brand-50 text-brand-700 grid place-items-center shrink-0"><BookOpen className="size-4" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.85rem] font-medium text-ink-900 truncate"><span className="numeral">{s.courseCode}</span> — {s.courseName}</p>
                  <p className="text-[0.72rem] text-ink-400 truncate numeral">
                    {s.startTime ? new Date(s.startTime).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Not started"} · {s.sectionName}
                  </p>
                </div>
                <Badge tone={s.status === "ACTIVE" ? "live" : "neutral"} dot={s.status === "ACTIVE"}>
                  {s.status[0] + s.status.slice(1).toLowerCase()}
                </Badge>
              </li>
            ))}
            {sessions.length === 0 ? <li className="py-8 text-center text-sm text-ink-400">No sessions yet.</li> : null}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="p-0 overflow-hidden">
            <h3 className="text-[0.65rem] uppercase tracking-wider text-ink-400 px-5 pt-5 mb-3">Quick actions</h3>
            <QuickAction icon={Radio} title="Start Session" subtitle="Begin a new attendance session" featured href="/teacher/sessions" />
            <QuickAction icon={Users} title="My Students" subtitle="Browse and filter your roster" href="/teacher/students" />
            <QuickAction icon={Eye} title="Analytics" subtitle="Per-class attendance breakdown" href="/teacher/analytics" />
          </Card>

          <Card>
            <CardHeader title="Recent Alerts" right={<Link className="text-xs text-brand-700 hover:underline" href="/teacher/alerts">All</Link>} />
            {openAlerts.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-400">No open alerts.</p>
            ) : (
              <ul className="space-y-2.5">
                {openAlerts.slice(0, 4).map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5">
                    <div className={cn("size-7 rounded-lg grid place-items-center shrink-0", a.severity === "HIGH" || a.severity === "CRITICAL" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700")}>
                      <AlertTriangle className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.78rem] text-ink-900 truncate">{a.description || a.alertType}</p>
                      <p className="text-[0.68rem] text-ink-400 truncate numeral">Risk {a.riskScore} · {new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function QuickAction({ icon: Icon, title, subtitle, featured = false, href }: { icon: typeof Radio; title: string; subtitle: string; featured?: boolean; href: string }) {
  return (
    <Link href={href}
      className={cn(
        "w-full text-left px-5 py-3 flex items-center gap-3 transition-colors group",
        featured ? "bg-gradient-to-r from-brand-800 to-brand-700 text-white" : "hover:bg-white/40 text-ink-900 border-t border-ink-100/80"
      )}
    >
      <div className={cn("size-9 rounded-lg grid place-items-center shrink-0", featured ? "bg-white/10 ring-1 ring-white/15" : "bg-brand-50 text-brand-700")}>
        <Icon className={cn("size-4", featured && "text-white")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", featured && "text-white")}>{title}</p>
        <p className={cn("text-[0.7rem] truncate", featured ? "text-white/60" : "text-ink-400")}>{subtitle}</p>
      </div>
      <ArrowRight className={cn("size-4 shrink-0 transition-transform group-hover:translate-x-0.5", featured ? "text-white" : "text-ink-300")} />
    </Link>
  );
}

function ConnectionPill({ enabled, sessionId, state }: { enabled: boolean; sessionId: number | null; state: string }) {
  if (sessionId == null) return null;
  if (!enabled) return <span className="inline-flex items-center gap-1 text-[0.65rem] text-ink-400"><WifiOff className="size-3" /> Mock mode</span>;
  if (state === "connected") return <Badge tone="live" dot>Live</Badge>;
  if (state === "connecting") return <span className="inline-flex items-center gap-1 text-[0.65rem] text-ink-400 animate-pulse"><Wifi className="size-3" /> Connecting…</span>;
  return <span className="inline-flex items-center gap-1 text-[0.65rem] text-accent-rose"><WifiOff className="size-3" /> {state === "error" ? "Offline" : "Disconnected"}</span>;
}
