"use client";

import { useState, useMemo } from "react";
import { GraduationCap, Plus, Pencil, UserMinus, UserCheck, Mail, AlertCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  useTeachers, useCreateTeacher, useUpdateTeacher, useDeactivateTeacher,
} from "@/lib/hooks";
import { type TeacherRow } from "@/lib/mockData";
import { ApiError } from "@/lib/api";

type Mode =
  | { kind: "create" }
  | { kind: "edit"; row: TeacherRow }
  | { kind: "toggle"; row: TeacherRow }
  | null;

export default function AdminTeachersPage() {
  const { data: rawTeachers = [], isLoading, error, refetch } = useTeachers();
  // Backend's TeacherDto has no coursesCount; default it so the table doesn't
  // render undefined.
  const rows = useMemo<TeacherRow[]>(
    () => rawTeachers.map((r) => ({
      ...r,
      coursesCount: typeof r.coursesCount === "number" ? r.coursesCount : 0,
      designation: r.designation ?? "—",
      department: r.department ?? "—",
    })),
    [rawTeachers]
  );

  const createMut = useCreateTeacher();
  const updateMut = useUpdateTeacher();
  const toggleMut = useDeactivateTeacher();
  const [mode, setMode] = useState<Mode>(null);

  const editingRow = mode?.kind === "edit" ? mode.row : null;
  const [form, setForm] = useState<Partial<TeacherRow> & { password?: string }>({});
  const openCreate = () => { setForm({}); setMode({ kind: "create" }); };
  const openEdit = (row: TeacherRow) => { setForm({ ...row }); setMode({ kind: "edit", row }); };
  const setField = <K extends keyof TeacherRow>(k: K, v: TeacherRow[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const isMutating = createMut.isPending || updateMut.isPending || toggleMut.isPending;
  const mutationError = (createMut.error || updateMut.error) as ApiError | undefined;

  const submitForm = () => {
    if (mode?.kind === "edit") {
      updateMut.mutate({ id: mode.row.id, patch: form }, { onSuccess: () => setMode(null) });
    } else {
      createMut.mutate(form, { onSuccess: () => setMode(null) });
    }
  };

  const columns: Column<TeacherRow>[] = [
    {
      key: "name", header: "Teacher", sortable: true, sortValue: (r) => r.fullName,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white text-[0.7rem] font-semibold grid place-items-center shrink-0">
            {(r.fullName ?? "?").replace(/^(Dr\.|Prof\.) /, "").split(" ").map(n => n[0]).slice(0, 2).join("")}
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
      key: "email", header: "Email",
      render: (r) => (
        <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-brand-700">
          <Mail className="size-3" />
          {r.email}
        </a>
      ),
    },
    {
      key: "status", header: "Status",
      render: (r) => <Badge tone={r.status === "ACTIVE" ? "success" : "neutral"} dot>{(r.status ?? "ACTIVE")[0] + (r.status ?? "ACTIVE").slice(1).toLowerCase()}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Teachers"
        subtitle={`${rows.length} faculty members.`}
        icon={GraduationCap}
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Teachers" }]}
        action={<Button onClick={openCreate}><Plus className="size-4" /> Add Teacher</Button>}
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
          searchField={(r) => `${r.fullName} ${r.employeeId} ${r.email} ${r.department}`}
          searchPlaceholder="Search by name, employee id, department…"
          rowActions={(r) => (
            <div className="flex items-center justify-end gap-1">
              <button type="button" onClick={() => openEdit(r)} disabled={isMutating}
                className="size-7 grid place-items-center rounded-lg hover:bg-white/70 text-ink-400 hover:text-brand-700 transition-colors disabled:opacity-30"
                aria-label="Edit">
                <Pencil className="size-3.5" />
              </button>
              <button type="button" onClick={() => setMode({ kind: "toggle", row: r })} disabled={isMutating}
                className="size-7 grid place-items-center rounded-lg hover:bg-white/70 text-ink-400 hover:text-accent-rose transition-colors disabled:opacity-30"
                aria-label="Toggle status">
                {r.status === "ACTIVE" ? <UserMinus className="size-3.5" /> : <UserCheck className="size-3.5" />}
              </button>
            </div>
          )}
        />
      )}

      {/* Create / Edit */}
      <Modal
        open={mode?.kind === "create" || mode?.kind === "edit"}
        onClose={() => setMode(null)}
        title={editingRow ? "Edit Teacher" : "Add Teacher"}
        description={editingRow ? `Updating ${editingRow.fullName}'s details.` : "Create a new teacher account."}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMode(null)} disabled={isMutating}>Cancel</Button>
            <Button onClick={submitForm} disabled={isMutating}>
              {isMutating ? <Loader2 className="size-4 animate-spin" /> : null}
              {editingRow ? "Save changes" : "Create teacher"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input label="Full Name" placeholder="e.g. Dr. Sarah Johnson"
              value={form.fullName ?? ""} onChange={(e) => setField("fullName", e.target.value)} />
          </div>
          <Input label="Employee ID" placeholder="TCH-7821"
            value={form.employeeId ?? ""} onChange={(e) => setField("employeeId", e.target.value)}
            disabled={!!editingRow} />
          <Input label="Email" type="email" placeholder="teacher@inst.edu"
            value={form.email ?? ""} onChange={(e) => setField("email", e.target.value)}
            disabled={!!editingRow} />
          <Input label="Department" placeholder="Computer Science"
            value={form.department ?? ""} onChange={(e) => setField("department", e.target.value)} />
          <Input label="Designation" placeholder="Associate Professor"
            value={form.designation ?? ""} onChange={(e) => setField("designation", e.target.value)} />
          {!editingRow ? (
            <div className="col-span-2">
              <Input label="Initial Password" type="password"
                hint="Minimum 8 characters. They can reset it via 'Forgot password'."
                value={form.password ?? ""}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          ) : null}
          {mutationError ? (
            <div className="col-span-2">
              <Badge tone="danger">{mutationError.message}</Badge>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* Toggle status */}
      <Modal
        open={mode?.kind === "toggle"}
        onClose={() => setMode(null)}
        title={mode?.kind === "toggle" && mode.row.status === "ACTIVE" ? "Deactivate teacher?" : "Reactivate teacher?"}
        size="sm"
        description={
          mode?.kind === "toggle" && mode.row.status === "ACTIVE"
            ? `${mode.row.fullName} will no longer be able to sign in.`
            : mode?.kind === "toggle" ? `${mode.row.fullName} will regain access.` : ""
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setMode(null)} disabled={toggleMut.isPending}>Cancel</Button>
            <Button
              variant={mode?.kind === "toggle" && mode.row.status === "ACTIVE" ? "danger" : "primary"}
              disabled={toggleMut.isPending}
              onClick={() => {
                if (mode?.kind !== "toggle") return;
                toggleMut.mutate(mode.row.id, { onSuccess: () => setMode(null) });
              }}
            >
              {toggleMut.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode?.kind === "toggle" && mode.row.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">This action is reversible. You can change the status again at any time.</p>
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
      <p className="font-display text-xl text-ink-900">Couldn&apos;t load teachers</p>
      <p className="text-sm text-ink-500 mt-1 mb-4">{error.message}</p>
      <Button variant="secondary" onClick={onRetry}>Try again</Button>
    </div>
  );
}
