"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Radio, Plus, Play, Square, RefreshCw, Loader2, AlertCircle, Clock,
  Users, Hash, MapPin, Trash2, BookOpen, ChevronRight,
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

type ClassRef = { courseId: number; sectionId: number; courseCode: string; courseName: string; sectionName: string };

export default function TeacherSessionsPage() {
  const qc = useQueryClient();
  const { data: sessions = [], isLoading, error, refetch, isFetching } = useTeacherSessions();
  const { data: assignments = [] } = useTeacherCourses();

  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<Record<number, ChallengeInfo>>({});

  // Create modal, scoped to one class
  const [createFor, setCreateFor] = useState<ClassRef | null>(null);
  const [title, setTitle] = useState("");
  const [requireLocation, setRequireLocation] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Delete confirm
  const [toDelete, setToDelete] = useState<TeacherSession | null>(null);

  // Which class blocks are expanded (default: all open).
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const refresh = () => qc.invalidateQueries({ queryKey: qk.teacher.sessions });

  // Group sessions under each class (seeded from assignments so empty classes show).
  const groups = useMemo(() => {
    const map = new Map<string, { cls: ClassRef; sessions: TeacherSession[] }>();
    (assignments as TeacherCourseOption[]).forEach((a) => {
      map.set(`${a.courseId}:${a.sectionId}`, {
        cls: { courseId: a.courseId, sectionId: a.sectionId, courseCode: a.courseCode, courseName: a.courseName, sectionName: a.sectionName },
        sessions: [],
      });
    });
    sessions.forEach((s) => {
      const key = `${s.courseId}:${s.sectionId}`;
      if (!map.has(key)) {
        map.set(key, { cls: { courseId: s.courseId, sectionId: s.sectionId, courseCode: s.courseCode, courseName: s.courseName, sectionName: s.sectionName }, sessions: [] });
      }
      map.get(key)!.sessions.push(s);
    });
    // Newest sessions first within each class.
    map.forEach((g) => g.sessions.sort((a, b) => b.id - a.id));
    return Array.from(map.values());
  }, [assignments, sessions]);

  const openCreate = (cls: ClassRef) => { setCreateFor(cls); setTitle(""); setRequireLocation(false); setErr(null); };

  const createSession = async () => {
    if (!createFor) return;
    setErr(null); setBusy(true);
    try {
      await api.teacher.createSession({ courseId: createFor.courseId, sectionId: createFor.sectionId, sessionTitle: title.trim() || undefined, requireLocation });
      setCreateFor(null);
      refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not create session.");
    } finally { setBusy(false); }
  };

  const start = async (s: TeacherSession) => {
    setBusy(true);
    try {
      const res = await api.teacher.startSession(s.id, { durationSeconds: 60, challengeType: "CODE_QR" });
      setCodes((c) => ({ ...c, [s.id]: res.challenge }));
      refresh();
    } catch (e) { alert(e instanceof ApiError ? e.message : "Could not start session."); }
    finally { setBusy(false); }
  };
  const newCode = async (s: TeacherSession) => {
    setBusy(true);
    try {
      const ch = await api.teacher.nextChallenge(s.id, { durationSeconds: 60, challengeType: "CODE_QR" });
      setCodes((c) => ({ ...c, [s.id]: ch }));
    } catch (e) { alert(e instanceof ApiError ? e.message : "Could not generate a new code."); }
    finally { setBusy(false); }
  };
  const close = async (s: TeacherSession) => {
    setBusy(true);
    try {
      await api.teacher.closeSession(s.id);
      setCodes((c) => { const n = { ...c }; delete n[s.id]; return n; });
      refresh();
    } catch (e) { alert(e instanceof ApiError ? e.message : "Could not close session."); }
    finally { setBusy(false); }
  };
  const doDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await api.teacher.deleteSession(toDelete.id);
      setCodes((c) => { const n = { ...c }; delete n[toDelete.id]; return n; });
      setToDelete(null);
      refresh();
    } catch (e) { alert(e instanceof ApiError ? e.message : "Could not delete session."); }
    finally { setBusy(false); }
  };

  const toggle = (key: string) => setCollapsed((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });

  return (
    <>
      <PageHeader
        title="Attendance Sessions"
        subtitle="Open a course, start a session, share the live code."
        icon={Radio}
        crumbs={[{ label: "Teacher", href: "/teacher" }, { label: "Sessions" }]}
        action={<Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>{isFetching ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Refresh</Button>}
      />

      {assignments.length === 0 ? (
        <div className="rounded-2xl p-4 mb-4 text-sm text-amber-900 bg-amber-50/60 ring-1 ring-amber-200/60">
          <AlertCircle className="inline size-4 mr-1" />
          You aren&apos;t assigned to any course yet. Ask an admin to assign you (Admin → Assignments).
        </div>
      ) : null}

      {error ? (
        <ErrorBox error={error as Error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingBox />
      ) : groups.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <BookOpen className="size-8 text-ink-300 mx-auto mb-2" />
          <p className="font-display text-xl text-ink-700">No courses yet</p>
          <p className="text-sm text-ink-400 mt-1">Once an admin assigns you to a course, it&apos;ll appear here.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {groups.map(({ cls, sessions: cs }) => {
            const key = `${cls.courseId}:${cls.sectionId}`;
            const isCollapsed = collapsed.has(key);
            const active = cs.filter((s) => s.status === "ACTIVE").length;
            return (
              <div key={key} className="glass rounded-2xl overflow-hidden">
                {/* Course header */}
                <div className="flex items-center gap-3 p-4">
                  <button onClick={() => toggle(key)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <ChevronRight className={cn("size-4 text-ink-400 transition-transform shrink-0", !isCollapsed && "rotate-90")} />
                    <div className="size-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white grid place-items-center shrink-0 font-display text-xs">
                      {cls.courseCode.replace(/[0-9]/g, "").slice(0, 2) || "C"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[0.95rem] text-ink-900 truncate"><span className="numeral font-medium">{cls.courseCode}</span> — {cls.courseName}</p>
                      <p className="text-xs text-ink-400">{cls.sectionName} · {cs.length} session{cs.length === 1 ? "" : "s"}{active > 0 ? ` · ${active} live` : ""}</p>
                    </div>
                  </button>
                  <Button onClick={() => openCreate(cls)} disabled={busy}><Plus className="size-4" /> New Session</Button>
                </div>

                {/* Sessions */}
                {!isCollapsed ? (
                  <div className="px-4 pb-4 space-y-3">
                    {cs.length === 0 ? (
                      <p className="text-sm text-ink-400 py-3 text-center">No sessions yet for this class. Click &quot;New Session&quot; to start one.</p>
                    ) : cs.map((s) => (
                      <SessionCard
                        key={s.id} session={s} code={codes[s.id]} busy={busy}
                        onStart={() => start(s)} onNewCode={() => newCode(s)} onClose={() => close(s)} onDelete={() => setToDelete(s)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Create */}
      <Modal
        open={createFor !== null}
        onClose={() => setCreateFor(null)}
        title="New Attendance Session"
        description={createFor ? `${createFor.courseCode} — ${createFor.courseName} · ${createFor.sectionName}` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateFor(null)} disabled={busy}>Cancel</Button>
            <Button onClick={createSession} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null} Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide">Title (optional)</label>
            <input className={fieldCls} placeholder="e.g. Week 7 Lecture" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <label className="flex items-start gap-3 p-3 rounded-xl bg-brand-50/50 ring-1 ring-brand-100 cursor-pointer">
            <input type="checkbox" className="size-4 accent-brand-600 mt-0.5" checked={requireLocation} onChange={(e) => setRequireLocation(e.target.checked)} />
            <span className="text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium text-ink-900"><MapPin className="size-3.5 text-brand-600" /> Require on-campus location</span>
              <span className="block text-xs text-ink-500 mt-0.5">Students must be on campus (within the geofence) to mark — blocks remote proxies.</span>
            </span>
          </label>
          {err ? <Badge tone="danger">{err}</Badge> : null}
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        size="sm"
        title="Delete this session?"
        description={toDelete ? `${toDelete.courseCode} · ${toDelete.sessionCode}${toDelete.sessionTitle ? ` · ${toDelete.sessionTitle}` : ""}` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)} disabled={busy}>Cancel</Button>
            <Button variant="danger" onClick={doDelete} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null} Delete session
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">This permanently removes the session and its attendance records, challenges, and alerts. This can&apos;t be undone.</p>
      </Modal>
    </>
  );
}

function SessionCard({ session, code, busy, onStart, onNewCode, onClose, onDelete }: {
  session: TeacherSession; code?: ChallengeInfo; busy: boolean;
  onStart: () => void; onNewCode: () => void; onClose: () => void; onDelete: () => void;
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
    <div className="rounded-xl ring-1 ring-ink-100/70 bg-white/50 p-3.5">
      <div className="flex items-start gap-3">
        <div className={cn("size-9 rounded-lg grid place-items-center shrink-0",
          isActive ? "bg-brand-600 text-white" : isScheduled ? "bg-amber-50 text-amber-700" : "bg-ink-100 text-ink-500")}>
          <Radio className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge tone={isActive ? "live" : isScheduled ? "warning" : "neutral"} dot>{session.status}</Badge>
            <span className="text-[0.7rem] text-ink-400 numeral">{session.sessionCode}</span>
            {session.requireLocation ? <span className="inline-flex items-center gap-0.5 text-[0.65rem] text-brand-700"><MapPin className="size-3" />on-campus</span> : null}
          </div>
          {session.sessionTitle ? <p className="text-[0.82rem] text-ink-700 mt-0.5">{session.sessionTitle}</p> : null}
        </div>
        <div className="flex gap-1.5 shrink-0">
          {isScheduled ? <Button size="sm" onClick={onStart} disabled={busy}><Play className="size-3.5" /> Start</Button> : null}
          {isActive ? (
            <>
              <Button size="sm" variant="secondary" onClick={onNewCode} disabled={busy}><Hash className="size-3.5" /> New code</Button>
              <Button size="sm" variant="danger" onClick={onClose} disabled={busy}><Square className="size-3.5" /> Close</Button>
            </>
          ) : null}
          {!isActive ? (
            <button onClick={onDelete} disabled={busy}
              className="size-8 grid place-items-center rounded-lg text-ink-400 hover:text-accent-rose hover:bg-rose-50 transition-colors disabled:opacity-30"
              aria-label="Delete session" title="Delete">
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      {isActive && code ? (
        <div className="mt-3 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 text-white p-4 text-center">
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-white/50">Live code — share with students</p>
          <p className="font-display text-[2.2rem] tracking-[0.3em] leading-none mt-1.5 numeral">{code.challengeCode}</p>
          <div className="inline-flex items-center gap-1.5 mt-1.5 text-sm">
            <Clock className="size-3.5" />
            <span className={cn("numeral", secsLeft <= 10 ? "text-rose-200" : "text-white/80")}>
              {Math.floor(secsLeft / 60)}:{(secsLeft % 60).toString().padStart(2, "0")}
            </span>
            {secsLeft === 0 ? <span className="text-rose-200">· expired — “New code”</span> : null}
          </div>
        </div>
      ) : null}

      {isActive && !code ? (
        <p className="mt-2 text-xs text-ink-400">Active. Click <strong>New code</strong> to issue a challenge for students.</p>
      ) : null}

      {isActive ? (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-ink-500"><Users className="size-3.5" /> Live</div>
          <div className="flex gap-1.5 flex-wrap">
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
    </div>
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
