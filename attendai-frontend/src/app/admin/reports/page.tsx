"use client";

import { useState } from "react";
import {
  FileBarChart, FileText, FileSpreadsheet, Download,
  Users, BookOpen, UserMinus, ShieldAlert, Calendar,
  type LucideIcon, ArrowRight, CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type ReportFormat = "csv" | "xlsx" | "pdf";

interface ReportTile {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
  endpoint: string;           // e.g. "/reports/defaulters"
  formats: ReportFormat[];
  filters?: Array<{ key: string; label: string; placeholder?: string; type?: "text" | "date" | "number" }>;
  accent: "brand" | "blue" | "amber" | "rose";
}

const REPORTS: ReportTile[] = [
  {
    key: "course",
    icon: BookOpen,
    title: "Course Attendance",
    description: "All enrolled students with attendance % for a course, optionally narrowed by section.",
    endpoint: "/reports/course/{courseId}",
    formats: ["pdf", "xlsx", "csv"],
    filters: [
      { key: "courseId", label: "Course ID", type: "number", placeholder: "e.g. 7" },
      { key: "sectionId", label: "Section ID (optional)", type: "number", placeholder: "e.g. 1" },
    ],
    accent: "brand",
  },
  {
    key: "student",
    icon: Users,
    title: "Student Attendance",
    description: "Per-student course-wise breakdown and overall %. Useful for parent communication.",
    endpoint: "/reports/student/{studentId}",
    formats: ["pdf", "xlsx", "csv"],
    filters: [
      { key: "studentId", label: "Student ID", type: "number", placeholder: "e.g. 101" },
      { key: "from", label: "From", type: "date" },
      { key: "to", label: "To", type: "date" },
    ],
    accent: "blue",
  },
  {
    key: "defaulters",
    icon: UserMinus,
    title: "Defaulter List",
    description: "Students below the attendance threshold across all enrolled courses.",
    endpoint: "/reports/defaulters",
    formats: ["pdf", "xlsx", "csv"],
    filters: [
      { key: "threshold", label: "Threshold % (default 75)", type: "number", placeholder: "75" },
    ],
    accent: "rose",
  },
  {
    key: "proxy-alerts",
    icon: ShieldAlert,
    title: "Proxy Alerts",
    description: "AI-flagged suspicious attempts, optionally filtered by status and date range.",
    endpoint: "/reports/proxy-alerts",
    formats: ["pdf", "xlsx", "csv"],
    filters: [
      { key: "status", label: "Status (OPEN / RESOLVED / DISMISSED)", placeholder: "OPEN" },
      { key: "from", label: "From", type: "date" },
      { key: "to", label: "To", type: "date" },
    ],
    accent: "amber",
  },
  {
    key: "range",
    icon: Calendar,
    title: "Date-Range Summary",
    description: "Daily attendance breakdown over an arbitrary date range. Good for monthly / term reports.",
    endpoint: "/reports/range",
    formats: ["pdf", "xlsx", "csv"],
    filters: [
      { key: "from", label: "From", type: "date" },
      { key: "to", label: "To", type: "date" },
      { key: "courseId", label: "Course ID (optional)", type: "number" },
    ],
    accent: "brand",
  },
];

const accents: Record<ReportTile["accent"], { bg: string; text: string }> = {
  brand: { bg: "bg-brand-50", text: "text-brand-700" },
  blue: { bg: "bg-blue-50", text: "text-blue-700" },
  amber: { bg: "bg-amber-50", text: "text-amber-700" },
  rose: { bg: "bg-rose-50", text: "text-rose-700" },
};

const fmtMeta: Record<ReportFormat, { Icon: LucideIcon; label: string; mime: string }> = {
  pdf:  { Icon: FileText, label: "PDF",   mime: "application/pdf" },
  xlsx: { Icon: FileSpreadsheet, label: "Excel", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  csv:  { Icon: FileBarChart, label: "CSV", mime: "text/csv" },
};

export default function AdminReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Generate, preview, and download attendance reports. PDF for handouts, Excel for analysis, CSV for everything else."
        icon={FileBarChart}
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Reports" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {REPORTS.map(r => <ReportCard key={r.key} report={r} />)}
      </div>

      <Card className="mt-6">
        <CardHeader title="How exports work" subtitle="Same data, three formats." />
        <ul className="space-y-2.5 text-sm text-ink-600">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="size-4 text-brand-600 mt-0.5 shrink-0" />
            <span><strong>PDF</strong> — printable A4 landscape with header band, summary cards, and zebra-striped table. Designed to look like a finished document.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="size-4 text-brand-600 mt-0.5 shrink-0" />
            <span><strong>Excel (.xlsx)</strong> — single sheet with typed cells. Numbers stay numbers, dates stay dates — so <code>=AVERAGE()</code> and pivot tables work without cleanup.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="size-4 text-brand-600 mt-0.5 shrink-0" />
            <span><strong>CSV</strong> — RFC 4180 with UTF-8 BOM (so Excel opens it cleanly). Includes a self-describing comment header.</span>
          </li>
        </ul>
      </Card>
    </>
  );
}

