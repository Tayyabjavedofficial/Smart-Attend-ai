"use client";

import { useMemo, useState } from "react";
import {
  ClipboardList, CheckCircle2, XCircle, Clock, AlertTriangle,
  ShieldAlert, FileText, Filter, Download, FileSpreadsheet, FileBarChart,
  AlertCircle, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { useAuthStore } from "@/store/authStore";
import { useHistory } from "@/lib/hooks";
import type { AttendanceStatus } from "@/types/api";

/** Normalised history row — tolerates both the real backend shape
 *  (markedAt) and the mock shape (date/courseName/remarks). */
interface HistRow {
  recordId: number;
  ts: string;
  courseCode: string;
  courseName?: string;
  status: AttendanceStatus;
  riskScore: number | null;
  remarks?: string;
}

const statusMeta: Record<AttendanceStatus, { tone: "success" | "danger" | "warning" | "neutral"; Icon: typeof CheckCircle2; label: string }> = {
  PRESENT:         { tone: "success", Icon: CheckCircle2, label: "Present" },
  MANUAL_PRESENT:  { tone: "success", Icon: CheckCircle2, label: "Manual present" },
  EXCUSED:         { tone: "neutral", Icon: FileText, label: "Excused" },
  LATE:            { tone: "warning", Icon: Clock, label: "Late" },
  ABSENT:          { tone: "danger",  Icon: XCircle, label: "Absent" },
  REJECTED:        { tone: "danger",  Icon: XCircle, label: "Rejected" },
  PENDING_REVIEW:  { tone: "warning", Icon: AlertTriangle, label: "Pending review" },
  SUSPICIOUS:      { tone: "danger",  Icon: ShieldAlert, label: "Suspicious" },
};

export default function StudentHistoryPage() {
  const { data, isLoading, error } = useHistory();
  const [tab, setTab] = useState("all");
  const [course, setCourse] = useState("all");

  const rows = useMemo<HistRow[]>(() => {
    const content = (data as { content?: unknown[] } | undefined)?.content ?? [];
    return (content as Record<string, unknown>[]).map((r) => ({
      recordId: Number(r.recordId),
      ts: String(r.markedAt ?? r.date ?? ""),
      courseCode: String(r.courseCode ?? ""),
      courseName: r.courseName ? String(r.courseName) : undefined,
      status: (r.status as AttendanceStatus) ?? "PENDING_REVIEW",
      riskScore: r.riskScore == null ? null : Number(r.riskScore),
      remarks: r.remarks ? String(r.remarks) : undefined,
    }));
  }, [data]);

  const courses = useMemo(() => Array.from(new Set(rows.map(r => r.courseCode).filter(Boolean))).sort(), [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (course !== "all" && r.courseCode !== course) return false;
      if (tab === "all") return true;
      if (tab === "present") return r.status === "PRESENT" || r.status === "MANUAL_PRESENT";
      if (tab === "late") return r.status === "LATE";
      if (tab === "absent") return r.status === "ABSENT" || r.status === "REJECTED";
      if (tab === "issues") return r.status === "SUSPICIOUS" || r.status === "PENDING_REVIEW";
      return true;
    });
  }, [rows, tab, course]);

  const counts = useMemo(() => {
    const base = course === "all" ? rows : rows.filter(r => r.courseCode === course);
    return {
      all: base.length,
      present: base.filter(r => r.status === "PRESENT" || r.status === "MANUAL_PRESENT").length,
      late: base.filter(r => r.status === "LATE").length,
      absent: base.filter(r => r.status === "ABSENT" || r.status === "REJECTED").length,
      issues: base.filter(r => r.status === "SUSPICIOUS" || r.status === "PENDING_REVIEW").length,
    };
  }, [rows, course]);

  const columns: Column<HistRow>[] = [
    {
      key: "date",
      header: "Date",
      sortable: true,
      sortValue: (r) => new Date(r.ts).getTime() || 0,
      render: (r) => (
        <div className="leading-tight">
          <p className="text-[0.82rem] text-ink-900">
            {r.ts ? new Date(r.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
          </p>
          <p className="text-[0.65rem] text-ink-400 numeral">
            {r.ts ? new Date(r.ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : ""}
          </p>
        </div>
      ),
    },
    {
      key: "course",
      header: "Course",
      sortable: true,
      sortValue: (r) => r.courseCode,
      render: (r) => (
        <div className="leading-tight">
          <p className="text-[0.82rem] text-ink-900"><span className="numeral font-medium">{r.courseCode || "—"}</span></p>
          {r.courseName ? <p className="text-[0.65rem] text-ink-400 truncate max-w-[200px]">{r.courseName}</p> : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const m = statusMeta[r.status] ?? statusMeta.PENDING_REVIEW;
        return <Badge tone={m.tone} dot>{m.label}</Badge>;
      },
    },
    {
      key: "risk",
      header: "Risk",
      align: "center",
      sortable: true,
      sortValue: (r) => r.riskScore ?? 0,
      render: (r) => r.riskScore !== null ? (
        <span className={`numeral text-xs font-medium ${r.riskScore >= 60 ? "text-accent-rose" : r.riskScore >= 30 ? "text-accent-amber" : "text-brand-700"}`}>
          {r.riskScore}
        </span>
      ) : <span className="text-ink-300">—</span>,
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (r) => r.remarks ? (
        <span className="text-xs text-ink-500 italic truncate block max-w-[260px]">{r.remarks}</span>
      ) : <span className="text-ink-300">—</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Attendance History"
        subtitle="Every session, every check, every result — your full record."
        icon={ClipboardList}
        crumbs={[{ label: "Student", href: "/student" }, { label: "History" }]}
        action={<ExportMenu />}
      />

      {error ? (
        <Card className="text-center py-12">
          <AlertCircle className="size-7 text-accent-rose mx-auto mb-2" />
          <p className="font-display text-xl text-ink-900">Couldn&apos;t load your history</p>
          <p className="text-sm text-ink-500 mt-1">{(error as Error).message}</p>
        </Card>
      ) : isLoading ? (
        <Card className="flex items-center justify-center py-16 text-ink-400">
          <Loader2 className="size-5 animate-spin mr-2" /> Loading your records…
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: "all", label: "All", count: counts.all },
                { value: "present", label: "Present", count: counts.present },
                { value: "late", label: "Late", count: counts.late },
                { value: "absent", label: "Absent", count: counts.absent },
                { value: "issues", label: "Flagged", count: counts.issues },
              ]}
            />
            <div className="ml-auto flex items-center gap-2">
              <Filter className="size-3.5 text-ink-400" />
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="h-9 px-3 rounded-lg bg-white/70 border border-ink-200/60 text-xs outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="all">All courses</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <DataTable
            data={filtered}
            columns={columns}
            rowKey={(r) => r.recordId}
            pageSize={12}
            searchField={(r) => `${r.courseCode} ${r.courseName ?? ""} ${r.status}`}
            searchPlaceholder="Search history…"
            emptyTitle={rows.length === 0 ? "No attendance records yet" : "No records in this view"}
            emptyHint={rows.length === 0 ? "Marks you make in live sessions will appear here." : "Try a different filter."}
          />
        </>
      )}
    </>
  );
}

/**
 * Three-button export dropdown that hits /api/backend/reports/student/{id}/export
 * with the current auth token.
 */
function ExportMenu() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fmts: { key: "pdf" | "xlsx" | "csv"; label: string; Icon: typeof FileText }[] = [
    { key: "pdf", label: "PDF", Icon: FileText },
    { key: "xlsx", label: "Excel", Icon: FileSpreadsheet },
    { key: "csv", label: "CSV", Icon: FileBarChart },
  ];

  const download = async (format: "pdf" | "xlsx" | "csv") => {
    if (!user) return;
    setError(null);
    setBusy(format);
    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("attendai.accessToken")
        : null;
      const res = await fetch(
        `/api/backend/reports/student/${user.id}/export?format=${format}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) {
        let msg = `Server returned ${res.status}`;
        try { msg = (await res.json())?.error?.message || msg; } catch {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      const dispo = res.headers.get("Content-Disposition") || "";
      const filename = /filename="([^"]+)"/.exec(dispo)?.[1] || `attendance.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative">
      <Button variant="secondary" onClick={() => setOpen(o => !o)}>
        <Download className="size-4" />
        Export
      </Button>
      {open ? (
        <div className="absolute right-0 mt-2 w-44 glass rounded-xl p-1.5 z-30 shadow-glass-lg">
          {fmts.map(f => {
            const Icon = f.Icon;
            const isBusy = busy === f.key;
            return (
              <button
                key={f.key}
                type="button"
                disabled={busy !== null}
                onClick={() => download(f.key)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-ink-700 hover:bg-white/70 transition-colors disabled:opacity-50"
              >
                <Icon className="size-3.5 text-brand-700" />
                <span className="flex-1 text-left">{f.label}</span>
                {isBusy
                  ? <span className="size-2 rounded-full bg-brand-600 animate-pulse" />
                  : <Download className="size-3 text-ink-400" />}
              </button>
            );
          })}
          {error ? (
            <p className="px-2.5 pt-1.5 text-[0.65rem] text-accent-rose">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
