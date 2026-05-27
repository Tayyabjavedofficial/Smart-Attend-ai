"use client";

import { useState } from "react";
import { BookOpen, Plus, Pencil, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { COURSES, type CourseRow } from "@/lib/mockData";

type Mode = { kind: "create" } | { kind: "edit"; row: CourseRow } | { kind: "delete"; row: CourseRow } | null;

export default function AdminCoursesPage() {
  const [rows, setRows] = useState<CourseRow[]>(COURSES);
  const [mode, setMode] = useState<Mode>(null);

  const columns: Column<CourseRow>[] = [
    {
      key: "code",
      header: "Course",
      sortable: true,
      sortValue: (r) => r.courseCode,
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
      key: "teachers",
      header: "Teachers",
      align: "center",
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-sm text-ink-700">
          <Users className="size-3 text-ink-400" />
          <span className="numeral">{r.teachers}</span>
        </span>
      ),
    },
    {
      key: "enrolled",
      header: "Enrolled",
      align: "right",
      sortable: true,
      sortValue: (r) => r.enrolled,
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
        action={<Button onClick={() => setMode({ kind: "create" })}><Plus className="size-4" /> Add Course</Button>}
      />

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        searchField={(r) => `${r.courseCode} ${r.courseName} ${r.department}`}
        searchPlaceholder="Search by code, name, department…"
        rowActions={(r) => (
          <div className="flex items-center justify-end gap-1">
            <button type="button" onClick={() => setMode({ kind: "edit", row: r })} className="size-7 grid place-items-center rounded-lg hover:bg-white/70 text-ink-400 hover:text-brand-700 transition-colors" aria-label="Edit">
              <Pencil className="size-3.5" />
            </button>
            <button type="button" onClick={() => setMode({ kind: "delete", row: r })} className="size-7 grid place-items-center rounded-lg hover:bg-white/70 text-ink-400 hover:text-accent-rose transition-colors" aria-label="Delete">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      />

      <Modal
        open={mode?.kind === "create" || mode?.kind === "edit"}
        onClose={() => setMode(null)}
        title={mode?.kind === "edit" ? "Edit Course" : "Add Course"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMode(null)}>Cancel</Button>
            <Button onClick={() => setMode(null)}>{mode?.kind === "edit" ? "Save" : "Create"}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label="Course Code" placeholder="CS201" defaultValue={mode?.kind === "edit" ? mode.row.courseCode : ""} />
          <Input label="Credit Hours" type="number" min={1} max={6} defaultValue={mode?.kind === "edit" ? mode.row.creditHours : 3} />
          <div className="col-span-2">
            <Input label="Course Name" placeholder="Artificial Intelligence" defaultValue={mode?.kind === "edit" ? mode.row.courseName : ""} />
          </div>
          <div className="col-span-2">
            <Input label="Department" placeholder="Computer Science" defaultValue={mode?.kind === "edit" ? mode.row.department : ""} />
          </div>
        </div>
      </Modal>

      <Modal
        open={mode?.kind === "delete"}
        onClose={() => setMode(null)}
        size="sm"
        title="Delete course?"
        description={mode?.kind === "delete" ? `${mode.row.courseCode} — ${mode.row.courseName} will be removed.` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMode(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (mode?.kind === "delete") setRows(rs => rs.filter(r => r.id !== mode.row.id));
                setMode(null);
              }}
            >
              Delete course
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          {mode?.kind === "delete" && mode.row.enrolled > 0
            ? `This course has ${mode.row.enrolled} active enrollments. Consider archiving it instead.`
            : "This course has no active enrollments."}
        </p>
      </Modal>
    </>
  );
}
