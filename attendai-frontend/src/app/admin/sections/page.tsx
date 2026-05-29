"use client";

import { useState, useMemo } from "react";
import {
  Layers, Plus, Pencil, Trash2, AlertCircle, Loader2, Users, BookOpen,
  GraduationCap, Boxes, Mail, Hash,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  useSections, useCreateSection, useUpdateSection, useDeleteSection,
  useSectionDetail, useBatches,
} from "@/lib/hooks";
import { type SectionRow } from "@/lib/mockData";
import { ApiError } from "@/lib/api";

type Mode =
  | { kind: "create" }
  | { kind: "edit"; row: SectionRow }
  | { kind: "delete"; row: SectionRow }
  | null;

export default function AdminSectionsPage() {
  const { data: rawSections = [], isLoading, error, refetch } = useSections();
  const { data: batches = [] } = useBatches();

  const rows = useMemo<SectionRow[]>(
    () => rawSections.map((r) => ({
      ...r,
      studentsCount: typeof r.studentsCount === "number" ? r.studentsCount : 0,
      subjectsCount: typeof r.subjectsCount === "number" ? r.subjectsCount : 0,
      department: r.department ?? "—",
      semester: r.semester ?? 1,
    })),
    [rawSections]
  );

  const createMut = useCreateSection();
  const updateMut = useUpdateSection();
  const deleteMut = useDeleteSection();
  const [mode, setMode] = useState<Mode>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const editingRow = mode?.kind === "edit" ? mode.row : null;
  const [form, setForm] = useState<Partial<SectionRow>>({ semester: 1 });
  const setField = <K extends keyof SectionRow>(k: K, v: SectionRow[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => { setForm({ semester: 1, batchId: null }); setMode({ kind: "create" }); };
  const openEdit = (row: SectionRow) => { setForm({ ...row }); setMode({ kind: "edit", row }); };

  const isMutating = createMut.isPending || updateMut.isPending || deleteMut.isPending;
  const mutationError = (createMut.error || updateMut.error) as ApiError | undefined;

  const submitForm = () => {
    const payload = {
      sectionName: form.sectionName,
      semester: form.semester,
      department: form.department,
      batchId: form.batchId ?? null,
    };
    if (mode?.kind === "edit") {
      updateMut.mutate({ id: mode.row.id, patch: payload }, { onSuccess: () => setMode(null) });
    } else {
      createMut.mutate(payload, { onSuccess: () => setMode(null) });
    }
  };

  const columns: Column<SectionRow>[] = [
    {
      key: "name", header: "Section", sortable: true, sortValue: (r) => r.sectionName,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-brand-50 text-brand-700 grid place-items-center font-mono text-[0.7rem] font-semibold shrink-0">
            {(r.sectionName ?? "?").split("-")[0]}
          </div>
          <span className="numeral font-medium text-ink-900">{r.sectionName}</span>
        </div>
      ),
    },
    { key: "semester", header: "Semester", align: "center", sortable: true, sortValue: (r) => r.semester, render: (r) => <span className="numeral text-sm">{r.semester}</span> },
    { key: "dept", header: "Department", sortable: true, sortValue: (r) => r.department, render: (r) => <span className="text-ink-700 text-sm">{r.department}</span> },
    {
      key: "batch", header: "Batch", sortable: true, sortValue: (r) => r.batchName ?? "",
      render: (r) => r.batchName
        ? <Badge tone="info">{r.batchName}</Badge>
        : <span className="text-ink-300 text-xs">Unassigned</span>,
    },
    {
      key: "subjects", header: "Subjects", align: "center",
      sortable: true, sortValue: (r) => r.subjectsCount ?? 0,
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-sm text-ink-700">
          <BookOpen className="size-3 text-ink-400" />
          <span className="numeral">{r.subjectsCount ?? 0}</span>
        </span>
      ),
    },
    {
      key: "students", header: "Students", align: "right",
      sortable: true, sortValue: (r) => r.studentsCount,
      render: (r) => (
        <span className="inline-flex items-center gap-1 numeral font-medium text-ink-900">
          <Users className="size-3 text-ink-400" />
          {r.studentsCount}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Sections"
        subtitle={`${rows.length} sections across all programs. Click a section to see its roster & subjects.`}
        icon={Layers}
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Sections" }]}
        action={<Button onClick={openCreate}><Plus className="size-4" /> Add Section</Button>}
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
          onRowClick={(r) => setDetailId(r.id)}
          searchField={(r) => `${r.sectionName} ${r.department} ${r.batchName ?? ""}`}
          searchPlaceholder="Search by section, department, or batch…"
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
        title={editingRow ? "Edit Section" : "Add Section"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMode(null)} disabled={isMutating}>Cancel</Button>
            <Button onClick={submitForm} disabled={isMutating}>
              {isMutating ? <Loader2 className="size-4 animate-spin" /> : null}
              {editingRow ? "Save changes" : "Create section"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label="Section Name" placeholder="BCS-7A"
            value={form.sectionName ?? ""} onChange={(e) => setField("sectionName", e.target.value)} />
          <Input label="Semester" type="number" min={1} max={12}
            value={form.semester ?? 1} onChange={(e) => setField("semester", Number(e.target.value))} />
          <div className="col-span-2">
            <Input label="Department" placeholder="Computer Science"
              value={form.department ?? ""} onChange={(e) => setField("department", e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide">Batch / Cohort</label>
            <select
              value={form.batchId ?? ""}
              onChange={(e) => setField("batchId", e.target.value ? Number(e.target.value) : null)}
              className="block w-full h-11 px-3.5 rounded-xl bg-white/70 border border-ink-200/60 text-sm text-ink-900 outline-none transition-all focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="">— No batch —</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <p className="text-xs text-ink-400">Group this section into a program cohort (semesters 1–8).</p>
          </div>
          {mutationError ? (
            <div className="col-span-2"><Badge tone="danger">{mutationError.message}</Badge></div>
          ) : null}
        </div>
      </Modal>

      {/* Delete */}
      <Modal
        open={mode?.kind === "delete"}
        onClose={() => setMode(null)}
        size="sm"
        title="Delete section?"
        description={mode?.kind === "delete" ? `${mode.row.sectionName} will be removed.` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMode(null)} disabled={deleteMut.isPending}>Cancel</Button>
            <Button variant="danger" disabled={deleteMut.isPending}
              onClick={() => {
                if (mode?.kind === "delete") deleteMut.mutate(mode.row.id, { onSuccess: () => setMode(null) });
              }}
            >
              {deleteMut.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          {mode?.kind === "delete" && mode.row.studentsCount > 0
            ? `This section has ${mode.row.studentsCount} students. They will be detached from it.`
            : "This action cannot be undone."}
        </p>
      </Modal>

      {/* Detail drill-down */}
      <SectionDetailModal id={detailId} onClose={() => setDetailId(null)} />
    </>
  );
}

function SectionDetailModal({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data, isLoading, error } = useSectionDetail(id);
  const open = id != null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={data ? data.sectionName : "Section"}
      description={data ? `Semester ${data.semester ?? "—"} · ${data.department ?? "—"}${data.batchName ? ` · ${data.batchName}` : ""}` : undefined}
    >
      {isLoading ? (
        <div className="py-10 text-center"><Loader2 className="size-5 text-brand-600 animate-spin mx-auto" /></div>
      ) : error ? (
        <div className="py-8 text-center text-sm text-accent-rose">{(error as Error).message}</div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Users} label="Students" value={data.studentsCount} />
            <StatCard icon={BookOpen} label="Subjects" value={data.subjectsCount} />
            <StatCard icon={Boxes} label="Batch" valueText={data.batchName ?? "—"} />
          </div>

          {/* Subjects */}
          <section>
            <h4 className="flex items-center gap-2 text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">
              <BookOpen className="size-3.5" /> Subjects taught ({data.subjects.length})
            </h4>
            {data.subjects.length === 0 ? (
              <EmptyHint text="No subjects assigned to this section yet. Add a teacher assignment to offer a subject here." />
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {data.subjects.map((s) => (
                  <div key={s.assignmentId} className="rounded-xl border border-ink-100 bg-white/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-ink-900">
                        <span className="numeral font-medium">{s.courseCode}</span> — {s.courseName}
                      </p>
                      {s.creditHours ? <Badge tone="neutral">{s.creditHours} cr</Badge> : null}
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                      <GraduationCap className="size-3.5 text-ink-400" /> {s.teacherName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Roster */}
          <section>
            <h4 className="flex items-center gap-2 text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">
              <Users className="size-3.5" /> Students ({data.students.length})
            </h4>
            {data.students.length === 0 ? (
              <EmptyHint text="No students belong to this section yet." />
            ) : (
              <div className="rounded-xl border border-ink-100 overflow-hidden divide-y divide-ink-100/70">
                {data.students.map((st) => (
                  <div key={st.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white/40">
                    <div className="min-w-0">
                      <p className="text-sm text-ink-900 truncate">{st.fullName}</p>
                      <p className="flex items-center gap-3 text-xs text-ink-400">
                        <span className="inline-flex items-center gap-1"><Hash className="size-3" /><span className="numeral">{st.registrationNumber ?? "—"}</span></span>
                        <span className="inline-flex items-center gap-1 truncate"><Mail className="size-3" />{st.email}</span>
                      </p>
                    </div>
                    <Badge tone={st.status === "ACTIVE" ? "success" : st.status === "BLOCKED" ? "danger" : "neutral"}>
                      {st.status ?? "—"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  );
}

function StatCard({ icon: Icon, label, value, valueText }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value?: number; valueText?: string;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white/60 p-3">
      <Icon className="size-4 text-brand-600" />
      <p className="mt-2 text-[1.4rem] leading-none font-display text-ink-900 numeral truncate">
        {valueText ?? value}
      </p>
      <p className="mt-1 text-xs text-ink-400">{label}</p>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-ink-400 rounded-xl border border-dashed border-ink-200 bg-white/30 px-3 py-4">{text}</p>;
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
      <p className="font-display text-xl text-ink-900">Couldn&apos;t load sections</p>
      <p className="text-sm text-ink-500 mt-1 mb-4">{error.message}</p>
      <Button variant="secondary" onClick={onRetry}>Try again</Button>
    </div>
  );
}
