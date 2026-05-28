"use client";

import { useState, useMemo } from "react";
import { BookOpen, Plus, Pencil, Trash2, Users, AlertCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse,
} from "@/lib/hooks";
import { type CourseRow } from "@/lib/mockData";
import { ApiError } from "@/lib/api";

type Mode =
  | { kind: "create" }
  | { kind: "edit"; row: CourseRow }
  | { kind: "delete"; row: CourseRow }
  | null;

export default function AdminCoursesPage() {
  const { data: rawCourses = [], isLoading, error, refetch } = useCourses();
  // Backend's CourseDto has no enrolled/teachers counts; default them so the
  // table doesn't render undefined.
  const rows = useMemo<CourseRow[]>(
    () => rawCourses.map((r) => ({
      ...r,
      enrolled: typeof r.enrolled === "number" ? r.enrolled : 0,
      teachers: typeof r.teachers === "number" ? r.teachers : 0,
      department: r.department ?? "—",
    })),
    [rawCourses]
  );

  const createMut = useCreateCourse();
  const updateMut = useUpdateCourse();
  const deleteMut = useDeleteCourse();
  const [mode, setMode] = useState<Mode>(null);

  const editingRow = mode?.kind === "edit" ? mode.row : null;
  const [form, setForm] = useState<Partial<CourseRow>>({});
  const openCreate = () => { setForm({ creditHours: 3 }); setMode({ kind: "create" }); };
  const openEdit = (row: CourseRow) => { setForm({ ...row }); setMode({ kind: "edit", row }); };
  const setField = <K extends keyof CourseRow>(k: K, v: CourseRow[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const isMutating = createMut.isPending || updateMut.isPending || deleteMut.isPending;
  const mutationError = (createMut.error || updateMut.error) as ApiError | undefined;

  const submitForm = () => {
    if (mode?.kind === "edit") {
      updateMut.mutate({ id: mode.row.id, patch: form }, { onSuccess: () => setMode(null) });
    } else {
      createMut.mutate(form, { onSuccess: () => setMode(null) });
    }
  };

  const columns: Column<CourseRow>[] = [
    {
      key: "code", header: "Course", sortable: true, sortValue: (r) => r.courseCode,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center shrink-0">
            <BookOpen className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-[0.88rem] text-ink-900">
              <span className="numeral font-medium">{r.courseCode}</span> — {r.courseName}
            </p>
            <p className="text-[0.7rem] text-ink-400">{r.department}</p>
          </div>
        </div>
      ),
    },
    { key: "credits", header: "Credits", align: "center", sortable: true, sortValue: (r) => r.creditHours, render: (r) => <span className="numeral text-sm font-medium">{r.creditHours}</span> },
    {
      key: "teachers", header: "Teachers", align: "center",
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-sm text-ink-700">
          <Users className="size-3 text-ink-400" />
          <span className="numeral">{r.teachers}</span>
        </span>
      ),
    },
    {
      key: "enrolled", header: "Enrolled", align: "right",
      sortable: true, sortValue: (r) => r.enrolled,
      render: (r) => <span className="numeral text-sm font-medium text-ink-900">{r.enrolled}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle={`${rows.length} courses currently offered.`}
        icon={BookOpen}
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Courses" }]}
        action={<Button onClick={openCreate}><Plus className="size-4" /> Add Course</Button>}
      />

      {error ? (
        <ErrorBox error={error as Error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingBox />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          rowKey={(r) => r.id}
          searchField={(r) => `${r.courseCode} ${r.courseName} ${r.department}`}
          searchPlaceholder="Search by code, name, department…"
          rowActions={(r) => (
            <div className="flex items-center justify-end gap-1">
              <button type="button" onClick={() => openEdit(r)} disabled={isMutating}
                className="size-7 grid place-items-center rounded-lg hover:bg-white/70 text-ink-400 hover:text-brand-700 transition-colors disabled:opacity-30" aria-label="Edit">
                <Pencil className="size-3.5" />
              </button>
              <button type="button" onClick={() => setMode({ kind: "delete", row: r })} disabled={isMutating}
                className="size-7 grid place-items-center rounded-lg hover:bg-white/70 text-ink-400 hover:text-accent-rose transition-colors disabled:opacity-30" aria-label="Delete">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )}
        />
      )}

      {/* Create / Edit */}
      <Modal
        open={mode?.kind === "create" || mode?.kind === "edit"}
        onClose={() => setMode(null)}
        title={editingRow ? "Edit Course" : "Add Course"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMode(null)} disabled={isMutating}>Cancel</Button>
            <Button onClick={submitForm} disabled={isMutating}>
              {isMutating ? <Loader2 className="size-4 animate-spin" /> : null}
              {editingRow ? "Save changes" : "Create course"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label="Course Code" placeholder="CS201"
            value={form.courseCode ?? ""} onChange={(e) => setField("courseCode", e.target.value)}
            disabled={!!editingRow} />
          <Input label="Credit Hours" type="number" min={1} max={6}
            value={form.creditHours ?? 3} onChange={(e) => setField("creditHours", Number(e.target.value))} />
          <div className="col-span-2">
            <Input label="Course Name" placeholder="Artificial Intelligence"
              value={form.courseName ?? ""} onChange={(e) => setField("courseName", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Input label="Department" placeholder="Computer Science"
              value={form.department ?? ""} onChange={(e) => setField("department", e.target.value)} />
          </div>
          {mutationError ? (
            <div className="col-span-2">
              <Badge tone="danger">{mutationError.message}</Badge>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* Delete */}
      <Modal
        open={mode?.kind === "delete"}
        onClose={() => setMode(null)}
        size="sm"
        title="Delete course?"
        description={mode?.kind === "delete" ? `${mode.row.courseCode} — ${mode.row.courseName} will be removed.` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMode(null)} disabled={deleteMut.isPending}>Cancel</Button>
            <Button variant="danger" disabled={deleteMut.isPending}
              onClick={() => {
                if (mode?.kind !== "delete") return;
                deleteMut.mutate(mode.row.id, { onSuccess: () => setMode(null) });
              }}
            >
              {deleteMut.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete course
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          {mode?.kind === "delete" && mode.row.enrolled > 0
            ? `This course has ${mode.row.enrolled} active enrollments. Consider archiving it instead.`
            : "This action cannot be undone."}
        </p>
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
      <p className="font-display text-xl text-ink-900">Couldn&apos;t load courses</p>
      <p className="text-sm text-ink-500 mt-1 mb-4">{error.message}</p>
      <Button variant="secondary" onClick={onRetry}>Try again</Button>
    </div>
  );
}
