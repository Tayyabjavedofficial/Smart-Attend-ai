"use client";

import { useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SECTIONS, type SectionRow } from "@/lib/mockData";

export default function AdminSectionsPage() {
  const [rows, setRows] = useState<SectionRow[]>(SECTIONS);
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<SectionRow | null>(null);

  const columns: Column<SectionRow>[] = [
    {
      key: "name",
      header: "Section",
      sortable: true,
      sortValue: (r) => r.sectionName,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-brand-50 text-brand-700 grid place-items-center font-mono text-[0.7rem] font-semibold shrink-0">
            {r.sectionName.split("-")[0]}
          </div>
          <span className="numeral font-medium text-ink-900">{r.sectionName}</span>
        </div>
      ),
    },
    { key: "semester", header: "Semester", align: "center", sortable: true, sortValue: (r) => r.semester, render: (r) => <span className="numeral text-sm">{r.semester}</span> },
    { key: "dept", header: "Department", sortable: true, sortValue: (r) => r.department, render: (r) => <span className="text-ink-700 text-sm">{r.department}</span> },
    {
      key: "students",
      header: "Students",
      align: "right",
      sortable: true,
      sortValue: (r) => r.studentsCount,
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
        action={<Button onClick={() => setCreateOpen(true)}><Plus className="size-4" /> Add Section</Button>}
      />

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        searchField={(r) => `${r.sectionName} ${r.department}`}
        searchPlaceholder="Search by section name or department…"
        rowActions={(r) => (
          <button
            type="button"
            onClick={() => setToDelete(r)}
            className="size-7 grid place-items-center rounded-lg hover:bg-white/70 text-ink-400 hover:text-accent-rose transition-colors"
            aria-label="Delete"
            disabled={r.studentsCount > 0}
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Section"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => setCreateOpen(false)}>Create</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label="Section Name" placeholder="BCS-7A" />
          <Input label="Semester" type="number" min={1} max={12} defaultValue={1} />
          <div className="col-span-2">
            <Input label="Department" placeholder="Computer Science" />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        size="sm"
        title="Delete section?"
        description={toDelete ? `${toDelete.sectionName} will be removed.` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (toDelete) setRows(rs => rs.filter(r => r.id !== toDelete.id));
                setToDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          {toDelete && toDelete.studentsCount > 0
            ? `This section still has ${toDelete.studentsCount} students. Move them to another section first.`
            : "This section is empty and can be safely removed."}
        </p>
      </Modal>
    </>
  );
}
