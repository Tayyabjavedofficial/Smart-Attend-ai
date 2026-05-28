"use client";

import { useMemo } from "react";
import {
  Users, TrendingUp, Radio, BookOpen, Sparkles,
  AlertTriangle, UserMinus, FileText, ArrowRight,
  CheckCircle2, Clock, XCircle, QrCode, Eye, Wifi, WifiOff,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Topbar } from "@/components/layout/Topbar";
import { DonutChart } from "@/components/charts/DonutChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { useAuthStore } from "@/store/authStore";
import { useTeacherSessions, useSessionLive } from "@/lib/hooks";
import { useSessionLiveStream } from "@/lib/stomp";
import { isMock } from "@/lib/api";
import { cn } from "@/lib/cn";

const weeklyTrend = [
  { label: "Mon", value: 88 }, { label: "Tue", value: 91 },
  { label: "Wed", value: 93 }, { label: "Thu", value: 90 },
  { label: "Fri", value: 87 }, { label: "Sat", value: 92.6 },
];

const overview = [
  { name: "Present", value: 2356, color: "#1D9E75" },
  { name: "Late", value: 112, color: "#EF9F27" },
  { name: "Absent", value: 82, color: "#C2576B" },
];

const alerts = [
  { type: "warn", icon: AlertTriangle, title: "2 suspicious attempts detected", subtitle: "In CS201 — AI · 10:20 AM" },
  { type: "info", icon: UserMinus, title: "5 students marked absent today", subtitle: "Across 2 courses" },
  { type: "info", icon: FileText, title: "Weekly report is ready", subtitle: "May 7 – May 13, 2025" },
];

