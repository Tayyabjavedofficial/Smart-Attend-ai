"use client";

import { useState, useMemo } from "react";
import { Users, Loader2, AlertCircle, Mail } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useTeacherStudents } from "@/lib/hooks";
import { type TeacherStudentRow } from "@/lib/api";

const selectCls = "h-10 px-3 rounded-xl bg-white/70 border border-ink-200/60 text-sm text-ink-900 outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500";

export default function TeacherStudentsPage() {
  const { data: rows = [], isLoading, error, refetch } = useTeacherStudents();
  const [course, setCourse] = useState("");
  const [section, setSection] = useState("");

  const courses = useMemo(() => Array.from(new Set(rows.map(r => r.courseCode))).sort(), [rows]);
  const sections = useMemo(() => Array.from(new Set(rows.map(r => r.sectionName))).sort(), [rows]);

  const filtered = useMemo(
    () => rows.filter(r => (!course || r.courseCode === course) && (!section || r.sectionName === section)),
    [rows, course, section]
  );

  const columns: Column<TeacherStudentRow>[] = [
    {
      key: "name", header: "Student", sortable: true, sortValue: (r) => r.fullName,
      render: (r) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-full bg-gradient-to-br from-brand-200 to-brand-400 text-white text-[0.7rem] font-semibold grid place-items-center shrink-0">
            {(r.fullName ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("")}
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-[0.88rem] text-ink-900 truncate">{r.fullName}</p>
            <p className="text-[0.7rem] text-ink-400 numeral truncate">{r.registrationNumber ?? "—"}</p>
          </div>
        </div>
      ),
    },
    { key: "reg", header: "Roll / Reg No", sortable: true, sortValue: (r) => r.registrationNumber ?? "", render: (r) => <span className="numeral text-sm text-ink-700">{r.registrationNumber ?? "—"}</span> },
    {
      key: "email", header: "Email",
      render: (r) => (
        <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-brand-700">
          <Mail className="size-3" /> {r.email}
        </a>
      ),
    },
    { key: "course", header: "Course", sortable: true, sortValue: (r) => r.courseCode, render: (r) => <span className="text-ink-700 text-sm"><span className="numeral font-medium">{r.courseCode}</span> — {r.courseName}</span> },
    { key: "section", header: "Section", sortable: true, sortValue: (r) => r.sectionName, render: (r) => <Badge tone="neutral">{r.sectionName}</Badge> },
  ];

  return (
    <>
      <PageHeader
        title="My Students"
        subtitle={`${filtered.length} of ${rows.length} shown.`}
        icon={Users}
        crumbs={[{ label: "Teacher", href: "/teacher" }, { label: "Students" }]}
      />

      {error ? (
        <div className="glass rounded-2xl p-12 text-center">
          <AlertCircle className="size-7 text-accent-rose mx-auto mb-2" />
          <p className="font-display text-xl text-ink-900">Couldn&apos;t load students</p>
          <p className="text-sm text-ink-500 mt-1 mb-4">{(error as Error).message}</p>
          <Button variant="secondary" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : isLoading ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Loader2 className="size-6 text-brand-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-ink-500">Loading…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Users className="size-8 text-ink-300 mx-auto mb-2" />
          <p className="font-display text-xl text-ink-700">No students yet</p>
          <p className="text-sm text-ink-400 mt-1">Students appear here once they enroll in a class you teach.</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <select className={selectCls} value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">All courses</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={selectCls} value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="">All sections</option>
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(course || section) ? (
              <button onClick={() => { setCourse(""); setSection(""); }} className="text-xs text-brand-700 hover:underline">Clear filters</button>
            ) : null}
          </div>

          <DataTable
            data={filtered}
            columns={columns}
            rowKey={(r) => `${r.studentId}:${r.courseCode}:${r.sectionName}`}
            searchField={(r) => `${r.fullName} ${r.email} ${r.registrationNumber ?? ""} ${r.courseCode} ${r.sectionName}`}
            searchPlaceholder="Search by name, roll no, email…"
          />
        </>
      )}
    </>
  );
}
