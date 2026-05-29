"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  UserCheck, Check, X, Mail, Hash, Building2, GraduationCap,
  AlertCircle, Loader2, Inbox,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { usePendingStudents, useUpdateStudent, qk } from "@/lib/hooks";

export default function AdminApprovalsPage() {
  const { data: pending = [], isLoading, error } = usePendingStudents();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<{ id: number; action: "approve" | "reject" } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const update = useUpdateStudent({
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.admin.pendingStudents }); },
  });

  function act(id: number, action: "approve" | "reject", name: string) {
    if (action === "reject" && !window.confirm(`Reject ${name}'s registration? They won't be able to sign in.`)) return;
    setBusy({ id, action });
    update.mutate(
      { id, patch: { status: action === "approve" ? "ACTIVE" : "INACTIVE" } },
      {
        onSuccess: () => setFlash(action === "approve" ? `${name} approved — they can now sign in.` : `${name}'s registration was rejected.`),
        onSettled: () => setBusy(null),
      }
    );
  }

  return (
    <>
      <PageHeader
        title="Student Approvals"
        subtitle="Review students who signed up and grant or deny portal access."
        icon={UserCheck}
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Approvals" }]}
      />

      {flash ? (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-brand-50 text-brand-800 ring-1 ring-brand-200/60 px-4 py-3 text-sm animate-scale-in">
          <Check className="size-4" /> {flash}
        </div>
      ) : null}

      {error ? (
        <Card className="text-center py-12">
          <AlertCircle className="size-7 text-accent-rose mx-auto mb-2" />
          <p className="font-display text-xl text-ink-900">Couldn&apos;t load approvals</p>
          <p className="text-sm text-ink-500 mt-1">{(error as Error).message}</p>
        </Card>
      ) : isLoading ? (
        <Card className="flex items-center justify-center py-16 text-ink-400">
          <Loader2 className="size-5 animate-spin mr-2" /> Loading pending registrations…
        </Card>
      ) : pending.length === 0 ? (
        <Card className="text-center py-14">
          <div className="size-14 rounded-2xl bg-brand-50 text-brand-600 grid place-items-center mx-auto mb-3">
            <Inbox className="size-6" />
          </div>
          <p className="font-display text-2xl text-ink-900">No pending registrations</p>
          <p className="text-sm text-ink-500 mt-1">When a student signs up, their request will appear here for approval.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 stagger">
          {pending.map((s) => {
            const isBusy = busy?.id === s.id;
            return (
              <Card key={s.id} className="hover-lift">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-11 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white grid place-items-center text-sm font-semibold shrink-0">
                    {s.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900 truncate">{s.fullName}</p>
                    <span className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md ring-1 ring-amber-200/60">Pending</span>
                  </div>
                </div>

                <ul className="space-y-1.5 text-[0.8rem] text-ink-600 mb-4">
                  <li className="flex items-center gap-2"><Mail className="size-3.5 text-ink-400 shrink-0" /> <span className="truncate">{s.email}</span></li>
                  <li className="flex items-center gap-2"><Hash className="size-3.5 text-ink-400 shrink-0" /> <span className="numeral">{s.registrationNumber || "—"}</span></li>
                  <li className="flex items-center gap-2"><Building2 className="size-3.5 text-ink-400 shrink-0" /> {s.department || "—"}</li>
                  <li className="flex items-center gap-2"><GraduationCap className="size-3.5 text-ink-400 shrink-0" /> {s.semester ? `Semester ${s.semester}` : "Semester —"}</li>
                </ul>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => act(s.id, "approve", s.fullName)} disabled={isBusy}>
                    {isBusy && busy?.action === "approve" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve
                  </Button>
                  <Button variant="secondary" className="flex-1" onClick={() => act(s.id, "reject", s.fullName)} disabled={isBusy}>
                    {isBusy && busy?.action === "reject" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} Reject
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
