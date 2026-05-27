"use client";

import { useState, useMemo } from "react";
import {
  ShieldAlert, AlertTriangle, Eye, ScanFace, Monitor,
  Clock, CheckCircle2, X, ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { ALERTS, type AlertRow } from "@/lib/mockData";
import { cn } from "@/lib/cn";

const severityTone: Record<AlertRow["severity"], "neutral" | "warning" | "danger"> = {
  LOW: "neutral",
  MEDIUM: "warning",
  HIGH: "warning",
  CRITICAL: "danger",
};

const severityRingColor: Record<AlertRow["severity"], string> = {
  LOW: "ring-ink-200",
  MEDIUM: "ring-amber-200",
  HIGH: "ring-amber-300",
  CRITICAL: "ring-rose-300",
};

const severityBg: Record<AlertRow["severity"], string> = {
  LOW: "bg-ink-50 text-ink-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-amber-100 text-amber-800",
  CRITICAL: "bg-rose-50 text-rose-700",
};

function relativeTime(iso: string) {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}h ago`;
  return `${Math.floor(diffMin / (60 * 24))}d ago`;
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState(ALERTS);
  const [tab, setTab] = useState("open");
  const [selectedId, setSelectedId] = useState<number | null>(alerts[0]?.id ?? null);
  const [resolveOpen, setResolveOpen] = useState<null | "RESOLVED" | "DISMISSED">(null);
  const [note, setNote] = useState("");

  const filtered = useMemo(() => {
    if (tab === "all") return alerts;
    if (tab === "open") return alerts.filter(a => a.status === "OPEN");
    if (tab === "critical") return alerts.filter(a => a.severity === "CRITICAL");
    return alerts.filter(a => a.status === "RESOLVED" || a.status === "DISMISSED");
  }, [alerts, tab]);

  const selected = alerts.find(a => a.id === selectedId) ?? filtered[0] ?? null;

  const counts = {
    all: alerts.length,
    open: alerts.filter(a => a.status === "OPEN").length,
    critical: alerts.filter(a => a.severity === "CRITICAL").length,
    closed: alerts.filter(a => a.status === "RESOLVED" || a.status === "DISMISSED").length,
  };

  const applyResolution = (status: "RESOLVED" | "DISMISSED") => {
    if (!selected) return;
    setAlerts(prev => prev.map(a => a.id === selected.id ? { ...a, status, } : a));
    setResolveOpen(null);
    setNote("");
  };

  return (
    <>
      <PageHeader
        title="Proxy Alerts"
        subtitle="AI-flagged attendance attempts that need human review."
        icon={ShieldAlert}
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Proxy Alerts" }]}
        action={
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "open", label: "Open", count: counts.open },
              { value: "critical", label: "Critical", count: counts.critical },
              { value: "closed", label: "Closed", count: counts.closed },
              { value: "all", label: "All", count: counts.all },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4 items-start">
        {/* List pane */}
        <div className="glass rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 px-6">
              <CheckCircle2 className="size-8 text-brand-600 mx-auto mb-2" />
              <p className="font-display text-xl text-ink-700">All clear</p>
              <p className="text-sm text-ink-400 mt-1">No alerts in this view.</p>
            </div>
          ) : (
            <ul className="divide-y divide-ink-100/60 max-h-[70vh] overflow-y-auto">
              {filtered.map(a => (
                <li
                  key={a.id}
                  className={cn(
                    "p-4 cursor-pointer transition-colors group",
                    selected?.id === a.id ? "bg-brand-50/60" : "hover:bg-white/60"
                  )}
                  onClick={() => setSelectedId(a.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "size-10 rounded-xl grid place-items-center shrink-0 ring-2",
                      severityBg[a.severity], severityRingColor[a.severity]
                    )}>
                      <AlertTriangle className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge tone={severityTone[a.severity]}>{a.severity}</Badge>
                        {a.status !== "OPEN" ? (
                          <Badge tone="neutral">{a.status[0] + a.status.slice(1).toLowerCase()}</Badge>
                        ) : null}
                      </div>
                      <p className="text-[0.85rem] text-ink-900 truncate">{a.alertType}</p>
                      <p className="text-[0.7rem] text-ink-400 truncate mt-0.5">
                        {a.studentName} · {a.courseCode}
                      </p>
                      <p className="text-[0.65rem] text-ink-300 mt-1 numeral">
                        Risk {a.riskScore} · {relativeTime(a.createdAt)}
                      </p>
                    </div>
                    <ArrowRight className={cn(
                      "size-3.5 shrink-0 mt-2 transition-opacity",
                      selected?.id === a.id ? "text-brand-700 opacity-100" : "text-ink-300 opacity-0 group-hover:opacity-100"
                    )} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail pane */}
        {selected ? (
          <Card className="lg:sticky lg:top-4">
            <div className="flex items-start gap-4 mb-5 pb-5 border-b border-ink-100/80">
              <div className={cn("size-14 rounded-2xl grid place-items-center shrink-0 ring-2", severityBg[selected.severity], severityRingColor[selected.severity])}>
                <ShieldAlert className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge tone={severityTone[selected.severity]} dot>{selected.severity} risk</Badge>
                  <Badge tone="neutral">{selected.status[0] + selected.status.slice(1).toLowerCase()}</Badge>
                  <span className="text-[0.7rem] text-ink-400 numeral ml-auto">Alert #{selected.id}</span>
                </div>
                <h2 className="font-display text-[1.5rem] leading-tight text-ink-900">{selected.alertType}</h2>
                <p className="text-sm text-ink-500 mt-1">{selected.description}</p>
              </div>
            </div>

            {/* Risk meter */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[0.7rem] uppercase tracking-wider text-ink-400">Risk Score</span>
                <span className="numeral text-sm font-medium text-ink-900">{selected.riskScore} / 100</span>
              </div>
              <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    selected.riskScore >= 80 ? "bg-accent-rose"
                      : selected.riskScore >= 60 ? "bg-accent-amber"
                      : "bg-brand-500"
                  )}
                  style={{ width: `${selected.riskScore}%` }}
                />
              </div>
              <div className="flex justify-between text-[0.65rem] text-ink-300 mt-1 numeral">
                <span>0</span><span>30</span><span>60</span><span>80</span><span>100</span>
              </div>
            </div>

            {/* Context grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <ContextItem icon={Eye} label="Student" value={selected.studentName} sub={selected.studentRegNo} />
              <ContextItem icon={Clock} label="Course" value={selected.courseCode} sub={relativeTime(selected.createdAt) + " ago"} />
              <ContextItem icon={ScanFace} label="Face confidence" value="0.62" sub="Below 0.75 threshold" />
              <ContextItem icon={Monitor} label="Device" value="Untrusted" sub="No prior session" />
            </div>

            <CardHeader title="Decision" subtitle="Choose how to close this alert." className="mb-2" />

            {selected.status === "OPEN" ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="dark" onClick={() => setResolveOpen("RESOLVED")}>
                  <CheckCircle2 className="size-4" />
                  Confirm violation
                </Button>
                <Button variant="secondary" onClick={() => setResolveOpen("DISMISSED")}>
                  <X className="size-4" />
                  Dismiss (false positive)
                </Button>
                <Button variant="ghost">Request more evidence</Button>
              </div>
            ) : (
              <p className="text-sm text-ink-500 italic">This alert is closed. Reopen from the menu if needed.</p>
            )}
          </Card>
        ) : null}
      </div>

      <Modal
        open={resolveOpen !== null}
        onClose={() => { setResolveOpen(null); setNote(""); }}
        title={resolveOpen === "RESOLVED" ? "Confirm proxy violation" : "Dismiss as false positive"}
        size="sm"
        description="Add a short note for the audit log. The student is notified."
        footer={
          <>
            <Button variant="ghost" onClick={() => { setResolveOpen(null); setNote(""); }}>Cancel</Button>
            <Button
              variant={resolveOpen === "RESOLVED" ? "primary" : "secondary"}
              onClick={() => resolveOpen && applyResolution(resolveOpen)}
            >
              {resolveOpen === "RESOLVED" ? "Confirm violation" : "Dismiss alert"}
            </Button>
          </>
        }
      >
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Reviewed device fingerprint — matches roommate's device; confirmed proxy attempt"
          rows={4}
          className="w-full p-3 rounded-xl bg-white/70 border border-ink-200/60 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
        />
      </Modal>
    </>
  );
}

function ContextItem({ icon: Icon, label, value, sub }: { icon: typeof Eye; label: string; value: string; sub?: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/40 ring-1 ring-ink-100/60">
      <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-wider text-ink-400 mb-1">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="text-sm font-medium text-ink-900 truncate">{value}</p>
      {sub ? <p className="text-[0.7rem] text-ink-400 truncate">{sub}</p> : null}
    </div>
  );
}
