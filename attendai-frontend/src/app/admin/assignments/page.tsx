"use client";

import { useState, useMemo } from "react";
import { Link2, Plus, Trash2, AlertCircle, Loader2, GraduationCap, BookOpen, Layers } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  useTeachers, useCourses, useSections,
  useAssignments, useCreateAssignment, useDeleteAssignment,
} from "@/lib/hooks";
import { type AssignmentDto, ApiError } from "@/lib/api";

export default function AdminAssignmentsPage() {
  const { data: assignments = [], isLoading, error, refetch } = useAssignments();
  const { data: teachers = [] } = useTeachers();
  const { data: courses = [] } = useCourses();
  const { data: sections = [] } = useSections();

  const createMut = useCreateAssignment();
  const deleteMut = useDeleteAssignment();

  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AssignmentDto | null>(null);
  const [form, setForm] = useState<{ teacherId?: number; courseId?: number; sectionId?: number }>({});

  const mutationError = createMut.error as ApiError | undefined;

  const canSubmit = form.teacherId != null && form.courseId != null && form.sectionId != null;
  const missingPrereqs = teachers.length === 0 || courses.length === 0 || sections.length === 0;

  const submit = () => {
    if (!canSubmit) return;
    createMut.mutate(
      { teacherId: form.teacherId!, courseId: form.courseId!, sectionId: form.sectionId! },
      { onSuccess: () => { setCreateOpen(false); setForm({}); } }
    );
  };

  const columns: Column<AssignmentDto>[] = [
    {
      key: "teacher", header: "Teacher", sortable: true, sortValue: (r) => r.teacherName,
      render: (r) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="size-3.5 text-ink-400" />
          <span className="text-[0.88rem] text-ink-900">{r.teacherName}</span>
        </div>
      ),
    },
    {
      key: "course", header: "Course", sortable: true, sortValue: (r) => r.courseCode,
      render: (r) => (
        <span className="text-sm text-ink-700">
          <span className="numeral font-medium text-ink-900">{r.courseCode}</span> — {r.courseName}
        </span>
      ),
    },
    {
      key: "section", header: "Section", sortable: true, sortValue: (r) => r.sectionName,
      render: (r) => <Badge tone="neutral">{r.sectionName}</Badge>,
    },
  ];

  const selectCls = "block w-full h-11 px-3.5 rounded-xl bg-white/70 border border-ink-200/60 text-sm text-ink-900 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500";

  return (
    <>
      <PageHeader
        title="Teacher Assignments"
        subtitle={`${assignments.length} teacher-course-section assignments.`}
        icon={Link2}
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Assignments" }]}
        action={<Button onClick={() => { setForm({}); setCreateOpen(true); }}><Plus className="size-4" /> Assign Teacher</Button>}
      />

      {error ? (
        <ErrorBox error={error as Error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingBox />
      ) : (
        <DataTable
          data={assignments}
          columns={columns}
          rowKey={(r) => r.id}
          searchField={(r) => `${r.teacherName} ${r.courseCode} ${r.courseName} ${r.sectionName}`}
          searchPlaceholder="Search by teacher, course, or section…"
          rowActions={(r) => (
            <button type="button" onClick={() => setToDelete(r)}
              className="size-7 grid place-items-center rounded-lg hover:bg-white/70 text-ink-400 hover:text-accent-rose transition-colors disabled:opacity-30"
              aria-label="Remove assignment" disabled={deleteMut.isPending}>
              <Trash2 className="size-3.5" />
            </button>
          )}
        />
      )}

      {/* Create */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Assign Teacher to Course"
        description="Pick a teacher, a course, and the section they'll teach."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={createMut.isPending}>Cancel</Button>
            <Button onClick={submit} disabled={createMut.isPending || !canSubmit}>
              {createMut.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Assign
            </Button>
          </>
        }
      >
        {missingPrereqs ? (
          <div className="rounded-xl bg-amber-50/70 ring-1 ring-amber-200/60 p-4 text-sm text-amber-900">
            You need at least one teacher, one course, and one section before you can assign.
            <ul className="mt-2 space-y-1 text-xs">
              <li className={teachers.length ? "text-brand-700" : "text-amber-800"}>
                <GraduationCap className="inline size-3 mr-1" /> Teachers: {teachers.length}
              </li>
              <li className={courses.length ? "text-brand-700" : "text-amber-800"}>
                <BookOpen className="inline size-3 mr-1" /> Courses: {courses.length}
              </li>
              <li className={sections.length ? "text-brand-700" : "text-amber-800"}>
                <Layers className="inline size-3 mr-1" /> Sections: {sections.length}
              </li>
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide">Teacher</label>
              <select className={selectCls}
                value={form.teacherId ?? ""}
                onChange={(e) => setForm(f => ({ ...f, teacherId: Number(e.target.value) }))}>
                <option value="" disabled>Select a teacher…</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName} ({t.employeeId})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide">Course</label>
              <select className={selectCls}
                value={form.courseId ?? ""}
                onChange={(e) => setForm(f => ({ ...f, courseId: Number(e.target.value) }))}>
                <option value="" disabled>Select a course…</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.courseCode} — {c.courseName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide">Section</label>
              <select className={selectCls}
                value={form.sectionId ?? ""}
                onChange={(e) => setForm(f => ({ ...f, sectionId: Number(e.target.value) }))}>
                <option value="" disabled>Select a section…</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>{s.sectionName}</option>
                ))}
              </select>
            </div>
            {mutationError ? <Badge tone="danger">{mutationError.message}</Badge> : null}
          </div>
        )}
      </Modal>

      {/* Delete */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        size="sm"
        title="Remove assignment?"
        description={toDelete ? `${toDelete.teacherName} will no longer teach ${toDelete.courseCode} for ${toDelete.sectionName}.` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)} disabled={deleteMut.isPending}>Cancel</Button>
            <Button variant="danger" disabled={deleteMut.isPending}
              onClick={() => { if (toDelete) deleteMut.mutate(toDelete.id, { onSuccess: () => setToDelete(null) }); }}>
              {deleteMut.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">This only removes the assignment, not the teacher or course.</p>
      </Modal>
    </>
  );
}

function LoadingBox() {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <Loader2 className="size-6 text-brand-600 animate-spin mx-auto mb-2" />
      <p className="text-sm text-ink-500">Loading…</p>
    </div>
  );
}

function ErrorBox({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <AlertCircle className="size-7 text-accent-rose mx-auto mb-2" />
      <p className="font-display text-xl text-ink-900">Couldn&apos;t load assignments</p>
      <p className="text-sm text-ink-500 mt-1 mb-4">{error.message}</p>
      <Button variant="secondary" onClick={onRetry}>Try again</Button>
    </div>
  );
}