export default function TeacherDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.fullName?.split(" ").slice(0, 2).join(" ") ?? "Teacher";

  const { data: sessions = [] } = useTeacherSessions();

  // The active session is the one we'll subscribe to via STOMP.
  const activeSession = useMemo(() => sessions.find(s => s.status === "ACTIVE"), [sessions]);

  // REST snapshot of live counters (used as fallback when STOMP is silent).
  const liveQuery = useSessionLive(activeSession?.id ?? null);

  // STOMP subscription. Disabled in mock mode (no real broker to connect to).
  const stomp = useSessionLiveStream(activeSession?.id ?? null, { enabled: !isMock });

  // Prefer realtime counters once they arrive; fall back to the REST snapshot.
  const counters = stomp.counters ?? liveQuery.data ?? null;

  const liveTotal = counters?.total ?? 0;
  const livePresent = counters?.present ?? 0;
  const liveLate = counters?.late ?? 0;
  const liveAbsent = counters?.absent ?? 0;
  const liveRate = liveTotal > 0 ? (livePresent / liveTotal) * 100 : 0;

  return (
    <>
      <Topbar
        title="Teacher Dashboard"
        greeting={`Welcome back, ${firstName}. Here's what's happening today.`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value="128"
          caption={`Across ${sessions.length} sessions`}
          delta={{ value: "↑ 8 this month", direction: "up" }}
          icon={Users}
          accent="brand"
        />
        <StatCard
          label="Today's Attendance Rate"
          value={`${liveRate.toFixed(1)}%`}
          caption={`${livePresent} Present · ${liveAbsent} Absent`}
          icon={TrendingUp}
          accent="brand"
        />
        <StatCard
          label="Active Session"
          value={activeSession?.courseCode ?? "—"}
          caption={activeSession
            ? `Section ${activeSession.sectionName} · ${livePresent}/${liveTotal}`
            : "No active session"}
          icon={Radio}
          accent="blue"
          chip={activeSession ? { label: "Live", tone: "live" } : undefined}
        />
        <StatCard
          label="Courses Assigned"
          value="5"
          caption="4 Active · 1 Inactive"
          icon={BookOpen}
          accent="amber"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Live Attendance — STOMP-fed */}
        <Card>
          <CardHeader
            title={`Live Attendance${activeSession ? ` (${activeSession.courseCode})` : ""}`}
            right={
              <ConnectionPill enabled={!isMock} sessionId={activeSession?.id ?? null} state={stomp.state} />
            }
          />
          {activeSession ? (
            <>
              <div className="flex items-center gap-5">
                <DonutChart
                  data={[
                    { name: "Present", value: livePresent, color: "#1D9E75" },
                    { name: "Absent",  value: liveAbsent,  color: "#C2576B" },
                    { name: "Late",    value: liveLate,    color: "#EF9F27" },
                  ]}
                  size={160}
                  centerLabel="Total"
                  centerValue={String(liveTotal || "—")}
                />
                <ul className="flex-1 space-y-2.5 text-sm">
                  {[
                    { label: "Present", color: "#1D9E75", value: livePresent, pct: liveTotal > 0 ? `${((livePresent / liveTotal) * 100).toFixed(1)}%` : "—" },
                    { label: "Absent",  color: "#C2576B", value: liveAbsent,  pct: liveTotal > 0 ? `${((liveAbsent  / liveTotal) * 100).toFixed(1)}%` : "—" },
                    { label: "Late",    color: "#EF9F27", value: liveLate,    pct: liveTotal > 0 ? `${((liveLate    / liveTotal) * 100).toFixed(1)}%` : "—" },
                  ].map((row) => (
                    <li key={row.label} className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-ink-600">
                        <span className="size-2 rounded-full" style={{ background: row.color }} />
                        {row.label}
                      </span>
                      <span className="numeral text-ink-900 font-medium">{row.value}</span>
                      <span className="numeral text-xs text-ink-400 w-12 text-right">{row.pct}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Recent event stream from STOMP */}
              {stomp.events.length > 0 ? (
                <div className="mt-4 pt-3 -mb-1 border-t border-ink-100/80">
                  <p className="text-[0.62rem] uppercase tracking-wider text-ink-400 mb-2">Recent activity</p>
                  <ul className="space-y-1.5 max-h-24 overflow-y-auto">
                    {stomp.events.slice(0, 5).map((ev, i) => (
                      <li key={i} className="text-[0.72rem] text-ink-600 truncate animate-fade-up">
                        {formatEvent(ev)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-center py-8 text-ink-400">
              <Radio className="size-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active session right now.</p>
              <p className="text-xs mt-1">Start one to see live updates here.</p>
            </div>
          )}
        </Card>

        {/* Weekly Trend */}
        <Card>
          <CardHeader
            title="Weekly Attendance Trend"
            right={
              <button className="text-xs text-ink-500 hover:text-ink-900 flex items-center gap-1">
                This Week <span className="text-ink-300">▾</span>
              </button>
            }
          />
          <TrendChart data={weeklyTrend} />
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-700 bg-brand-50/60 px-2.5 py-1 rounded-full">
            <TrendingUp className="size-3" />
            4.6% higher than last week
          </p>
        </Card>

        {/* Overall */}
        <Card>
          <CardHeader title="Attendance Overview" />
          <div className="flex items-center gap-5">
            <DonutChart data={overview} size={160} centerLabel="Overall" centerValue="92.6%" />
            <ul className="flex-1 space-y-2.5 text-sm">
              {overview.map((row) => {
                const total = overview.reduce((s, r) => s + r.value, 0);
                const pct = ((row.value / total) * 100).toFixed(1) + "%";
                return (
                  <li key={row.name} className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-ink-600">
                      <span className="size-2 rounded-full" style={{ background: row.color }} />
                      {row.name}
                    </span>
                    <span className="numeral text-ink-900 font-medium">{row.value.toLocaleString()}</span>
                    <span className="numeral text-xs text-ink-400 w-12 text-right">{pct}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      </div>

      {/* Recent sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 mt-4">
        <Card>
          <CardHeader
            title="Recent Attendance Sessions"
            right={<a className="text-xs text-brand-700 hover:underline cursor-pointer" href="/teacher/sessions">View All</a>}
          />
          <ul className="divide-y divide-ink-100/80">
            {sessions.slice(0, 4).map((s) => (
              <li key={s.id} className="py-3 flex items-center gap-3 first:pt-0 last:pb-0">
                <div className="size-9 rounded-lg bg-brand-50 text-brand-700 grid place-items-center shrink-0">
                  <BookOpen className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.85rem] font-medium text-ink-900 truncate">
                    <span className="numeral">{s.courseCode}</span> — {s.courseName}
                  </p>
                  <p className="text-[0.72rem] text-ink-400 truncate numeral">
                    {new Date(s.startTime).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Badge tone={s.status === "ACTIVE" ? "live" : "neutral"} dot={s.status === "ACTIVE"}>
                    {s.status[0] + s.status.slice(1).toLowerCase()}
                  </Badge>
                  <p className="text-[0.7rem] text-ink-400 mt-1 numeral">{s.present} / {s.total}</p>
                </div>
              </li>
            ))}
            {sessions.length === 0 ? (
              <li className="py-6 text-center text-sm text-ink-400">No sessions yet.</li>
            ) : null}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="p-0 overflow-hidden">
            <h3 className="text-[0.65rem] uppercase tracking-wider text-ink-400 px-5 pt-5 mb-3">Quick Actions</h3>
            <QuickAction icon={Radio} title="Start Session" subtitle="Begin a new attendance session" featured href="/teacher/sessions" />
            <QuickAction icon={QrCode} title="Generate Code" subtitle="Create QR / code for attendance" href="/teacher/sessions" />
            <QuickAction icon={Eye} title="View Reports" subtitle="Check detailed attendance reports" href="/teacher/reports" />
          </Card>

          <Card>
            <CardHeader title="Alerts & Notifications" />
            <ul className="space-y-2.5">
              {alerts.map((a, i) => {
                const Icon = a.icon;
                const accent = a.type === "warn" ? "bg-amber-50 text-amber-700" : "bg-brand-50 text-brand-700";
                return (
                  <li key={i} className="flex items-start gap-2.5 cursor-pointer hover:bg-white/40 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                    <div className={cn("size-7 rounded-lg grid place-items-center shrink-0", accent)}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.78rem] text-ink-900 truncate">{a.title}</p>
                      <p className="text-[0.68rem] text-ink-400 truncate">{a.subtitle}</p>
                    </div>
                    <ArrowRight className="size-3.5 text-ink-300 shrink-0 mt-2" />
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      {/* AI Insights footer */}
      <div className="mt-4 relative overflow-hidden rounded-2xl glass-dark text-white p-5">
        <svg className="absolute inset-y-0 right-0 h-full w-1/2 opacity-[0.10] pointer-events-none" viewBox="0 0 400 200" fill="none">
          <path d="M0 100 L80 100 L120 60 L200 60 L240 140 L320 140 L360 100 L400 100" stroke="white" strokeWidth="1" />
          <path d="M0 40 L60 40 L100 80 L180 80 L220 30 L300 30" stroke="white" strokeWidth="1" />
          <path d="M0 160 L70 160 L110 130 L210 130 L250 170 L330 170" stroke="white" strokeWidth="1" />
        </svg>

        <div className="flex flex-wrap items-center gap-6 lg:gap-10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-brand-500/30 ring-1 ring-brand-300/30 grid place-items-center">
              <Sparkles className="size-5 text-brand-200" />
            </div>
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/50">AttendAI Insights</p>
              <p className="font-display text-[1.3rem] leading-tight text-white max-w-[300px]">
                Our AI detects patterns and helps you improve attendance &amp; engagement.
              </p>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-4 sm:gap-6 min-w-[280px]">
            {[
              { label: "Engagement Score", value: "87/100", trend: "↑ 12 pts from last week" },
              { label: "At Risk Students", value: "4", trend: "Need your attention" },
              { label: "Predicted Attendance", value: "94%", trend: "Next week forecast" },
            ].map((m) => (
              <div key={m.label} className="border-l border-white/15 pl-3">
                <p className="text-[0.62rem] uppercase tracking-wider text-white/45">{m.label}</p>
                <p className="font-display text-[1.6rem] text-white numeral leading-tight mt-0.5">{m.value}</p>
                <p className="text-[0.65rem] text-brand-200/90 mt-0.5">{m.trend}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function QuickAction({
  icon: Icon, title, subtitle, featured = false, href,
}: { icon: typeof Radio; title: string; subtitle: string; featured?: boolean; href: string }) {
  return (
    <a href={href}
      className={cn(
        "w-full text-left px-5 py-3 flex items-center gap-3 transition-colors group",
        featured
          ? "bg-gradient-to-r from-brand-800 to-brand-700 text-white"
          : "hover:bg-white/40 text-ink-900 border-t border-ink-100/80"
      )}
    >
      <div className={cn(
        "size-9 rounded-lg grid place-items-center shrink-0",
        featured ? "bg-white/10 ring-1 ring-white/15" : "bg-brand-50 text-brand-700"
      )}>
        <Icon className={cn("size-4", featured && "text-white")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", featured && "text-white")}>{title}</p>
        <p className={cn("text-[0.7rem] truncate", featured ? "text-white/60" : "text-ink-400")}>{subtitle}</p>
      </div>
      <ArrowRight className={cn(
        "size-4 shrink-0 transition-transform group-hover:translate-x-0.5",
        featured ? "text-white" : "text-ink-300"
      )} />
    </a>
  );
}

function ConnectionPill({
  enabled, sessionId, state,
}: { enabled: boolean; sessionId: number | null; state: string }) {
  if (sessionId == null) return null;
  if (!enabled) {
    return <span className="inline-flex items-center gap-1 text-[0.65rem] text-ink-400">
      <WifiOff className="size-3" /> Mock mode
    </span>;
  }
  if (state === "connected") {
    return <Badge tone="live" dot>Live</Badge>;
  }
  if (state === "connecting") {
    return <span className="inline-flex items-center gap-1 text-[0.65rem] text-ink-400 animate-pulse">
      <Wifi className="size-3" /> Connecting…
    </span>;
  }
  return <span className="inline-flex items-center gap-1 text-[0.65rem] text-accent-rose">
    <WifiOff className="size-3" /> {state === "error" ? "Offline" : "Disconnected"}
  </span>;
}

function formatEvent(ev: ReturnType<typeof useSessionLiveStream>["events"][number]): string {
  switch (ev.type) {
    case "ATTENDANCE_MARKED":
      return `${ev.studentName} → ${ev.status.toLowerCase()} (risk ${ev.riskScore})`;
    case "CHALLENGE_STARTED":
      return `Challenge ${ev.challengeCode} started`;
    case "CHALLENGE_EXPIRED":
      return `Challenge expired`;
    case "SESSION_STARTED":
      return `Session started`;
    case "SESSION_CLOSED":
      return `Session closed`;
  }
}
