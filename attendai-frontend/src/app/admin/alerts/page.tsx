"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ShieldAlert, AlertTriangle, Eye, Clock, Hash, Layers,
  CheckCircle2, X, ArrowRight, Loader2, AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { useProxyAlerts, useResolveAlert } from "@/lib/hooks";
import { type ProxyAlertDto } from "@/lib/api";
import { cn } from "@/lib/cn";

type Severity = ProxyAlertDto["severity"];

const severityTone: Record<Severity, "neutral" | "warning" | "danger"> = {
  LOW: "neutral", MEDIUM: "warning", HIGH: "warning", CRITICAL: "danger",
};
const severityBg: Record<Severity, string> = {
  LOW: "bg-ink-50 text-ink-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-amber-100 text-amber-800",
  CRITICAL: "bg-rose-50 text-rose-700",
};

function relativeTime(iso: string) {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (Number.isNaN(diffMin)) return "";
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}h ago`;
  return `${Math.floor(diffMin / (60 * 24))}d ago`;
}
function cap(s: string) { return s ? s[0] + s.slice(1).toLowerCase() : s; }

export default function AdminAlertsPage() {
  const { data: alerts = [], isLoading, error, refetch } = useProxyAlerts();
  const resolveMut = useResolveAlert();
  const [tab, setTab] = useState("open");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [resolveOpen, setResolveOpen] = useState<null | "RESOLVED" | "DISMISSED">(null);
  const [note, setNote] = useState("");

  const filtered = useMemo(() => {
    if (tab === "all") return alerts;
    if (tab === "open") return alerts.filter(a => a.status === "OPEN");
    if (tab === "critical") return alerts.filter(a => a.severity === "CRITICAL");
    return alerts.filter(a => a.status === "RESOLVED" || a.status === "DISMISSED");
  }, [alerts, tab]);

  const selected = alerts.find(a => a.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (selectedId == null && filtered[0]) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const counts = {
    all: alerts.length,
    open: alerts.filter(a => a.status === "OPEN").length,
    critical: alerts.filter(a => a.severity === "CRITICAL").length,
    closed: alerts.filter(a => a.status === "RESOLVED" || a.status === "DISMISSED").length,
  };

  const applyResolution = (status: "RESOLVED" | "DISMISSED") => {
    if (!selected) return;
    resolveMut.mutate(
      { id: selected.id, status, note },
      { onSuccess: () => { setResolveOpen(null); setNote(""); } }
    );
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
            value={tab} onChange={setTab}
            items={[
              { value: "open", label: "Open", count: counts.open },
              { value: "critical", label: "Critical", count: counts.critical },
              { value: "closed", label: "Closed", count: counts.closed },
              { value: "all", label: "All", count: counts.all },
            ]}
          />
        }
      />

      {error ? (
        <ErrorBox error={error as Error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingBox />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4 items-start">
          {/* List */}
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
                  <li key={a.id}
                    className={cn("p-4 cursor-pointer transition-colors group",
                      selected?.id === a.id ? "bg-brand-50/60" : "hover:bg-white/60")}
                    onClick={() => setSelectedId(a.id)}>
                    <div className="flex items-start gap-3">
                      <div className={cn("size-10 rounded-xl grid place-items-center shrink-0", severityBg[a.severity])}>
                        <AlertTriangle className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge tone={severityTone[a.severity]}>{a.severity}</Badge>
                          {a.status !== "OPEN" ? <Badge tone="neutral">{cap(a.status)}</Badge> : null}
                        </div>
                        <p className="text-[0.85rem] text-ink-900 truncate">{a.alertType}</p>
                        <p className="text-[0.7rem] text-ink-400 truncate mt-0.5">Student #{a.studentId}</p>
                        <p className="text-[0.65rem] text-ink-300 mt-1 numeral">Risk {a.riskScore} · {relativeTime(a.createdAt)}</p>
                      </div>
                      <ArrowRight className={cn("size-3.5 shrink-0 mt-2 transition-opacity",
                        selected?.id === a.id ? "text-brand-700 opacity-100" : "text-ink-300 opacity-0 group-hover:opacity-100")} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Detail */}
          {selected ? (
            <Card className="lg:sticky lg:top-4">
              <div className="flex items-start gap-4 mb-5 pb-5 border-b border-ink-100/80">
                <div className={cn("size-14 rounded-2xl grid place-items-center shrink-0", severityBg[selected.severity])}>
                  <ShieldAlert className="size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge tone={severityTone[selected.severity]} dot>{selected.severity} risk</Badge>
                    <Badge tone="neutral">{cap(selected.status)}</Badge>
                    <span className="text-[0.7rem] text-ink-400 numeral ml-auto">Alert #{selected.id}</span>
                  </div>
                  <h2 className="font-display text-[1.5rem] leading-tight text-ink-900">{selected.alertType}</h2>
                  <p className="text-sm text-ink-500 mt-1">{selected.description}</p>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[0.7rem] uppercase tracking-wider text-ink-400">Risk Score</span>
                  <span className="numeral text-sm font-medium text-ink-900">{selected.riskScore} / 100</span>
                </div>
                <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all",
                    selected.riskScore >= 80 ? "bg-accent-rose" : selected.riskScore >= 60 ? "bg-accent-amber" : "bg-brand-500")}
                    style={{ width: `${Math.min(100, Math.max(0, selected.riskScore))}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <ContextItem icon={Eye} label="Student" value={`#${selected.studentId}`} />
                <ContextItem icon={Layers} label="Session" value={selected.sessionId ? `#${selected.sessionId}` : "—"} />
                <ContextItem icon={Hash} label="Challenge" value={selected.challengeId ? `#${selected.challengeId}` : "—"} />
                <ContextItem icon={Clock} label="Raised" value={relativeTime(selected.createdAt) || "—"} />
              </div>

              <CardHeader title="Decision" subtitle="Choose how to close this alert." className="mb-2" />

              {selected.status === "OPEN" ? (
                <div className="flex flex-wrap gap-2">
                  <Button variant="dark" onClick={() => setResolveOpen("RESOLVED")} disabled={resolveMut.isPending}>
                    <CheckCircle2 className="size-4" /> Confirm violation
                  </Button>
                  <Button variant="secondary" onClick={() => setResolveOpen("DISMISSED")} disabled={resolveMut.isPending}>
                    <X className="size-4" /> Dismiss (false positive)
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-ink-500 italic">This alert is closed.</p>
              )}
            </Card>
          ) : null}
        </div>
      )}

      <Modal
        open={resolveOpen !== null}
        onClose={() => { setResolveOpen(null); setNote(""); }}
        title={resolveOpen === "RESOLVED" ? "Confirm proxy violation" : "Dismiss as false positive"}
        size="sm"
        description="Add a short note for the audit log."
        footer={
          <>
            <Button variant="ghost" onClick={() => { setResolveOpen(null); setNote(""); }} disabled={resolveMut.isPending}>Cancel</Button>
            <Button
              variant={resolveOpen === "RESOLVED" ? "primary" : "secondary"}
              disabled={resolveMut.isPending}
              onClick={() => resolveOpen && applyResolution(resolveOpen)}
            >
              {resolveMut.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {resolveOpen === "RESOLVED" ? "Confirm violation" : "Dismiss alert"}
            </Button>
          </>
        }
      >
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Reviewed device fingerprint — confirmed proxy attempt"
          rows={4}
          className="w-full p-3 rounded-xl bg-white/70 border border-ink-200/60 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
        />
      </Modal>
    </>
  );
}

function ContextItem({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/40 ring-1 ring-ink-100/60">
      <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-wider text-ink-400 mb-1">
        <Icon className="size-3" /> {label}
      </div>
      <p className="text-sm font-medium text-ink-900 truncate numeral">{value}</p>
    </div>
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
      <p className="font-display text-xl text-ink-900">Couldn&apos;t load alerts</p>
      <p className="text-sm text-ink-500 mt-1 mb-4">{error.message}</p>
      <Button variant="secondary" onClick={onRetry}>Try again</Button>
    </div>
  );
}
