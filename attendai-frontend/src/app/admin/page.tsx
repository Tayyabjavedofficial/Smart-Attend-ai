"use client";

import {
  Users, GraduationCap, BookOpen, Radio, AlertTriangle,
  TrendingUp, ArrowRight, Activity, ShieldAlert, Building2, Loader2, AlertCircle,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Topbar } from "@/components/layout/Topbar";
import { DonutChart } from "@/components/charts/DonutChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { useAdminDashboard, useProxyAlerts } from "@/lib/hooks";

const monthly = [
  { label: "Jan", value: 86 }, { label: "Feb", value: 88 },
  { label: "Mar", value: 91 }, { label: "Apr", value: 89 },
  { label: "May", value: 92 }, { label: "Jun", value: 93 },
];

const overview = [
  { name: "Present", value: 14820, color: "#1D9E75" },
  { name: "Late", value: 642, color: "#EF9F27" },
  { name: "Absent", value: 488, color: "#C2576B" },
];

const departments = [
  { name: "Computer Science", pct: 94.2, count: 412 },
  { name: "Electrical Eng.", pct: 91.6, count: 286 },
  { name: "Mathematics", pct: 89.8, count: 178 },
  { name: "Business", pct: 87.3, count: 224 },
  { name: "Physics", pct: 85.1, count: 142 },
];

const lowAttendance = [
  { name: "Rohan Mehta", id: "S2021003", pct: 64.2 },
  { name: "Karan Singh", id: "S2021005", pct: 67.8 },
  { name: "Anjali Reddy", id: "S2021014", pct: 71.5 },
  { name: "Aditya Verma", id: "S2021022", pct: 72.3 },
];

interface DashboardCounters {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  activeSessionsNow?: number;
  overallAttendance: number;
  openProxyAlerts: number;
}

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useAdminDashboard();
  const { data: alerts = [] } = useProxyAlerts();

  const counters = data as DashboardCounters | undefined;

  return (
    <>
      <Topbar
        title="Admin Dashboard"
        greeting="System overview · Last refreshed just now."
        actionLabel="System Report"
        actionIcon={Activity}
      />

      {error ? (
        <div className="glass rounded-2xl p-12 text-center mb-4">
          <AlertCircle className="size-7 text-accent-rose mx-auto mb-2" />
          <p className="font-display text-xl text-ink-900">Couldn't load dashboard</p>
          <p className="text-sm text-ink-500 mt-1">{(error as Error).message}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={isLoading ? "…" : (counters?.totalStudents?.toLocaleString() ?? "—")}
          caption="Across all departments"
          delta={{ value: "+24 this month", direction: "up" }}
          icon={Users}
          accent="brand"
        />
        <StatCard
          label="Total Teachers"
          value={isLoading ? "…" : (counters?.totalTeachers?.toString() ?? "—")}
          caption="Faculty members"
          icon={GraduationCap}
          accent="blue"
        />
        <StatCard
          label="Total Courses"
          value={isLoading ? "…" : (counters?.totalCourses?.toString() ?? "—")}
          caption="Offered this term"
          icon={BookOpen}
          accent="amber"
        />
        <StatCard
          label="Active Sessions Now"
          value={isLoading ? "…" : (counters?.activeSessionsNow?.toString() ?? "—")}
          caption="Live across campus"
          icon={Radio}
          accent="rose"
          chip={{ label: "Live", tone: "live" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Institution Attendance Trend"
            subtitle="Last 6 months · monthly average"
            right={
              <span className="inline-flex items-center gap-1.5 text-xs text-brand-700 bg-brand-50/60 px-2.5 py-1 rounded-full">
                <TrendingUp className="size-3" />
                7.0% YoY improvement
              </span>
            }
          />
          <TrendChart data={monthly} height={240} />
        </Card>

        <Card>
          <CardHeader title="Overall Attendance" subtitle="Current term" />
          <div className="flex items-center gap-5">
            <DonutChart
              data={overview}
              size={160}
              centerLabel="Avg"
              centerValue={counters ? `${counters.overallAttendance.toFixed(1)}%` : "—"}
            />
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
                    <span className="numeral text-ink-900 font-medium text-xs">{row.value.toLocaleString()}</span>
                    <span className="numeral text-[0.7rem] text-ink-400 w-10 text-right">{pct}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardHeader title="Department Attendance" right={<Badge>{departments.length} depts</Badge>} />
          <ul className="space-y-3">
            {departments.map((d) => (
              <li key={d.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2 text-ink-700">
                    <Building2 className="size-3.5 text-ink-400" />
                    {d.name}
                  </span>
                  <span className="numeral text-ink-900 font-medium">{d.pct}%</span>
                </div>
                <div className="h-1.5 bg-ink-100/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <p className="text-[0.65rem] text-ink-400 mt-1 numeral">{d.count} students</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Recent Proxy Alerts"
            right={<a className="text-xs text-brand-700 hover:underline cursor-pointer" href="/admin/alerts">View all</a>}
          />
          <ul className="space-y-3">
            {alerts.slice(0, 3).map((a) => {
              const tone = a.severity === "CRITICAL" ? "danger" : a.severity === "HIGH" ? "warning" : "neutral";
              return (
                <li key={a.id} className="flex items-start gap-3">
                  <div className={`size-8 rounded-lg grid place-items-center shrink-0 ${
                    a.severity === "CRITICAL" ? "bg-rose-50 text-rose-700"
                      : a.severity === "HIGH" ? "bg-amber-50 text-amber-700"
                      : "bg-ink-100 text-ink-600"
                  }`}>
                    <ShieldAlert className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge tone={tone}>{a.severity}</Badge>
                      <span className="text-[0.7rem] text-ink-400 truncate">{a.courseCode}</span>
                    </div>
                    <p className="text-[0.82rem] text-ink-900 mt-0.5">{a.alertType}</p>
                    <p className="text-[0.7rem] text-ink-400 truncate">{a.studentName} · {a.studentRegNo}</p>
                  </div>
                </li>
              );
            })}
            {alerts.length === 0 && !isLoading ? (
              <li className="text-center py-4 text-xs text-ink-400">No alerts in the system</li>
            ) : null}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Defaulter Watchlist"
            subtitle="Below 75% threshold"
            right={<a className="text-xs text-brand-700 hover:underline cursor-pointer" href="/admin/reports">Full list</a>}
          />
          <ul className="space-y-2.5">
            {lowAttendance.map((s, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-gradient-to-br from-rose-200 to-rose-400 text-white text-[0.65rem] font-semibold grid place-items-center shrink-0">
                  {s.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0 leading-tight">
                  <p className="text-[0.82rem] text-ink-900 truncate">{s.name}</p>
                  <p className="text-[0.65rem] text-ink-400 numeral">{s.id}</p>
                </div>
                <div className="text-right">
                  <p className="numeral text-sm font-medium text-accent-rose">{s.pct}%</p>
                  <p className="text-[0.6rem] uppercase tracking-wider text-ink-400">below</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
