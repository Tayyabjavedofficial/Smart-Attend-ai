"use client";

import { PieChart, Users, Radio, BookOpen, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import { useTeacherAnalytics } from "@/lib/hooks";
import { cn } from "@/lib/cn";

export default function TeacherAnalyticsPage() {
  const { data, isLoading, error, refetch } = useTeacherAnalytics();

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Attendance across the classes you teach."
        icon={PieChart}
        crumbs={[{ label: "Teacher", href: "/teacher" }, { label: "Analytics" }]}
      />

      {error ? (
        <div className="glass rounded-2xl p-12 text-center">
          <AlertCircle className="size-7 text-accent-rose mx-auto mb-2" />
          <p className="font-display text-xl text-ink-900">Couldn&apos;t load analytics</p>
          <p className="text-sm text-ink-500 mt-1 mb-4">{(error as Error).message}</p>
          <Button variant="secondary" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : isLoading || !data ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Loader2 className="size-6 text-brand-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-ink-500">Loading…</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard label="Overall Attendance" value={`${data.overallAttendancePct.toFixed(1)}%`} caption={`${data.totalSessions} sessions held`} icon={TrendingUp} accent="brand" />
            <StatCard label="Students" value={data.totalStudents} caption="across your classes" icon={Users} accent="blue" />
            <StatCard label="Courses" value={data.totalCourses} caption={`${data.perClass.length} class sections`} icon={BookOpen} accent="amber" />
            <StatCard label="Active Now" value={data.activeSessions} caption="live sessions" icon={Radio} accent="brand" chip={data.activeSessions > 0 ? { label: "Live", tone: "live" } : undefined} />
          </div>

          <Card>
            <CardHeader title="By class" subtitle="Attendance rate per course & section." />
            {data.perClass.length === 0 ? (
              <p className="text-sm text-ink-400 py-6 text-center">No classes yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.perClass.map((c, i) => {
                  const low = c.total > 0 && c.attendancePct < 80;
                  return (
                    <li key={i} className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center shrink-0 font-display text-xs">
                        {c.courseCode.replace(/[0-9]/g, "").slice(0, 2) || "C"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.85rem] text-ink-900 truncate">
                          <span className="numeral font-medium">{c.courseCode}</span> — {c.courseName} · <span className="text-ink-400">{c.sectionName}</span>
                        </p>
                        <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden mt-1.5">
                          <div className={cn("h-full rounded-full", low ? "bg-accent-rose" : "bg-gradient-to-r from-brand-500 to-brand-600")} style={{ width: `${c.attendancePct}%` }} />
                        </div>
                        <p className="text-[0.7rem] text-ink-400 mt-1 numeral">
                          {c.students} students · {c.sessions} sessions · {c.present}/{c.total} present
                        </p>
                      </div>
                      <span className={cn("font-display text-[1.4rem] numeral shrink-0", low ? "text-accent-rose" : "text-ink-900")}>
                        {c.total > 0 ? `${c.attendancePct.toFixed(0)}%` : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </>
  );
}
