"use client";

import { Bell, AlertTriangle, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useTeacherAlerts } from "@/lib/hooks";
import { type TeacherAlertRow } from "@/lib/api";
import { cn } from "@/lib/cn";

const severityTone: Record<TeacherAlertRow["severity"], "neutral" | "warning" | "danger"> = {
  LOW: "neutral", MEDIUM: "warning", HIGH: "warning", CRITICAL: "danger",
};
const severityBg: Record<TeacherAlertRow["severity"], string> = {
  LOW: "bg-ink-50 text-ink-700", MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-amber-100 text-amber-800", CRITICAL: "bg-rose-50 text-rose-700",
};

function rel(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (Number.isNaN(m)) return "";
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

export default function TeacherAlertsPage() {
  const { data: alerts = [], isLoading, error, refetch } = useTeacherAlerts();

  return (
    <>
      <PageHeader
        title="Alerts"
        subtitle="AI-flagged suspicious attempts in your sessions."
        icon={Bell}
        crumbs={[{ label: "Teacher", href: "/teacher" }, { label: "Alerts" }]}
      />

      {error ? (
        <div className="glass rounded-2xl p-12 text-center">
          <AlertCircle className="size-7 text-accent-rose mx-auto mb-2" />
          <p className="font-display text-xl text-ink-900">Couldn&apos;t load alerts</p>
          <p className="text-sm text-ink-500 mt-1 mb-4">{(error as Error).message}</p>
          <Button variant="secondary" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : isLoading ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Loader2 className="size-6 text-brand-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-ink-500">Loading…</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <CheckCircle2 className="size-8 text-brand-600 mx-auto mb-2" />
          <p className="font-display text-xl text-ink-700">All clear</p>
          <p className="text-sm text-ink-400 mt-1">No suspicious attempts flagged in your sessions.</p>
        </div>
      ) : (
        <div className="grid gap-3 max-w-2xl">
          {alerts.map((a) => (
            <Card key={a.id} className="flex items-start gap-3">
              <div className={cn("size-10 rounded-xl grid place-items-center shrink-0", severityBg[a.severity])}>
                <AlertTriangle className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge tone={severityTone[a.severity]}>{a.severity}</Badge>
                  {a.status !== "OPEN" ? <Badge tone="neutral">{a.status}</Badge> : null}
                  <span className="text-[0.7rem] text-ink-400 ml-auto numeral">Risk {a.riskScore} · {rel(a.createdAt)}</span>
                </div>
                <p className="text-[0.9rem] text-ink-900 mt-1">{a.alertType}</p>
                <p className="text-xs text-ink-500 mt-0.5">{a.description}</p>
                <p className="text-[0.7rem] text-ink-400 mt-1 numeral">Student #{a.studentId}{a.sessionId ? ` · Session #${a.sessionId}` : ""}</p>
              </div>
            </Card>
          ))}
          <p className="text-xs text-ink-400 px-1">Resolution is handled by an admin in the Proxy Alerts panel.</p>
        </div>
      )}
    </>
  );
}
