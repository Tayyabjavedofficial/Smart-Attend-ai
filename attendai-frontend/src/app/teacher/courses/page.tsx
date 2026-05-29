"use client";

import { BookOpen, GraduationCap, Layers, Loader2, AlertCircle, Radio } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTeacherCourses } from "@/lib/hooks";
import { type TeacherCourseOption } from "@/lib/api";

export default function TeacherCoursesPage() {
  const { data: classes = [], isLoading, error, refetch } = useTeacherCourses();
  const list = classes as TeacherCourseOption[];

  return (
    <>
      <PageHeader
        title="My Courses"
        subtitle={`${list.length} class${list.length === 1 ? "" : "es"} assigned to you.`}
        icon={BookOpen}
        crumbs={[{ label: "Teacher", href: "/teacher" }, { label: "Courses" }]}
      />

      {error ? (
        <div className="glass rounded-2xl p-12 text-center">
          <AlertCircle className="size-7 text-accent-rose mx-auto mb-2" />
          <p className="font-display text-xl text-ink-900">Couldn&apos;t load courses</p>
          <p className="text-sm text-ink-500 mt-1 mb-4">{(error as Error).message}</p>
          <Button variant="secondary" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : isLoading ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Loader2 className="size-6 text-brand-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-ink-500">Loading…</p>
        </div>
      ) : list.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <BookOpen className="size-8 text-ink-300 mx-auto mb-2" />
          <p className="font-display text-xl text-ink-700">No courses assigned</p>
          <p className="text-sm text-ink-400 mt-1">Ask an admin to assign you to a course &amp; section (Admin → Assignments).</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((c) => (
            <Card key={c.assignmentId}>
              <div className="flex items-start gap-3 mb-3">
                <div className="size-11 rounded-xl grid place-items-center shrink-0 text-white font-display text-sm bg-gradient-to-br from-brand-500 to-brand-700">
                  {c.courseCode.replace(/[0-9]/g, "").slice(0, 2) || "C"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.7rem] uppercase tracking-wider text-ink-400 numeral">{c.courseCode}</p>
                  <h3 className="font-display text-[1.2rem] leading-tight text-ink-900 truncate">{c.courseName}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-500 mb-4">
                <Layers className="size-3 text-ink-400" />
                <span className="numeral">{c.sectionName}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-ink-100/80">
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-400">
                  <GraduationCap className="size-3.5" /> You teach this
                </span>
                <Link href="/teacher/sessions" className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:text-brand-800">
                  <Radio className="size-3.5" /> Start session
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
