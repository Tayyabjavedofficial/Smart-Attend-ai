"use client";

import { useState } from "react";
import {
  FileBarChart, FileText, FileSpreadsheet, Download,
  BookOpen, UserMinus, Calendar, ArrowRight, ScrollText,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type ReportFormat = "csv" | "xlsx" | "pdf";

export default function TeacherReportsPage() {
  const [courseId, setCourseId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const download = async (endpoint: string, format: ReportFormat, params: Record<string, string>) => {
    setError(null); setSuccess(null);
    setBusy(`${endpoint}-${format}`);
    try {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v) search.set(k, v); });
      search.set("format", format);
      const token = typeof window !== "undefined"
        ? localStorage.getItem("attendai.accessToken")
        : null;
      const res = await fetch(`/api/backend${endpoint}?${search.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        let msg = `Server returned ${res.status}`;
        try { msg = (await res.json())?.error?.message || msg; } catch {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      const dispo = res.headers.get("Content-Disposition") || "";
      const match = /filename="([^"]+)"/.exec(dispo);
      const filename = match?.[1] || `report.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setSuccess(`Downloaded ${filename}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Download attendance reports for your courses. Same data in three formats."
        icon={FileBarChart}
        crumbs={[{ label: "Teacher", href: "/teacher" }, { label: "Reports" }]}
      />

      {/* Course report */}
      <Card className="mb-4">
        <CardHeader
          title="Course Attendance Report"
          subtitle="All enrolled students with their attendance percentage for a course."
        />
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Field label="Course ID" value={courseId} onChange={setCourseId} placeholder="e.g. 7" type="number" />
        </div>
        <FormatButtons
          disabled={!courseId || busy !== null}
          busy={busy}
          prefix={`/reports/course/${courseId || 0}/export-`}
          onClick={(fmt) => download(`/reports/course/${courseId}/export`, fmt, {})}
        />
      </Card>

      {/* Date-range report */}
      <Card className="mb-4">
        <CardHeader
          title="Date-Range Summary"
          subtitle="Daily attendance breakdown across the chosen period."
        />
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Field label="From" type="date" value={from} onChange={setFrom} />
          <Field label="To" type="date" value={to} onChange={setTo} />
          <Field label="Course ID (optional)" type="number" value={courseId} onChange={setCourseId} placeholder="leave blank for all" />
        </div>
        <FormatButtons
          disabled={!from || !to || busy !== null}
          busy={busy}
          prefix="/reports/range/export-"
          onClick={(fmt) => download("/reports/range/export", fmt, { from, to, courseId })}
        />
      </Card>

      {/* Defaulters */}
      <Card className="mb-4">
        <CardHeader
          title="Defaulter List"
          subtitle="Students currently below the 75% attendance threshold."
        />
        <FormatButtons
          disabled={busy !== null}
          busy={busy}
          prefix="/reports/defaulters/export-"
          onClick={(fmt) => download("/reports/defaulters/export", fmt, {})}
        />
      </Card>

      {/* Inline feedback */}
      {error ? (
        <Card>
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-lg bg-rose-50 text-rose-700 grid place-items-center shrink-0">
              <ScrollText className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-900">Download failed</p>
              <p className="text-xs text-ink-500 mt-0.5">{error}</p>
            </div>
          </div>
        </Card>
      ) : success ? (
        <Card>
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-lg bg-brand-50 text-brand-700 grid place-items-center shrink-0">
              <ArrowRight className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-900">Ready</p>
              <p className="text-xs text-ink-500 mt-0.5">{success}</p>
            </div>
          </div>
        </Card>
      ) : null}
    </>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[0.65rem] uppercase tracking-wider text-ink-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-lg bg-white/70 border border-ink-200/60 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );
}

function FormatButtons({
  prefix, onClick, busy, disabled,
}: {
  prefix: string;
  onClick: (fmt: ReportFormat) => void;
  busy: string | null;
  disabled: boolean;
}) {
  const formats: { key: ReportFormat; label: string; icon: typeof FileText; variant: "primary" | "secondary" }[] = [
    { key: "pdf", label: "PDF", icon: FileText, variant: "primary" },
    { key: "xlsx", label: "Excel", icon: FileSpreadsheet, variant: "secondary" },
    { key: "csv", label: "CSV", icon: FileBarChart, variant: "secondary" },
  ];
  return (
    <div className="flex flex-wrap gap-2 pt-3 border-t border-ink-100/80">
      {formats.map(f => {
        const Icon = f.icon;
        const id = prefix + f.key;
        const isBusy = busy === id;
        return (
          <Button
            key={f.key}
            variant={f.variant}
            size="sm"
            onClick={() => onClick(f.key)}
            disabled={disabled}
          >
            {isBusy
              ? <span className="inline-block size-3 rounded-full bg-current animate-pulse" />
              : <Icon className="size-3.5" />}
            {isBusy ? "Generating…" : f.label}
            {!isBusy ? <Download className="size-3.5" /> : null}
          </Button>
        );
      })}
    </div>
  );
}