function ReportCard({ report }: { report: ReportTile }) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<ReportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const Icon = report.icon;
  const accent = accents[report.accent];

  const update = (key: string, value: string) => setFilters(f => ({ ...f, [key]: value }));

  const buildUrl = (format: ReportFormat): string | null => {
    // Substitute path placeholders like {courseId}, {studentId}.
    let endpoint = report.endpoint;
    for (const [k, v] of Object.entries(filters)) {
      const token = "{" + k + "}";
      if (endpoint.includes(token)) {
        if (!v) return null;
        endpoint = endpoint.replace(token, encodeURIComponent(v));
      }
    }
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (!v) continue;
      if (endpoint.includes("{" + k + "}")) continue;  // already used as path
      params.set(k, v);
    }
    params.set("format", format);
    return `/api/backend${endpoint}/export?${params.toString()}`;
  };

  const download = async (format: ReportFormat) => {
    setError(null);
    const url = buildUrl(format);
    if (!url) {
      setError("Please fill in the required fields above");
      return;
    }
    setBusy(format);
    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("attendai.accessToken")
        : null;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        // Backend returns ApiResponse envelope as JSON on error.
        let msg = `Server returned ${res.status}`;
        try {
          const body = await res.json();
          msg = body?.error?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      // Filename from Content-Disposition, fallback to a constructed one.
      const dispo = res.headers.get("Content-Disposition") || "";
      const match = /filename="([^"]+)"/.exec(dispo);
      const filename = match?.[1] || `${report.key}.${format}`;
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <div className="flex items-start gap-3 mb-4">
        <div className={cn("size-11 rounded-2xl grid place-items-center shrink-0", accent.bg, accent.text)}>
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-[1.25rem] leading-tight text-ink-900">{report.title}</h3>
          <p className="text-xs text-ink-500 mt-1 balance">{report.description}</p>
        </div>
      </div>

      {report.filters && report.filters.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {report.filters.map(f => (
            <div key={f.key}>
              <label className="block text-[0.65rem] uppercase tracking-wider text-ink-400 mb-1">{f.label}</label>
              <input
                type={f.type || "text"}
                placeholder={f.placeholder}
                value={filters[f.key] || ""}
                onChange={(e) => update(f.key, e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-white/70 border border-ink-200/60 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-3 border-t border-ink-100/80">
        {report.formats.map(fmt => {
          const meta = fmtMeta[fmt];
          const FormatIcon = meta.Icon;
          const isBusy = busy === fmt;
          return (
            <Button
              key={fmt}
              variant={fmt === "pdf" ? "primary" : "secondary"}
              size="sm"
              onClick={() => download(fmt)}
              disabled={busy !== null}
            >
              {isBusy ? <span className="inline-block size-3 rounded-full bg-current animate-pulse" /> : <FormatIcon className="size-3.5" />}
              {isBusy ? "Generating…" : meta.label}
              {!isBusy ? <Download className="size-3.5" /> : null}
            </Button>
          );
        })}
        <span className="ml-auto text-[0.7rem] text-ink-400 self-center">3 formats · auto-named</span>
      </div>

      {error ? (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-50/60 ring-1 ring-rose-200/60">
          <Badge tone="danger">{error}</Badge>
        </div>
      ) : null}
    </Card>
  );
}
