"use client";

import { BookOpen, TrendingUp, AlertTriangle, ArrowRight, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

const courses = [
  { code: "CS201", name: "Artificial Intelligence", teacher: "Dr. Sarah Johnson", section: "BCS-7A", credits: 3, pct: 94.0, sessions: { attended: 14, total: 15 } },
  { code: "CS205", name: "Data Structures", teacher: "Prof. Rizwan Khan", section: "BCS-7A", credits: 4, pct: 88.5, sessions: { attended: 13, total: 15 } },
  { code: "CS301", name: "Database Systems", teacher: "Dr. Mohammed Iqbal", section: "BCS-7A", credits: 3, pct: 91.2, sessions: { attended: 12, total: 13 } },
  { code: "MA210", name: "Discrete Mathematics", teacher: "Prof. Ayesha Shah", section: "BCS-7A", credits: 3, pct: 79.8, sessions: { attended: 10, total: 13 } },
  { code: "CS101", name: "Programming Basics", teacher: "Prof. Rizwan Khan", section: "BCS-7A", credits: 3, pct: 96.4, sessions: { attended: 14, total: 14 } },
];

export default function StudentCoursesPage() {
  return (
    <>
      <PageHeader
        title="My Courses"
        subtitle={`${courses.length} courses this semester. Tap a course to see session history and trends.`}
        icon={BookOpen}
        crumbs={[{ label: "Student", href: "/student" }, { label: "Courses" }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(c => {
          const lowAttendance = c.pct < 80;
          return (
            <Card key={c.code} className="group cursor-pointer hover:-translate-y-0.5 transition-transform">
              <div className="flex items-start gap-3 mb-3">
                <div className={cn(
                  "size-11 rounded-xl grid place-items-center shrink-0 text-white font-display text-sm font-medium",
                  lowAttendance ? "bg-gradient-to-br from-accent-rose to-rose-600" : "bg-gradient-to-br from-brand-500 to-brand-700"
                )}>
                  {c.code.replace(/[0-9]/g, "").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.7rem] uppercase tracking-wider text-ink-400 numeral">{c.code}</p>
                  <h3 className="font-display text-[1.25rem] leading-tight text-ink-900 truncate">
                    {c.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-ink-500 mb-4">
                <GraduationCap className="size-3 text-ink-400" />
                <span className="truncate">{c.teacher}</span>
                <span className="text-ink-300">·</span>
                <span className="numeral">{c.section}</span>
              </div>

              <div>
                <div className="flex items-end justify-between mb-1.5">
                  <span className="text-[0.7rem] uppercase tracking-wider text-ink-400">Attendance</span>
                  <span className={cn(
                    "font-display text-[1.8rem] leading-none numeral",
                    lowAttendance ? "text-accent-rose" : "text-ink-900"
                  )}>
                    {c.pct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      lowAttendance ? "bg-accent-rose" : "bg-gradient-to-r from-brand-500 to-brand-600"
                    )}
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
                <p className="text-[0.7rem] text-ink-400 mt-1.5 numeral">
                  {c.sessions.attended} of {c.sessions.total} sessions · {c.credits} credit hours
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-ink-100/80">
                {lowAttendance ? (
                  <Badge tone="warning" dot>
                    <AlertTriangle className="size-2.5" />
                    Below threshold
                  </Badge>
                ) : (
                  <Badge tone="success" dot>
                    <TrendingUp className="size-2.5" />
                    On track
                  </Badge>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-brand-700 group-hover:gap-2 transition-all">
                  View details <ArrowRight className="size-3" />
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
