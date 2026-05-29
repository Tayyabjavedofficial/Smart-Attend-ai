"use client";

import { useState, useMemo } from "react";
import { Users, Plus, Pencil, UserMinus, UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import {
  useStudents, useCreateStudent, useUpdateStudent, useDeactivateStudent,
} from "@/lib/hooks";
import { type StudentRow } from "@/lib/mockData";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";

type Mode =
  | { kind: "create" }
  | { kind: "edit"; row: StudentRow }
  | { kind: "toggle"; row: StudentRow }
  | null;

export default function AdminStudentsPage() {
  const { data: rawStudents = [], isLoading, error, refetch } = useStudents();
  // The backend omits attendance/section for freshly created students (no
  // attendance computed yet). Fill safe defaults so the table's
  // r.attendance.toFixed() and friends don't throw on undefined.
  const rows = useMemo<StudentRow[]>(
    () => rawStudents.map((r) => ({
      ...r,
      attendance: typeof r.attendance === "number" ? r.attendance : 0,
      section: r.section ?? "—",
      semester: r.semester ?? 1,
    })),
    [rawStudents]
  );
  const createMut = useCreateStudent();
  const updateMut = useUpdateStudent();
  const toggleMut = useDeactivateStudent();
  const [mode, setMode] = useState<Mode>(null);
  const [tab, setTab] = useState("all");

  // Form state for the create/edit modal.
  const editingRow = mode?.kind === "edit" ? mode.row : null;
  const [form, setForm] = useState<Partial<StudentRow> & { password?: string }>({});
  const openCreate = () => { setForm({}); setMode({ kind: "create" }); };
  const openEdit = (row: StudentRow) => { setForm({ ...row }); setMode({ kind: "edit", row }); };
  const setField = <K extends keyof StudentRow>(k: K, v: StudentRow[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const filtered = useMemo(() => {
    if (tab === "all") return rows;
    if (tab === "active") return rows.filter(r => r.status === "ACTIVE");
    if (tab === "inactive") return rows.filter(r => r.status !== "ACTIVE");
    return rows.filter(r => r.attendance < 75);
  }, [rows, tab]);

  const columns: Column<StudentRow>[] = [
    {
      key: "name", header: "Student", sortable: true,
      sortValue: (r) => r.fullName,
      render: (r) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-full bg-gradient-to-br from-brand-200 to-brand-400 text-white text-[0.7rem] font-semibold grid place-items-center shrink-0">
            {r.fullName.split(" ").map(n => n[0]).slice(0, 2).join("")}
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-[0.88rem] text-ink-900 truncate">{r.fullName}</p>
            <p className="text-[0.7rem] text-ink-400 numeral truncate">{r.registrationNumber} · {r.email}</p>
          </div>
        </div>
      ),
    },
    { key: "dept", header: "Department", sortable: true, sortValue: (r) => r.department, render: (r) => <span className="text-ink-700">{r.department}</span> },
    { key: "section", header: "Section", sortable: true, sortValue: (r) => r.section, render: (r) => <span className="numeral text-ink-700">{r.section}</span> },
    {
      key: "attendance", header: "Attendance", align: "right",
      sortable: true, sortValue: (r) => r.attendance,
      render: (r) => (
        <div className="inline-flex flex-col items-end gap-1">
          <span className={cn(
            "numeral text-sm font-medium",
            r.attendance < 75 ? "text-accent-rose" : r.attendance < 85 ? "text-accent-amber" : "text-brand-700"
          )}>
            {r.attendance.toFixed(1)}%
          </span>
          <div className="w-20 h-1 bg-ink-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full",
                r.attendance < 75 ? "bg-accent-rose" : r.attendance < 85 ? "bg-accent-amber" : "bg-brand-500")}
              style={{ width: `${r.attendance}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "status", header: "Status",
      render: (r) => (
        <Badge tone={r.status === "ACTIVE" ? "success" : r.status === "BLOCKED" ? "danger" : "neutral"} dot>
          {r.status[0] + r.status.slice(1).toLowerCase()}
        </Badge>
      ),
    },
  ];

  const isMutating = createMut.isPending || updateMut.isPending || toggleMut.isPending;
  const mutationError = (createMut.error || updateMut.error) as ApiError | undefined;

  const submitForm = () => {
    if (mode?.kind === "edit") {
      const id = mode.row.id;
      updateMut.mutate({ id, patch: form }, { onSuccess: () => setMode(null) });
    } else {
      createMut.mutate(form, { onSuccess: () => setMode(null) });
    }
  };

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={`${rows.length} students across all departments.`}
        icon={Users}
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Students" }]}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add Student
          </Button>
        }
      />

      <div className="mb-4">
        <Tabs
          value={tab} onChange={setTab}
          items={[
            { value: "all",     label: "All",             count: rows.length },
            { value: "active",  label: "Active",          count: rows.filter(r => r.status === "ACTIVE").length },
            { value: "inactive",label: "Inactive",        count: rows.filter(r => r.status !== "ACTIVE").length },
            { value: "low",     label: "Low attendance",  count: rows.filter(r => r.attendance < 75).length },
          ]}
        />
      </div>

      {error ? (
        <ErrorBox error={error as Error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingBox />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          rowKey={(r) => r.id}
          searchField={(r) => `${r.fullName} ${r.email} ${r.registrationNumber} ${r.section}`}
          searchPlaceholder="Search by name, reg no, email, section…"
          rowActions={(r) => (
            <div className="flex items-center justify-end gap-1">
              <button type="button" onClick={() => openEdit(r)}
                disabled={isMutating}
                className="size-7 grid place-items-center rounded-lg hover:bg-white/70 text-ink-400 hover:text-brand-700 transition-colors disabled:opacity-30"
                aria-label="Edit">
                <Pencil className="size-3.5" />
              </button>
              <button type="button" onClick={() => setMode({ kind: "toggle", row: r })}
                disabled={isMutating}
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
        title={editingRow ? "Edit Student" : "Add Student"}
        description={editingRow
          ? `Updating ${editingRow.fullName}'s details.`
          : "Create a new student record. They'll receive login credentials by email."}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMode(null)} disabled={isMutating}>Cancel</Button>
            <Button onClick={submitForm} disabled={isMutating}>
              {isMutating ? <Loader2 className="size-4 animate-spin" /> : null}
              {editingRow ? "Save changes" : "Create student"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input label="Full Name" placeholder="e.g. Aarav Sharma"
              value={form.fullName ?? ""} onChange={(e) => setField("fullName", e.target.value)} />
          </div>
          <Input label="Registration No." placeholder="S2021001"
            value={form.registrationNumber ?? ""} onChange={(e) => setField("registrationNumber", e.target.value)} />
          <Input label="Email" type="email" placeholder="student@inst.edu"
            value={form.email ?? ""} onChange={(e) => setField("email", e.target.value)} />
          <Input label="Department" placeholder="Computer Science"
            value={form.department ?? ""} onChange={(e) => setField("department", e.target.value)} />
          <Input label="Section" placeholder="BCS-7A"
            value={form.section ?? ""} onChange={(e) => setField("section", e.target.value)} />
          <Input label="Semester" type="number" min={1} max={12}
            value={form.semester ?? 1}
            onChange={(e) => setField("semester", Number(e.target.value))} />
          {!editingRow ? (
            <Input label="Password" type="password"
              hint="Minimum 8 characters. They can change it after first login."
              value={form.password ?? ""}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} />
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
        title={mode?.kind === "toggle" && mode.row.status === "ACTIVE" ? "Deactivate student?" : "Reactivate student?"}
        size="sm"
        description={
          mode?.kind === "toggle" && mode.row.status === "ACTIVE"
            ? `${mode.row.fullName} will no longer be able to sign in. Attendance history is preserved.`
            : mode?.kind === "toggle" ? `${mode.row.fullName} will regain access.` : ""
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setMode(null)} disabled={toggleMut.isPending}>Cancel</Button>
            <Button
              variant={mode?.kind === "toggle" && mode.row.status === "ACTIVE" ? "danger" : "primary"}
              disabled={toggleMut.isPending || updateMut.isPending}
              onClick={() => {
                if (mode?.kind !== "toggle") return;
                const opts = { onSuccess: () => setMode(null) };
                if (mode.row.status === "ACTIVE") {
                  // Deactivate → DELETE endpoint sets status INACTIVE.
                  toggleMut.mutate(mode.row.id, opts);
                } else {
                  // Reactivate → update status back to ACTIVE.
                  updateMut.mutate({ id: mode.row.id, patch: { status: "ACTIVE" } }, opts);
                }
              }}
            >
              {(toggleMut.isPending || updateMut.isPending) ? <Loader2 className="size-4 animate-spin" /> : null}
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

// ---- shared skeletons / error blocks (extract to /components later) ----

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
      <p className="font-display text-xl text-ink-900">Couldn't load students</p>
      <p className="text-sm text-ink-500 mt-1 mb-4">{error.message}</p>
      <Button variant="secondary" onClick={onRetry}>Try again</Button>
    </div>
  );
}
