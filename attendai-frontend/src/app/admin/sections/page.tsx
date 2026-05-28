"use client";

import { useState, useMemo } from "react";
import { Layers, Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useSections, useCreateSection, useDeleteSection } from "@/lib/hooks";
import { type SectionRow } from "@/lib/mockData";
import { ApiError } from "@/lib/api";

export default function AdminSectionsPage() {
  const { data: rawSections = [], isLoading, error, refetch } = useSections();
  const rows = useMemo<SectionRow[]>(
    () => rawSections.map((r) => ({
      ...r,
      studentsCount: typeof r.studentsCount === "number" ? r.studentsCount : 0,
      department: r.department ?? "—",
      semester: r.semester ?? 1,
    })),
    [rawSections]
  );

  const createMut = useCreateSection();
  const deleteMut = useDeleteSection();
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<SectionRow | null>(null);
  const [form, setForm] = useState<Partial<SectionRow>>({ semester: 1 });

  const mutationError = createMut.error as ApiError | undefined;

  const openCreate = () => { setForm({ semester: 1 }); setCreateOpen(true); };
  const submitForm = () => {
    createMut.mutate(form, { onSuccess: () => setCreateOpen(false) });
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
      key: "students", header: "Students", align: "right",
      sortable: true, sortValue: (r) => r.studentsCount,
      render: (r) => <span className="numeral font-medium">{r.studentsCount}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Sections"
        subtitle={`${rows.length} sections across all programs.`}
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
          searchField={(r) => `${r.sectionName} ${r.department}`}
          searchPlaceholder="Search by section name or department…"
          rowActions={(r) => (
            <button type="button" onClick={() => setToDelete(r)}
              className="size-7 grid place-items-center rounded-lg hover:bg-white/70 text-ink-400 hover:text-accent-rose transition-colors disabled:opacity-30"
              aria-label="Delete" disabled={deleteMut.isPending}>
              <Trash2 className="size-3.5" />
            </button>
          )}
        />
      )}

      {/* Create */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Section"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={createMut.isPending}>Cancel</Button>
            <Button onClick={submitForm} disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Create section
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label="Section Name" placeholder="BCS-7A"
            value={form.sectionName ?? ""} onChange={(e) => setForm(f => ({ ...f, sectionName: e.target.value }))} />
          <Input label="Semester" type="number" min={1} max={12}
            value={form.semester ?? 1} onChange={(e) => setForm(f => ({ ...f, semester: Number(e.target.value) }))} />
          <div className="col-span-2">
            <Input label="Department" placeholder="Computer Science"
              value={form.department ?? ""} onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))} />
          </div>
          {mutationError ? (
            <div className="col-span-2"><Badge tone="danger">{mutationError.message}</Badge></div>
          ) : null}
        </div>
      </Modal>

      {/* Delete */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        size="sm"
        title="Delete section?"
        description={toDelete ? `${toDelete.sectionName} will be removed.` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)} disabled={deleteMut.isPending}>Cancel</Button>
            <Button variant="danger" disabled={deleteMut.isPending}
              onClick={() => {
                if (toDelete) deleteMut.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
              }}
            >
              {deleteMut.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">This action cannot be undone.</p>
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
      <p className="font-display text-xl text-ink-900">Couldn&apos;t load sections</p>
      <p className="text-sm text-ink-500 mt-1 mb-4">{error.message}</p>
      <Button variant="secondary" onClick={onRetry}>Try again</Button>
    </div>
  );
}
