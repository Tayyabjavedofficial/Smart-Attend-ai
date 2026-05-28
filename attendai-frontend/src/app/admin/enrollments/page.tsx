"use client";

import { useState, useEffect } from "react";
import { UserPlus, Loader2, CheckCircle2, AlertCircle, BookOpen, Layers } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useStudents, useCourses, useSections } from "@/lib/hooks";
import { api, ApiError } from "@/lib/api";

const fieldCls = "block w-full h-11 px-3.5 rounded-xl bg-white/70 border border-ink-200/60 text-sm text-ink-900 outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500";

export default function AdminEnrollmentsPage() {
  const { data: students = [] } = useStudents();
  const { data: courses = [] } = useCourses();
  const { data: sections = [] } = useSections();

  const [courseId, setCourseId] = useState<number | "">("");
  const [sectionId, setSectionId] = useState<number | "">("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // When course+section chosen, load who's already enrolled.
  useEffect(() => {
    setResult(null); setError(null);
    if (courseId === "" || sectionId === "") { setEnrolledIds(new Set()); return; }
    let cancelled = false;
    api.admin.enrolledStudentIds(Number(courseId), Number(sectionId))
      .then((ids) => { if (!cancelled) setEnrolledIds(new Set(ids)); })
      .catch(() => { if (!cancelled) setEnrolledIds(new Set()); });
    return () => { cancelled = true; };
  }, [courseId, sectionId]);

  const toggle = (id: number) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const canEnroll = courseId !== "" && sectionId !== "" && selected.size > 0;

  const enroll = async () => {
    if (!canEnroll) return;
    setBusy(true); setResult(null); setError(null);
    try {
      const r = await api.admin.enroll({
        courseId: Number(courseId), sectionId: Number(sectionId),
        studentIds: Array.from(selected),
      });
      setResult(`Enrolled ${r.enrolled}, skipped ${r.skipped} (already enrolled or not found).`);
      setSelected(new Set());
      const ids = await api.admin.enrolledStudentIds(Number(courseId), Number(sectionId));
      setEnrolledIds(new Set(ids));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not enroll students.");
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader
        title="Enrollments"
        subtitle="Enroll students into a course & section so they can mark attendance for it."
        icon={UserPlus}
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Enrollments" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4 items-start max-w-4xl">
        <Card>
          <CardHeader title="Target" subtitle="Pick the course and section." />
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide"><BookOpen className="inline size-3 mr-1" />Course</label>
              <select className={fieldCls} value={courseId} onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">Select a course…</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.courseCode} — {c.courseName}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide"><Layers className="inline size-3 mr-1" />Section</label>
              <select className={fieldCls} value={sectionId} onChange={(e) => setSectionId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">Select a section…</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.sectionName}</option>)}
              </select>
            </div>
            {courseId !== "" && sectionId !== "" ? (
              <p className="text-xs text-ink-400">{enrolledIds.size} student(s) already enrolled here.</p>
            ) : null}
            {result ? <div className="flex items-center gap-2 text-sm text-brand-700"><CheckCircle2 className="size-4" /> {result}</div> : null}
            {error ? <Badge tone="danger">{error}</Badge> : null}
            <Button className="w-full" disabled={!canEnroll || busy} onClick={enroll}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              Enroll {selected.size > 0 ? `${selected.size} ` : ""}student(s)
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Students" subtitle="Tick the students to enroll. Already-enrolled students are marked." />
          {students.length === 0 ? (
            <p className="text-sm text-ink-400 py-6 text-center">No students yet. Create some in Admin → Students.</p>
          ) : (
            <ul className="divide-y divide-ink-100/60 max-h-[60vh] overflow-y-auto">
              {students.map((s) => {
                const already = enrolledIds.has(s.id);
                return (
                  <li key={s.id} className="flex items-center gap-3 py-2.5">
                    <input
                      type="checkbox"
                      className="size-4 accent-brand-600"
                      checked={selected.has(s.id)}
                      disabled={already}
                      onChange={() => toggle(s.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.85rem] text-ink-900 truncate">{s.fullName}</p>
                      <p className="text-[0.7rem] text-ink-400 numeral truncate">{s.registrationNumber ?? "—"} · {s.email}</p>
                    </div>
                    {already ? <Badge tone="success">Enrolled</Badge> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
