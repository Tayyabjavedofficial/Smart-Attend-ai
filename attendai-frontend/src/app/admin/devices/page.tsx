"use client";

import { useState } from "react";
import { ShieldCheck, CheckCircle2, Ban, Trash2, AlertTriangle, Monitor, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { DEVICES, type DeviceRow } from "@/lib/mockData";

export default function AdminDevicesPage() {
  const [rows, setRows] = useState(DEVICES);
  const [tab, setTab] = useState("all");

  const filtered = tab === "all"
    ? rows
    : tab === "trusted"
    ? rows.filter(r => r.trusted && !r.blocked)
    : tab === "suspicious"
    ? rows.filter(r => r.multiAccount || (!r.trusted && !r.blocked))
    : rows.filter(r => r.blocked);

  const applyAction = (id: number, action: "APPROVE" | "BLOCK" | "REMOVE") => {
    if (action === "REMOVE") {
      setRows(rs => rs.filter(r => r.id !== id));
      return;
    }
    setRows(rs => rs.map(r => r.id === id
      ? action === "APPROVE"
        ? { ...r, trusted: true, blocked: false }
        : { ...r, trusted: false, blocked: true }
      : r));
  };

  const columns: Column<DeviceRow>[] = [
    {
      key: "device",
      header: "Device",
      sortable: true,
      sortValue: (r) => r.deviceName,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-ink-100 text-ink-700 grid place-items-center shrink-0">
            {r.browserInfo.includes("iOS") || r.browserInfo.includes("Android") ? <Smartphone className="size-4" /> : <Monitor className="size-4" />}
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-[0.85rem] text-ink-900 truncate">{r.deviceName}</p>
            <p className="text-[0.65rem] text-ink-400 truncate">{r.browserInfo}</p>
          </div>
        </div>
      ),
    },
    {
      key: "student",
      header: "Owner",
      sortable: true,
      sortValue: (r) => r.studentName,
      render: (r) => (
        <div className="leading-tight">
          <p className="text-[0.82rem] text-ink-700">{r.studentName}</p>
          <p className="text-[0.65rem] text-ink-400 numeral">{r.studentRegNo}</p>
        </div>
      ),
    },
    { key: "ip", header: "IP", render: (r) => <span className="numeral text-xs text-ink-500 font-mono">{r.ipAddress}</span> },
    {
      key: "flag",
      header: "Status",
      render: (r) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {r.blocked
            ? <Badge tone="danger" dot>Blocked</Badge>
            : r.trusted
            ? <Badge tone="success" dot>Trusted</Badge>
            : <Badge tone="warning" dot>Untrusted</Badge>}
          {r.multiAccount ? (
            <Badge tone="danger">
              <AlertTriangle className="size-2.5" />
              Multi-account
            </Badge>
          ) : null}
        </div>
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
            value={tab}
            onChange={setTab}
            items={[
              { value: "all", label: "All", count: rows.length },
              { value: "trusted", label: "Trusted", count: rows.filter(r => r.trusted && !r.blocked).length },
              { value: "suspicious", label: "Suspicious", count: rows.filter(r => r.multiAccount || (!r.trusted && !r.blocked)).length },
              { value: "blocked", label: "Blocked", count: rows.filter(r => r.blocked).length },
            ]}
          />
        }
      />

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(r) => r.id}
        searchField={(r) => `${r.deviceName} ${r.studentName} ${r.studentRegNo} ${r.ipAddress}`}
        searchPlaceholder="Search by device, student, IP…"
        rowActions={(r) => (
          <div className="flex items-center justify-end gap-1">
            {!r.trusted || r.blocked ? (
              <button
                type="button"
                onClick={() => applyAction(r.id, "APPROVE")}
                className="size-7 grid place-items-center rounded-lg hover:bg-brand-50 text-ink-400 hover:text-brand-700 transition-colors"
                aria-label="Approve"
                title="Approve as trusted"
              >
                <CheckCircle2 className="size-3.5" />
              </button>
            ) : null}
            {!r.blocked ? (
              <button
                type="button"
                onClick={() => applyAction(r.id, "BLOCK")}
                className="size-7 grid place-items-center rounded-lg hover:bg-rose-50 text-ink-400 hover:text-accent-rose transition-colors"
                aria-label="Block"
                title="Block device"
              >
                <Ban className="size-3.5" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => applyAction(r.id, "REMOVE")}
              className="size-7 grid place-items-center rounded-lg hover:bg-white/70 text-ink-400 hover:text-ink-700 transition-colors"
              aria-label="Remove"
              title="Remove"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      />
    </>
  );
}
