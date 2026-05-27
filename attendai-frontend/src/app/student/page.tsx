"use client";

import {
  CheckCircle2, XCircle, Clock, Radio, ArrowRight, BookOpen, ScanFace,
  Sparkles, Calendar, Award,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Topbar } from "@/components/layout/Topbar";
import { DonutChart } from "@/components/charts/DonutChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { useAuthStore } from "@/store/authStore";

const trend = [
  { label: "Wk 1", value: 92 },
  { label: "Wk 2", value: 88 },
  { label: "Wk 3", value: 94 },
  { label: "Wk 4", value: 90 },
  { label: "Wk 5", value: 93 },
  { label: "Wk 6", value: 96 },
];

const breakdown = [
  { name: "Present", value: 42, color: "#1D9E75" },
  { name: "Late", value: 3, color: "#EF9F27" },
  { name: "Absent", value: 4, color: "#C2576B" },
];

const courses = [
  { code: "CS201", name: "Artificial Intelligence", pct: 94.0, teacher: "Dr. Sarah Johnson" },
  { code: "CS205", name: "Data Structures", pct: 88.5, teacher: "Prof. R. Khan" },
  { code: "CS301", name: "Database Systems", pct: 91.2, teacher: "Dr. M. Iqbal" },
  { code: "MA210", name: "Discrete Mathematics", pct: 79.8, teacher: "Prof. A. Shah" },
];

const recent = [
  { course: "CS201", date: "May 14 · 10:15 AM", status: "Present" as const },
  { course: "CS205", date: "May 13 · 02:00 PM", status: "Present" as const },
  { course: "CS101", date: "May 13 · 10:00 AM", status: "Late" as const },
  { course: "MA210", date: "May 12 · 09:00 AM", status: "Absent" as const },
];

export default function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const first = user?.fullName?.split(" ")[0] ?? "Student";

  return (
    <>
      <Topbar
        title={`Hello, ${first} 👋`}
        greeting="An attendance session is live in your enrolled courses."
        actionLabel="Mark Attendance"
        actionIcon={Radio}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Overall Attendance" value="87.5%" caption="This semester" delta={{ value: "↑ 2.1% vs last month", direction: "up" }} icon={Award} accent="brand" />
        <StatCard label="Present Classes" value="42" caption="Out of 49" icon={CheckCircle2} accent="brand" />
        <StatCard label="Late" value="3" caption="Within the 15-min grace window" icon={Clock} accent="amber" />
        <StatCard label="Absent" value="4" caption="2 excused · 2 unexcused" icon={XCircle} accent="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 mt-4">
        {/* Active session call-to-action */}
        <Card className="relative overflow-hidden p-0">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800" />
          <svg className="absolute -right-12 -top-12 size-72 opacity-10" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="98" stroke="white" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="72" stroke="white" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="46" stroke="white" strokeWidth="0.5" />
          </svg>

          <div className="relative p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Badge tone="live" dot>Live now</Badge>
              <span className="text-[0.7rem] uppercase tracking-wider text-white/50">Attendance window</span>
            </div>
            <h2 className="font-display text-[2rem] leading-tight tracking-tight">
              CS201 — Artificial Intelligence
            </h2>
            <p className="text-white/70 text-sm mt-1">
              Dr. Sarah Johnson · Started 10:15 AM · Expires in <span className="text-brand-200 numeral font-medium">00:42</span>
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button size="lg" className="bg-white text-brand-800 hover:bg-brand-50">
                <Radio className="size-4" />
                Mark me present
              </Button>
              <button className="inline-flex items-center gap-2 px-4 h-12 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm transition-colors">
                <ScanFace className="size-4" />
                Verify my face
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
              {[
                { icon: Radio, label: "Live code", value: "G7Q4M" },
                { icon: Calendar, label: "Section", value: "BCS-7A" },
                { icon: Sparkles, label: "AI risk", value: "Low" },
              ].map((b, i) => (
                <div key={i} className="border-l border-white/15 pl-3">
                  <p className="text-white/45 uppercase tracking-wider text-[0.6rem]">{b.label}</p>
                  <p className="text-white font-mono mt-0.5 text-[0.85rem] numeral">{b.value}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Attendance breakdown */}
        <Card>
          <CardHeader title="My Attendance" subtitle="This semester" />
          <div className="flex items-center gap-5">
            <DonutChart data={breakdown} size={150} centerLabel="Overall" centerValue="87.5%" />
            <ul className="flex-1 space-y-2.5 text-sm">
              {breakdown.map((row) => (
                <li key={row.name} className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-ink-600">
                    <span className="size-2 rounded-full" style={{ background: row.color }} />
                    {row.name}
                  </span>
                  <span className="numeral text-ink-900 font-medium">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardHeader title="Attendance Trend" subtitle="Last 6 weeks" />
          <TrendChart data={trend} height={180} />
        </Card>

        <Card>
          <CardHeader
            title="My Courses"
            right={<a className="text-xs text-brand-700 hover:underline cursor-pointer">All</a>}
          />
          <ul className="space-y-3">
            {courses.map((c) => (
              <li key={c.code} className="group">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <p className="text-[0.82rem] text-ink-900 truncate">
                      <span className="numeral font-medium">{c.code}</span> — {c.name}
                    </p>
                    <p className="text-[0.66rem] text-ink-400 truncate">{c.teacher}</p>
                  </div>
                  <span className={`numeral text-sm font-medium ${c.pct < 80 ? "text-accent-rose" : "text-brand-700"}`}>
                    {c.pct}%
                  </span>
                </div>
                <div className="h-1 bg-ink-100/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.pct < 80 ? "bg-accent-rose" : "bg-gradient-to-r from-brand-500 to-brand-600"}`}
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Recent Activity" right={<a className="text-xs text-brand-700 hover:underline cursor-pointer">History</a>} />
          <ul className="divide-y divide-ink-100/80">
            {recent.map((r, i) => {
              const meta = r.status === "Present"
                ? { tone: "success" as const, Icon: CheckCircle2 }
                : r.status === "Late"
                ? { tone: "warning" as const, Icon: Clock }
                : { tone: "danger" as const, Icon: XCircle };
              return (
                <li key={i} className="py-2.5 flex items-center gap-3 first:pt-0 last:pb-0">
                  <div className="size-8 rounded-lg bg-brand-50 text-brand-700 grid place-items-center shrink-0">
                    <BookOpen className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.82rem] text-ink-900 numeral">{r.course}</p>
                    <p className="text-[0.66rem] text-ink-400">{r.date}</p>
                  </div>
                  <Badge tone={meta.tone} dot>{r.status}</Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
