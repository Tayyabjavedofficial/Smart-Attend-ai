"use client";

import { useState, useMemo } from "react";
import {
  BookOpen, TrendingUp, AlertTriangle, GraduationCap, Plus, Loader2,
  Trash2, CheckCircle2, Layers,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  useMyCourses, usePercentage, useAvailableClasses, useEnrollSelf, useUnenrollSelf,
} from "@/lib/hooks";
import { type StudentCourseSummary, type AvailableClass, type PercentageResult, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";

export default function StudentCoursesPage() {
  const { data: courses = [], isLoading } = useMyCourses();
  const { data: pct } = usePercentage();
  const { data: available = [] } = useAvailableClasses();
  const enroll = useEnrollSelf();
  const drop = useUnenrollSelf();

  const [browseOpen, setBrowseOpen] = useState(false);
  const [toDrop, setToDrop] = useState<StudentCourseSummary | null>(null);

  // Map courseCode → attendance %.
  const pctByCode = useMemo(() => {
    const m = new Map<string, number>();
    (pct as PercentageResult | undefined)?.perCourse?.forEach((c) => m.set(c.courseCode, c.percentage));
    return m;
  }, [pct]);

  const enrollError = enroll.error as ApiError | undefined;

  return (
    <>
      <PageHeader
        title="My Courses"
        subtitle={`${courses.length} enrolled ${courses.length === 1 ? "class" : "classes"}.`}
        icon={BookOpen}
        crumbs={[{ label: "Student", href: "/student" }, { label: "Courses" }]}
        action={
          <Button onClick={() => setBrowseOpen(true)}>
            <Plus className="size-4" /> Enroll in a class
          </Button>
        }
      />

      {isLoading ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Loader2 className="size-6 text-brand-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-ink-500">Loading…</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <BookOpen className="size-8 text-ink-300 mx-auto mb-2" />
          <p className="font-display text-xl text-ink-700">No classes yet</p>
          <p className="text-sm text-ink-400 mt-1 mb-4">Enroll in a class to start marking attendance for it.</p>
          <Button onClick={() => setBrowseOpen(true)}><Plus className="size-4" /> Enroll in a class</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => {
            const p = pctByCode.get(c.courseCode);
            const low = p != null && p < 80;
            return (
              <Card key={c.enrollmentId}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn("size-11 rounded-xl grid place-items-center shrink-0 text-white font-display text-sm",
                    low ? "bg-gradient-to-br from-accent-rose to-rose-600" : "bg-gradient-to-br from-brand-500 to-brand-700")}>
                    {c.courseCode.replace(/[0-9]/g, "").slice(0, 2) || "C"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.7rem] uppercase tracking-wider text-ink-400 numeral">{c.courseCode}</p>
                    <h3 className="font-display text-[1.2rem] leading-tight text-ink-900 truncate">{c.courseName}</h3>
                  </div>
                  <button onClick={() => setToDrop(c)} className="text-ink-300 hover:text-accent-rose" aria-label="Drop class">
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-ink-500 mb-4">
                  <Layers className="size-3 text-ink-400" />
                  <span className="numeral">{c.sectionName}</span>
                </div>

                <div>
                  <div className="flex items-end justify-between mb-1.5">
                    <span className="text-[0.7rem] uppercase tracking-wider text-ink-400">Attendance</span>
                    <span className={cn("font-display text-[1.8rem] leading-none numeral", low ? "text-accent-rose" : "text-ink-900")}>
                      {p != null ? `${p.toFixed(1)}%` : "—"}
                    </span>
                  </div>
                  <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", low ? "bg-accent-rose" : "bg-gradient-to-r from-brand-500 to-brand-600")}
                      style={{ width: `${p ?? 0}%` }} />
                  </div>
                  <p className="text-[0.7rem] text-ink-400 mt-1.5">{p != null ? "" : "No sessions yet"}</p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-ink-100/80">
                  {p == null ? (
                    <Badge tone="neutral" dot>New</Badge>
                  ) : low ? (
                    <Badge tone="warning" dot><AlertTriangle className="size-2.5" /> Below threshold</Badge>
                  ) : (
                    <Badge tone="success" dot><TrendingUp className="size-2.5" /> On track</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Browse / enroll */}
      <Modal
        open={browseOpen}
        onClose={() => setBrowseOpen(false)}
        title="Enroll in a class"
        description="Pick a class offered by your teachers."
        footer={<Button variant="ghost" onClick={() => setBrowseOpen(false)}>Done</Button>}
      >
        {enrollError ? <div className="mb-3"><Badge tone="danger">{enrollError.message}</Badge></div> : null}
        {(available as AvailableClass[]).length === 0 ? (
          <p className="text-sm text-ink-400 py-6 text-center">
            No classes are offered yet. A teacher needs to be assigned to a course/section first (Admin → Assignments).
          </p>
        ) : (
          <ul className="divide-y divide-ink-100/60 max-h-[55vh] overflow-y-auto">
            {(available as AvailableClass[]).map((a) => (
              <li key={`${a.courseId}:${a.sectionId}`} className="flex items-center gap-3 py-3">
                <div className="size-9 rounded-lg bg-brand-50 text-brand-700 grid place-items-center shrink-0">
                  <BookOpen className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.85rem] text-ink-900 truncate">
                    <span className="numeral font-medium">{a.courseCode}</span> — {a.courseName}
                  </p>
                  <p className="text-[0.7rem] text-ink-400 truncate flex items-center gap-1">
                    <GraduationCap className="size-3" /> {a.teacherName} · {a.sectionName}
                  </p>
                </div>
                {a.enrolled ? (
                  <Badge tone="success"><CheckCircle2 className="size-3" /> Enrolled</Badge>
                ) : (
                  <Button size="sm" disabled={enroll.isPending}
                    onClick={() => enroll.mutate({ courseId: a.courseId, sectionId: a.sectionId })}>
                    {enroll.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Enroll
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* Drop confirm */}
      <Modal
        open={!!toDrop}
        onClose={() => setToDrop(null)}
        size="sm"
        title="Drop this class?"
        description={toDrop ? `${toDrop.courseCode} — ${toDrop.courseName} (${toDrop.sectionName})` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDrop(null)} disabled={drop.isPending}>Cancel</Button>
            <Button variant="danger" disabled={drop.isPending}
              onClick={() => { if (toDrop) drop.mutate(toDrop.enrollmentId, { onSuccess: () => setToDrop(null) }); }}>
              {drop.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Drop class
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">You can re-enroll anytime. Your past attendance records are kept.</p>
      </Modal>
    </>
  );
}
