"use client";

import { useState, useMemo } from "react";
import { ShieldCheck, CheckCircle2, Ban, Trash2, Monitor, Smartphone, AlertCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { useDevices, useUpdateDevice } from "@/lib/hooks";
import { type DeviceDto } from "@/lib/api";

export default function AdminDevicesPage() {
  const { data: rows = [], isLoading, error, refetch } = useDevices();
  const updateMut = useUpdateDevice();
  const [tab, setTab] = useState("all");

  const filtered = useMemo(() => {
    if (tab === "trusted") return rows.filter(r => r.trusted && !r.blocked);
    if (tab === "untrusted") return rows.filter(r => !r.trusted && !r.blocked);
    if (tab === "blocked") return rows.filter(r => r.blocked);
    return rows;
  }, [rows, tab]);

  const apply = (id: number, action: "APPROVE" | "BLOCK" | "REMOVE") =>
    updateMut.mutate({ id, action });

  const columns: Column<DeviceDto>[] = [
    {
      key: "device", header: "Device", sortable: true, sortValue: (r) => r.deviceName,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-ink-100 text-ink-700 grid place-items-center shrink-0">
            {(r.browserInfo ?? "").match(/iOS|Android/) ? <Smartphone className="size-4" /> : <Monitor className="size-4" />}
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-[0.85rem] text-ink-900 truncate">{r.deviceName}</p>
            <p className="text-[0.65rem] text-ink-400 truncate">{r.browserInfo}</p>
          </div>
        </div>
      ),
    },
    {
      key: "student", header: "Owner", sortable: true, sortValue: (r) => r.studentName ?? "",
      render: (r) => <span className="text-[0.82rem] text-ink-700">{r.studentName ?? `Student #${r.studentId}`}</span>,
    },
    { key: "ip", header: "IP", render: (r) => <span className="numeral text-xs text-ink-500 font-mono">{r.ipAddress ?? "—"}</span> },
    {
      key: "flag", header: "Status",
      render: (r) => (
        r.blocked
          ? <Badge tone="danger" dot>Blocked</Badge>
          : r.trusted
          ? <Badge tone="success" dot>Trusted</Badge>
          : <Badge tone="warning" dot>Untrusted</Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Trusted Devices"
        subtitle="Browsers and devices students have registered for attendance."
        icon={ShieldCheck}
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Devices" }]}
        action={
          <Tabs
            value={tab} onChange={setTab}
            items={[
              { value: "all", label: "All", count: rows.length },
              { value: "trusted", label: "Trusted", count: rows.filter(r => r.trusted && !r.blocked).length },
              { value: "untrusted", label: "Untrusted", count: rows.filter(r => !r.trusted && !r.blocked).length },
              { value: "blocked", label: "Blocked", count: rows.filter(r => r.blocked).length },
            ]}
          />
        }
      />

      {error ? (
        <ErrorBox error={error as Error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingBox />
      ) : rows.length === 0 ? (
        <EmptyBox />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          rowKey={(r) => r.id}
          searchField={(r) => `${r.deviceName} ${r.studentName ?? ""} ${r.ipAddress ?? ""}`}
          searchPlaceholder="Search by device, student, IP…"
          rowActions={(r) => (
            <div className="flex items-center justify-end gap-1">
              {(!r.trusted || r.blocked) ? (
                <button type="button" onClick={() => apply(r.id, "APPROVE")} disabled={updateMut.isPending}
                  className="size-7 grid place-items-center rounded-lg hover:bg-brand-50 text-ink-400 hover:text-brand-700 transition-colors disabled:opacity-30"
                  aria-label="Approve" title="Approve as trusted">
                  <CheckCircle2 className="size-3.5" />
                </button>
              ) : null}
              {!r.blocked ? (
                <button type="button" onClick={() => apply(r.id, "BLOCK")} disabled={updateMut.isPending}
                  className="size-7 grid place-items-center rounded-lg hover:bg-rose-50 text-ink-400 hover:text-accent-rose transition-colors disabled:opacity-30"
                  aria-label="Block" title="Block device">
                  <Ban className="size-3.5" />
                </button>
              ) : null}
              <button type="button" onClick={() => apply(r.id, "REMOVE")} disabled={updateMut.isPending}
                className="size-7 grid place-items-center rounded-lg hover:bg-white/70 text-ink-400 hover:text-ink-700 transition-colors disabled:opacity-30"
                aria-label="Remove" title="Remove">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )}
        />
      )}
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

function EmptyBox() {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <ShieldCheck className="size-8 text-ink-300 mx-auto mb-2" />
      <p className="font-display text-xl text-ink-700">No devices yet</p>
      <p className="text-sm text-ink-400 mt-1">Devices appear here once students register them while marking attendance.</p>
    </div>
  );
}

function ErrorBox({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <AlertCircle className="size-7 text-accent-rose mx-auto mb-2" />
      <p className="font-display text-xl text-ink-900">Couldn&apos;t load devices</p>
      <p className="text-sm text-ink-500 mt-1 mb-4">{error.message}</p>
      <Button variant="secondary" onClick={onRetry}>Try again</Button>
    </div>
  );
}
