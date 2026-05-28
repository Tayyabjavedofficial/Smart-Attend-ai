"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Radio, Plus, Play, Square, RefreshCw, Loader2, AlertCircle, Clock,
  Users, Hash,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useTeacherSessions, useTeacherCourses, useSessionLive, qk } from "@/lib/hooks";
import { api, ApiError, type TeacherSession, type ChallengeInfo, type TeacherCourseOption } from "@/lib/api";
import { cn } from "@/lib/cn";

const fieldCls = "block w-full h-11 px-3.5 rounded-xl bg-white/70 border border-ink-200/60 text-sm text-ink-900 outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500";

export default function TeacherSessionsPage() {
  const qc = useQueryClient();
  const { data: sessions = [], isLoading, error, refetch } = useTeacherSessions();
  const { data: assignments = [] } = useTeacherCourses();

  const [createOpen, setCreateOpen] = useState(false);
  const [assignmentKey, setAssignmentKey] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Latest issued challenge per session (so the teacher can display the code).
  const [codes, setCodes] = useState<Record<number, ChallengeInfo>>({});

  const refresh = () => qc.invalidateQueries({ queryKey: qk.teacher.sessions });

  const createSession = async () => {
    const opt = (assignments as TeacherCourseOption[]).find(a => `${a.courseId}:${a.sectionId}` === assignmentKey);
    if (!opt) { setErr("Pick a course & section."); return; }
    setErr(null); setBusy(true);
    try {
      await api.teacher.createSession({ courseId: opt.courseId, sectionId: opt.sectionId, sessionTitle: title.trim() || undefined });
      setCreateOpen(false); setTitle(""); setAssignmentKey("");
      refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not create session.");
    } finally { setBusy(false); }
  };

  const start = async (s: TeacherSession) => {
    setBusy(true);
    try {
      const res = await api.teacher.startSession(s.id, { durationSeconds: 60, challengeType: "CODE_QR" });
      setCodes(c => ({ ...c, [s.id]: res.challenge }));
      refresh();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Could not start session.");
    } finally { setBusy(false); }
  };

  const newCode = async (s: TeacherSession) => {
    setBusy(true);
    try {
      const ch = await api.teacher.nextChallenge(s.id, { durationSeconds: 60, challengeType: "CODE_QR" });
      setCodes(c => ({ ...c, [s.id]: ch }));
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Could not generate a new code.");
    } finally { setBusy(false); }
  };

  const close = async (s: TeacherSession) => {
    setBusy(true);
    try {
      await api.teacher.closeSession(s.id);
      setCodes(c => { const n = { ...c }; delete n[s.id]; return n; });
      refresh();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Could not close session.");
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader
        title="Attendance Sessions"
        subtitle="Start a session, share the live code, and watch attendance come in."
        icon={Radio}
        crumbs={[{ label: "Teacher", href: "/teacher" }, { label: "Sessions" }]}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => refetch()}><RefreshCw className="size-4" /> Refresh</Button>
            <Button onClick={() => { setErr(null); setCreateOpen(true); }} disabled={assignments.length === 0}>
              <Plus className="size-4" /> New Session
            </Button>
          </div>
        }
      />

      {assignments.length === 0 ? (
        <div className="rounded-2xl p-4 mb-4 text-sm text-amber-900 bg-amber-50/60 ring-1 ring-amber-200/60">
          <AlertCircle className="inline size-4 mr-1" />
          You aren&apos;t assigned to any course yet. Ask an admin to assign you (Admin → Assignments) before creating a session.
        </div>
      ) : null}

      {error ? (
        <ErrorBox error={error as Error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingBox />
      ) : sessions.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Radio className="size-8 text-ink-300 mx-auto mb-2" />
          <p className="font-display text-xl text-ink-700">No sessions yet</p>
          <p className="text-sm text-ink-400 mt-1">Click &quot;New Session&quot; to create one for a course you teach.</p>
        </div>
      ) : (
        <div className="grid gap-4 max-w-3xl">
          {sessions.map((s) => (
            <SessionCard
              key={s.id} session={s} code={codes[s.id]} busy={busy}
              onStart={() => start(s)} onNewCode={() => newCode(s)} onClose={() => close(s)}
            />
          ))}
        </div>
      )}

      {/* Create */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Attendance Session"
        description="Pick a course & section you teach. You'll start it and get a code next."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={createSession} disabled={busy || !assignmentKey}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null} Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide">Course &amp; Section</label>
            <select className={fieldCls} value={assignmentKey} onChange={(e) => setAssignmentKey(e.target.value)}>
              <option value="" disabled>Select…</option>
              {(assignments as TeacherCourseOption[]).map((a) => (
                <option key={a.assignmentId} value={`${a.courseId}:${a.sectionId}`}>
                  {a.courseCode} — {a.courseName} · {a.sectionName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide">Title (optional)</label>
            <input className={fieldCls} placeholder="e.g. Week 7 Lecture" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          {err ? <Badge tone="danger">{err}</Badge> : null}
        </div>
      </Modal>
    </>
  );
}

function SessionCard({ session, code, busy, onStart, onNewCode, onClose }: {
  session: TeacherSession; code?: ChallengeInfo; busy: boolean;
  onStart: () => void; onNewCode: () => void; onClose: () => void;
}) {
  const isActive = session.status === "ACTIVE";
  const isScheduled = session.status === "SCHEDULED";
  const { data: live, refetch: refetchLive } = useSessionLive(isActive ? session.id : null);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!code) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [code]);
  const secsLeft = useMemo(() => code ? Math.max(0, Math.round((new Date(code.expiryTime).getTime() - now) / 1000)) : 0, [code, now]);

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className={cn("size-11 rounded-xl grid place-items-center shrink-0",
          isActive ? "bg-brand-600 text-white" : isScheduled ? "bg-amber-50 text-amber-700" : "bg-ink-100 text-ink-500")}>
          <Radio className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge tone={isActive ? "live" : isScheduled ? "warning" : "neutral"} dot>{session.status}</Badge>
            <span className="text-[0.7rem] text-ink-400 numeral">{session.sessionCode}</span>
          </div>
          <p className="text-[0.95rem] text-ink-900 mt-0.5">
            <span className="numeral font-medium">{session.courseCode}</span> — {session.courseName}
          </p>
          <p className="text-xs text-ink-400">{session.sectionName}{session.sessionTitle ? ` · ${session.sessionTitle}` : ""}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {isScheduled ? <Button onClick={onStart} disabled={busy}><Play className="size-4" /> Start</Button> : null}
          {isActive ? (
            <>
              <Button variant="secondary" onClick={onNewCode} disabled={busy}><Hash className="size-4" /> New code</Button>
              <Button variant="danger" onClick={onClose} disabled={busy}><Square className="size-4" /> Close</Button>
            </>
          ) : null}
        </div>
      </div>

      {isActive && code ? (
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 text-white p-5 text-center">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/50">Live code — share with students</p>
          <p className="font-display text-[2.6rem] tracking-[0.3em] leading-none mt-2 numeral">{code.challengeCode}</p>
          <div className="inline-flex items-center gap-1.5 mt-2 text-sm">
            <Clock className="size-3.5" />
            <span className={cn("numeral", secsLeft <= 10 ? "text-rose-200" : "text-white/80")}>
              {Math.floor(secsLeft / 60)}:{(secsLeft % 60).toString().padStart(2, "0")}
            </span>
            {secsLeft === 0 ? <span className="text-rose-200">· expired — click “New code”</span> : null}
          </div>
        </div>
      ) : null}

      {isActive && !code ? (
        <p className="mt-3 text-xs text-ink-400">Session is active. Click <strong>New code</strong> to issue a challenge for students to enter.</p>
      ) : null}

      {isActive ? (
        <div className="mt-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-ink-500"><Users className="size-3.5" /> Live</div>
          <div className="flex gap-2 flex-wrap">
            <Stat label="Present" value={live?.present ?? 0} tone="success" />
            <Stat label="Pending" value={live?.pendingReview ?? 0} tone="warning" />
            <Stat label="Suspicious" value={live?.suspicious ?? 0} tone="danger" />
            <Stat label="Total" value={live?.total ?? 0} tone="neutral" />
          </div>
          <button onClick={() => refetchLive()} className="ml-auto text-ink-400 hover:text-brand-700" aria-label="Refresh counts">
            <RefreshCw className="size-3.5" />
          </button>
        </div>
      ) : null}
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "danger" | "neutral" }) {
  const c = tone === "success" ? "text-brand-700 bg-brand-50" : tone === "warning" ? "text-amber-700 bg-amber-50" : tone === "danger" ? "text-rose-700 bg-rose-50" : "text-ink-600 bg-ink-100";
  return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs", c)}><b className="numeral">{value}</b> {label}</span>;
}

function LoadingBox() {
  return <div className="glass rounded-2xl p-12 text-center"><Loader2 className="size-6 text-brand-600 animate-spin mx-auto mb-2" /><p className="text-sm text-ink-500">Loading…</p></div>;
}
function ErrorBox({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <AlertCircle className="size-7 text-accent-rose mx-auto mb-2" />
      <p className="font-display text-xl text-ink-900">Couldn&apos;t load sessions</p>
      <p className="text-sm text-ink-500 mt-1 mb-4">{error.message}</p>
      <Button variant="secondary" onClick={onRetry}>Try again</Button>
    </div>
  );
}
