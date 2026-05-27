"use client";

import { useState } from "react";
import { GraduationCap, Plus, Pencil, UserMinus, Mail } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TEACHERS, type TeacherRow } from "@/lib/mockData";

type Mode = { kind: "create" } | { kind: "edit"; row: TeacherRow } | null;

export default function AdminTeachersPage() {
  const [rows] = useState<TeacherRow[]>(TEACHERS);
  const [mode, setMode] = useState<Mode>(null);

  const columns: Column<TeacherRow>[] = [
    {
      key: "name",
      header: "Teacher",
      sortable: true,
      sortValue: (r) => r.fullName,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white text-[0.7rem] font-semibold grid place-items-center shrink-0">
            {r.fullName.replace(/^(Dr\.|Prof\.) /, "").split(" ").map(n => n[0]).slice(0, 2).join("")}
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-[0.88rem] text-ink-900">{r.fullName}</p>
            <p className="text-[0.7rem] text-ink-400 numeral truncate">{r.employeeId}</p>
          </div>
        </div>
      ),
    },
    { key: "designation", header: "Designation", sortable: true, sortValue: (r) => r.designation, render: (r) => <span className="text-ink-700 text-sm">{r.designation}</span> },
    { key: "dept", header: "Department", sortable: true, sortValue: (r) => r.department, render: (r) => <span className="text-ink-700 text-sm">{r.department}</span> },
    {
      key: "email",
      header: "Email",
      render: (r) => (
        <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-brand-700">
          <Mail className="size-3" />
          {r.email}
        </a>
      ),
    },
    {
      key: "courses",
      header: "Courses",
      align: "center",
      sortable: true,
      sortValue: (r) => r.coursesCount,
      render: (r) => <span className="numeral text-sm font-medium text-ink-900">{r.coursesCount}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={r.status === "ACTIVE" ? "success" : "neutral"} dot>{r.status[0] + r.status.slice(1).toLowerCase()}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Teachers"
        subtitle={`${rows.length} faculty members.`}
        icon={GraduationCap}
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Teachers" }]}
        action={<Button onClick={() => setMode({ kind: "create" })}><Plus className="size-4" /> Add Teacher</Button>}
      />

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        searchField={(r) => `${r.fullName} ${r.employeeId} ${r.email} ${r.department}`}
        searchPlaceholder="Search by name, employee id, department…"
        rowActions={(r) => (
          <button
            type="button"
            onClick={() => setMode({ kind: "edit", row: r })}
            className="size-7 grid place-items-center rounded-lg hover:bg-white/70 text-ink-400 hover:text-brand-700 transition-colors"
            aria-label="Edit"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      />

      <Modal
        open={mode !== null}
        onClose={() => setMode(null)}
        title={mode?.kind === "edit" ? "Edit Teacher" : "Add Teacher"}
        description={mode?.kind === "edit" ? `Updating ${mode.row.fullName}'s details.` : "Create a new teacher account."}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMode(null)}>Cancel</Button>
            <Button onClick={() => setMode(null)}>{mode?.kind === "edit" ? "Save" : "Create"}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input label="Full Name" placeholder="e.g. Dr. Sarah Johnson" defaultValue={mode?.kind === "edit" ? mode.row.fullName : ""} />
          </div>
          <Input label="Employee ID" placeholder="TCH-7821" defaultValue={mode?.kind === "edit" ? mode.row.employeeId : ""} />
          <Input label="Email" type="email" placeholder="teacher@inst.edu" defaultValue={mode?.kind === "edit" ? mode.row.email : ""} />
          <Input label="Department" placeholder="Computer Science" defaultValue={mode?.kind === "edit" ? mode.row.department : ""} />
          <Input label="Designation" placeholder="Associate Professor" defaultValue={mode?.kind === "edit" ? mode.row.designation : ""} />
          {mode?.kind === "create" ? (
            <div className="col-span-2">
              <Input label="Initial Password" type="password" hint="They'll be prompted to change it on first login." />
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
