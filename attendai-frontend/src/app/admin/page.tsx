"use client";

import Link from "next/link";
import {
  Users, GraduationCap, BookOpen, Radio, ShieldAlert, Layers,
  ClipboardList, UserPlus, Smartphone, FileText, LayoutDashboard,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { DonutChart } from "@/components/charts/DonutChart";
import { useAdminDashboard, useProxyAlerts } from "@/lib/hooks";
import { cn } from "@/lib/cn";

interface DashboardCounters {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  activeSessionsNow?: number;
  overallAttendance: number;
  openProxyAlerts: number;
}

const MANAGE = [
  { href: "/admin/students", icon: Users, label: "Students" },
  { href: "/admin/teachers", icon: GraduationCap, label: "Teachers" },
  { href: "/admin/courses", icon: BookOpen, label: "Courses" },
  { href: "/admin/sections", icon: Layers, label: "Sections" },
  { href: "/admin/assignments", icon: ClipboardList, label: "Assignments" },
  { href: "/admin/enrollments", icon: UserPlus, label: "Enrollments" },
  { href: "/admin/devices", icon: Smartphone, label: "Devices" },
  { href: "/admin/alerts", icon: ShieldAlert, label: "Alerts" },
];

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useAdminDashboard();
  const { data: alerts = [] } = useProxyAlerts();
  const counters = data as DashboardCounters | undefined;

  const overall = counters?.overallAttendance ?? 0;

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        subtitle="System overview and management hub."
        icon={LayoutDashboard}
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Dashboard" }]}
        action={<Link href="/admin/reports"><Button><FileText className="size-4" /> Reports</Button></Link>}
      />

      {error ? (
        <div className="glass rounded-2xl p-10 text-center mb-4">
          <AlertCircle className="size-7 text-accent-rose mx-auto mb-2" />
          <p className="font-display text-xl text-ink-900">Couldn&apos;t load dashboard</p>
          <p className="text-sm text-ink-500 mt-1">{(error as Error).message}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={isLoading ? "…" : (counters?.totalStudents?.toLocaleString() ?? "—")} caption="Registered" icon={Users} accent="brand" />
        <StatCard label="Total Teachers" value={isLoading ? "…" : (counters?.totalTeachers ?? "—")} caption="Faculty members" icon={GraduationCap} accent="blue" />
        <StatCard label="Total Courses" value={isLoading ? "…" : (counters?.totalCourses ?? "—")} caption="Offered this term" icon={BookOpen} accent="amber" />
        <StatCard
          label="Active Sessions"
          value={isLoading ? "…" : (counters?.activeSessionsNow ?? 0)}
          caption={counters?.activeSessionsNow ? "Live across campus" : "None live now"}
          icon={Radio}
          accent={counters?.activeSessionsNow ? "rose" : "amber"}
          chip={counters?.activeSessionsNow ? { label: "Live", tone: "live" } : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Management hub */}
        <Card className="lg:col-span-2">
          <CardHeader title="Management" subtitle="Jump to any admin area" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {MANAGE.map((m) => (
              <Link key={m.href} href={m.href} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/40 hover:bg-brand-50/70 border border-ink-100/70 transition-colors group">
                <div className="size-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center group-hover:scale-105 transition-transform"><m.icon className="size-5" /></div>
                <span className="text-[0.78rem] text-ink-800">{m.label}</span>
              </Link>
            ))}
          </div>
        </Card>

        {/* Overall attendance ring */}
        <Card>
          <CardHeader title="Overall Attendance" subtitle="Current term" />
          <div className="flex flex-col items-center gap-4 py-2">
            <DonutChart
              data={[
                { name: "Present", value: Math.round(overall), color: "#1D9E75" },
                { name: "Remaining", value: Math.max(0, 100 - Math.round(overall)), color: "#E7EAE8" },
              ]}
              size={170}
              centerLabel="Average"
              centerValue={counters ? `${overall.toFixed(1)}%` : "—"}
            />
            <div className="w-full grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-rose-50/70 py-2.5">
                <p className="numeral text-lg font-semibold text-rose-700">{counters?.openProxyAlerts ?? 0}</p>
                <p className="text-[0.65rem] uppercase tracking-wider text-ink-400">Open alerts</p>
              </div>
              <div className="rounded-xl bg-brand-50/70 py-2.5">
                <p className="numeral text-lg font-semibold text-brand-700">{counters?.activeSessionsNow ?? 0}</p>
                <p className="text-[0.65rem] uppercase tracking-wider text-ink-400">Live now</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent proxy alerts — real */}
      <Card className="mt-4">
        <CardHeader title="Recent Proxy Alerts" right={<Link className="text-xs text-brand-700 hover:underline" href="/admin/alerts">View all</Link>} />
        {alerts.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">No proxy alerts in the system.</p>
        ) : (
          <ul className="divide-y divide-ink-100/80">
            {alerts.slice(0, 6).map((a) => {
              const tone = a.severity === "CRITICAL" ? "danger" : a.severity === "HIGH" ? "warning" : "neutral";
              return (
                <li key={a.id} className="py-3 flex items-center gap-3 first:pt-0 last:pb-0">
                  <div className={cn("size-9 rounded-lg grid place-items-center shrink-0",
                    a.severity === "CRITICAL" ? "bg-rose-50 text-rose-700" : a.severity === "HIGH" ? "bg-amber-50 text-amber-700" : "bg-ink-100 text-ink-600")}>
                    <ShieldAlert className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.85rem] text-ink-900 truncate">{a.alertType}</p>
                    <p className="text-[0.7rem] text-ink-400 truncate numeral">Student #{a.studentId} · Risk {a.riskScore}</p>
                  </div>
                  <Badge tone={tone}>{a.severity}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
