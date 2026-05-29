"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Award, BookOpen, Radio, ArrowRight, ScanFace, ClipboardList, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { useMyCourses, usePercentage, useActiveSessions } from "@/lib/hooks";
import { type PercentageResult } from "@/lib/api";
import { cn } from "@/lib/cn";

export default function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const first = user?.fullName?.split(" ")[0] ?? "Student";

  const { data: courses = [] } = useMyCourses();
  const { data: pct } = usePercentage();
  const { data: live = [] } = useActiveSessions();

  const overall = (pct as PercentageResult | undefined)?.overall;
  const pctByCode = useMemo(() => {
    const m = new Map<string, number>();
    (pct as PercentageResult | undefined)?.perCourse?.forEach((c) => m.set(c.courseCode, c.percentage));
    return m;
  }, [pct]);

  return (
    <>
      <PageHeader
        title={`Hello, ${first}`}
        subtitle="Your attendance at a glance."
        icon={Award}
        crumbs={[{ label: "Student", href: "/student" }, { label: "Dashboard" }]}
      />

      {/* Live session banner (only when there's actually a live session) */}
      {live.length > 0 ? (
        <Card className="relative overflow-hidden p-0 mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-700 to-brand-900" />
          <div className="relative p-5 text-white flex flex-wrap items-center gap-4">
            <div className="size-11 rounded-xl bg-white/12 ring-1 ring-white/20 grid place-items-center shrink-0">
              <Radio className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <Badge tone="live" dot>Live now</Badge>
              <p className="font-display text-[1.4rem] leading-tight mt-1">
                {live[0].courseCode} — {live[0].courseName}
              </p>
              <p className="text-white/70 text-xs">{live[0].sectionName}{live.length > 1 ? ` · +${live.length - 1} more live` : ""}</p>
            </div>
            <Link href="/student/attendance">
              <Button className="bg-white text-brand-800 hover:bg-brand-50"><Radio className="size-4" /> Mark attendance</Button>
            </Link>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Overall Attendance" value={overall != null ? `${overall.toFixed(1)}%` : "—"} caption="This semester" icon={Award} accent="brand" />
        <StatCard label="Enrolled Courses" value={courses.length} caption="Tap to manage" icon={BookOpen} accent="blue" />
        <StatCard label="Live Now" value={live.length} caption={live.length ? "Mark before it closes" : "No live sessions"} icon={Radio} accent={live.length ? "brand" : "amber"} chip={live.length ? { label: "Live", tone: "live" } : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 mt-4">
        <Card>
          <CardHeader title="My Courses" subtitle="Attendance per class" right={<Link className="text-xs text-brand-700 hover:underline" href="/student/courses">Manage</Link>} />
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="size-7 text-ink-300 mx-auto mb-2" />
              <p className="text-sm text-ink-500">You haven&apos;t enrolled in any class yet.</p>
              <Link href="/student/courses"><Button variant="secondary" className="mt-3">Enroll in a class</Button></Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {courses.map((c) => {
                const p = pctByCode.get(c.courseCode);
                const low = p != null && p < 80;
                return (
                  <li key={c.enrollmentId}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[0.82rem] text-ink-900 truncate min-w-0">
                        <span className="numeral font-medium">{c.courseCode}</span> — {c.courseName} <span className="text-ink-400">· {c.sectionName}</span>
                      </p>
                      <span className={cn("numeral text-sm font-medium shrink-0", low ? "text-accent-rose" : p != null ? "text-brand-700" : "text-ink-400")}>
                        {p != null ? `${p.toFixed(0)}%` : "—"}
                      </span>
                    </div>
                    <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", low ? "bg-accent-rose" : "bg-gradient-to-r from-brand-500 to-brand-600")} style={{ width: `${p ?? 0}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Quick actions" />
          <div className="space-y-2">
            <QuickLink href="/student/attendance" icon={Radio} title="Mark Attendance" desc="Join a live session" />
            <QuickLink href="/student/face" icon={ScanFace} title="Face Profile" desc="Register / update your face" />
            <QuickLink href="/student/history" icon={ClipboardList} title="Attendance History" desc="Your past records" />
            <QuickLink href="/student/courses" icon={BookOpen} title="My Courses" desc="Enroll or drop classes" />
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs text-ink-400">
            {overall != null && overall < 75 ? (
              <><AlertTriangle className="size-3.5 text-accent-amber mt-0.5 shrink-0" /> Your attendance is below 75% — try not to miss upcoming sessions.</>
            ) : (
              <><CheckCircle2 className="size-3.5 text-brand-600 mt-0.5 shrink-0" /> Keep marking attendance in every live session to stay on track.</>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function QuickLink({ href, icon: Icon, title, desc }: { href: string; icon: typeof Radio; title: string; desc: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-brand-50/60 transition-colors group">
      <div className="size-9 rounded-lg bg-brand-50 text-brand-700 grid place-items-center shrink-0"><Icon className="size-4" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-[0.85rem] text-ink-900">{title}</p>
        <p className="text-[0.7rem] text-ink-400">{desc}</p>
      </div>
      <ArrowRight className="size-4 text-ink-300 group-hover:text-brand-700 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}
