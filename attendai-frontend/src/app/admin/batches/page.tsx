"use client";

import { useState, useMemo } from "react";
import {
  Boxes, Plus, Pencil, Trash2, AlertCircle, Loader2, Users, Layers,
  CalendarDays, Link2, X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  useBatches, useCreateBatch, useUpdateBatch, useDeleteBatch,
  useBatchDetail, useSections, useAttachSection, useDetachSection,
} from "@/lib/hooks";
import { type BatchRow } from "@/lib/mockData";
import { ApiError } from "@/lib/api";

type Mode =
  | { kind: "create" }
  | { kind: "edit"; row: BatchRow }
  | { kind: "delete"; row: BatchRow }
  | null;

export default function AdminBatchesPage() {
  const { data: batches = [], isLoading, error, refetch } = useBatches();

  const createMut = useCreateBatch();
  const updateMut = useUpdateBatch();
  const deleteMut = useDeleteBatch();
  const [mode, setMode] = useState<Mode>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const editingRow = mode?.kind === "edit" ? mode.row : null;
  const [form, setForm] = useState<Partial<BatchRow>>({ totalSemesters: 8 });
  const setField = <K extends keyof BatchRow>(k: K, v: BatchRow[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => { setForm({ totalSemesters: 8 }); setMode({ kind: "create" }); };
  const openEdit = (row: BatchRow) => { setForm({ ...row }); setMode({ kind: "edit", row }); };

  const isMutating = createMut.isPending || updateMut.isPending || deleteMut.isPending;
  const mutationError = (createMut.error || updateMut.error) as ApiError | undefined;

  const submitForm = () => {
    const payload = {
      name: form.name,
      program: form.program,
      department: form.department,
      startYear: form.startYear ? Number(form.startYear) : undefined,
      totalSemesters: form.totalSemesters ? Number(form.totalSemesters) : 8,
      advisor: form.advisor,
    };
    if (mode?.kind === "edit") {
      updateMut.mutate({ id: mode.row.id, patch: payload }, { onSuccess: () => setMode(null) });
    } else {
      createMut.mutate(payload, { onSuccess: () => setMode(null) });
    }
  };

  const columns: Column<BatchRow>[] = [
    {
      key: "name", header: "Batch", sortable: true, sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-brand-50 text-brand-700 grid place-items-center shrink-0">
            <Boxes className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-ink-900">{r.name}</p>
            <p className="text-[0.7rem] text-ink-400">{r.program || r.department || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "year", header: "Start", align: "center", sortable: true, sortValue: (r) => r.startYear ?? 0,
      render: (r) => <span className="numeral text-sm">{r.startYear ?? "—"}</span>,
    },
    {
      key: "advisor", header: "Advisor", render: (r) => <span className="text-sm text-ink-700">{r.advisor || "—"}</span>,
    },
    {
      key: "sections", header: "Sections", align: "center", sortable: true, sortValue: (r) => r.sectionsCount,
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-sm text-ink-700">
          <Layers className="size-3 text-ink-400" /><span className="numeral">{r.sectionsCount}</span>
        </span>
      ),
    },
    {
      key: "students", header: "Students", align: "right", sortable: true, sortValue: (r) => r.studentsCount,
      render: (r) => (
        <span className="inline-flex items-center gap-1 numeral font-medium text-ink-900">
          <Users className="size-3 text-ink-400" />{r.studentsCount}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Batches"
        subtitle={`${batches.length} cohorts. A batch groups its sections across semesters 1–8 — click one to manage them.`}
        icon={Boxes}
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Batches" }]}
        action={<Button onClick={openCreate}><Plus className="size-4" /> Add Batch</Button>}
      />

      {error ? (
        <ErrorBox error={error as Error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingBox />
      ) : (
        <DataTable
          data={batches}
          columns={columns}
          rowKey={(r) => r.id}
          onRowClick={(r) => setDetailId(r.id)}
          searchField={(r) => `${r.name} ${r.program ?? ""} ${r.department ?? ""} ${r.advisor ?? ""}`}
          searchPlaceholder="Search by batch, program, or advisor…"
          emptyTitle="No batches yet"
          emptyHint="Create a batch to group sections into a degree-program cohort."
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
        title={editingRow ? "Edit Batch" : "Add Batch"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMode(null)} disabled={isMutating}>Cancel</Button>
            <Button onClick={submitForm} disabled={isMutating}>
              {isMutating ? <Loader2 className="size-4 animate-spin" /> : null}
              {editingRow ? "Save changes" : "Create batch"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input label="Batch Name" placeholder="BCS Fall 2021"
              value={form.name ?? ""} onChange={(e) => setField("name", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Input label="Program" placeholder="BS Computer Science"
              value={form.program ?? ""} onChange={(e) => setField("program", e.target.value)} />
          </div>
          <Input label="Department" placeholder="Computer Science"
            value={form.department ?? ""} onChange={(e) => setField("department", e.target.value)} />
          <Input label="Start Year" type="number" min={2000} max={2100} placeholder="2021"
            value={form.startYear ?? ""} onChange={(e) => setField("startYear", e.target.value ? Number(e.target.value) : null)} />
          <Input label="Total Semesters" type="number" min={1} max={12}
            value={form.totalSemesters ?? 8} onChange={(e) => setField("totalSemesters", Number(e.target.value))} />
          <Input label="Advisor" placeholder="Dr. Sarah Johnson"
            value={form.advisor ?? ""} onChange={(e) => setField("advisor", e.target.value)} />
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
        title="Delete batch?"
        description={mode?.kind === "delete" ? `${mode.row.name} will be removed.` : ""}
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
          {mode?.kind === "delete" && mode.row.sectionsCount > 0
            ? `Its ${mode.row.sectionsCount} section(s) will be detached but not deleted.`
            : "This action cannot be undone."}
        </p>
      </Modal>

      {/* Detail drill-down */}
      <BatchDetailModal id={detailId} onClose={() => setDetailId(null)} />
    </>
  );
}

function BatchDetailModal({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data, isLoading, error } = useBatchDetail(id);
  const { data: allSections = [] } = useSections();
  const attachMut = useAttachSection();
  const detachMut = useDetachSection();
  const [attachOpen, setAttachOpen] = useState(false);
  const open = id != null;

  // Sections not yet in any batch — candidates to attach.
  const unassigned = useMemo(
    () => allSections.filter((s) => !s.batchId),
    [allSections]
  );

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        title={data ? data.name : "Batch"}
        description={data
          ? `${data.program || data.department || "—"}${data.startYear ? ` · Intake ${data.startYear}` : ""}${data.advisor ? ` · Advisor: ${data.advisor}` : ""}`
          : undefined}
        footer={data ? (
          <Button variant="secondary" onClick={() => setAttachOpen(true)} disabled={unassigned.length === 0}>
            <Link2 className="size-4" /> Add existing section
          </Button>
        ) : undefined}
      >
        {isLoading ? (
          <div className="py-10 text-center"><Loader2 className="size-5 text-brand-600 animate-spin mx-auto" /></div>
        ) : error ? (
          <div className="py-8 text-center text-sm text-accent-rose">{(error as Error).message}</div>
        ) : data ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon={Layers} label="Sections" value={data.sectionsCount} />
              <StatCard icon={Users} label="Students" value={data.studentsCount} />
              <StatCard icon={CalendarDays} label="Semesters" value={data.totalSemesters} />
            </div>

            {/* Semester ladder */}
            <div className="space-y-3">
              {data.semesters.map((g) => (
                <div key={g.semester} className="rounded-xl border border-ink-100 bg-white/50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-white/60 border-b border-ink-100/70">
                    <span className="text-xs font-medium text-ink-600 uppercase tracking-wide">
                      {g.semester === 0 ? "Unassigned semester" : `Semester ${g.semester}`}
                    </span>
                    <span className="text-[0.7rem] text-ink-400 numeral">{g.sections.length} section(s)</span>
                  </div>
                  {g.sections.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-ink-300">No sections in this semester.</p>
                  ) : (
                    <div className="divide-y divide-ink-100/70">
                      {g.sections.map((s) => (
                        <div key={s.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="size-8 rounded-lg bg-brand-50 text-brand-700 grid place-items-center font-mono text-[0.65rem] font-semibold shrink-0">
                              {s.sectionName.split("-")[0]}
                            </div>
                            <div className="leading-tight min-w-0">
                              <p className="numeral text-sm font-medium text-ink-900 truncate">{s.sectionName}</p>
                              <p className="text-[0.7rem] text-ink-400">{s.department ?? "—"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="inline-flex items-center gap-1 text-xs text-ink-600">
                              <Users className="size-3 text-ink-400" /><span className="numeral">{s.studentsCount}</span>
                            </span>
                            <button
                              type="button"
                              aria-label="Remove from batch"
                              disabled={detachMut.isPending}
                              onClick={() => id && detachMut.mutate({ batchId: id, sectionId: s.id })}
                              className="size-7 grid place-items-center rounded-lg hover:bg-white text-ink-400 hover:text-accent-rose transition-colors disabled:opacity-30"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Attach an existing unassigned section */}
      <Modal
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        size="sm"
        title="Add section to batch"
        description="Only sections that aren't already in a batch are shown."
      >
        {unassigned.length === 0 ? (
          <p className="text-sm text-ink-400">All sections are already assigned to a batch.</p>
        ) : (
          <div className="rounded-xl border border-ink-100 overflow-hidden divide-y divide-ink-100/70 max-h-80 overflow-y-auto">
            {unassigned.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white/40">
                <div className="leading-tight">
                  <p className="numeral text-sm font-medium text-ink-900">{s.sectionName}</p>
                  <p className="text-[0.7rem] text-ink-400">Sem {s.semester ?? "—"} · {s.department ?? "—"}</p>
                </div>
                <Button
                  variant="secondary"
                  disabled={attachMut.isPending}
                  onClick={() => id && attachMut.mutate(
                    { batchId: id, sectionId: s.id },
                    { onSuccess: () => { if (unassigned.length <= 1) setAttachOpen(false); } }
                  )}
                >
                  <Plus className="size-3.5" /> Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}

function StatCard({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white/60 p-3">
      <Icon className="size-4 text-brand-600" />
      <p className="mt-2 text-[1.4rem] leading-none font-display text-ink-900 numeral">{value}</p>
      <p className="mt-1 text-xs text-ink-400">{label}</p>
    </div>
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
      <p className="font-display text-xl text-ink-900">Couldn&apos;t load batches</p>
      <p className="text-sm text-ink-500 mt-1 mb-4">{error.message}</p>
      <Button variant="secondary" onClick={onRetry}>Try again</Button>
    </div>
  );
}
