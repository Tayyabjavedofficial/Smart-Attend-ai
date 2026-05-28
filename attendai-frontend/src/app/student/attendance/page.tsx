"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Radio, ScanFace, CheckCircle2, ArrowRight, ArrowLeft, Sparkles,
  AlertCircle, Loader2, Clock, ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { WebcamCapture } from "@/components/webcam/WebcamCapture";
import { useActiveSessions, useMarkAttendance } from "@/lib/hooks";
import { api, ApiError, type StudentSession, type CurrentChallenge, type MarkResult } from "@/lib/api";
import { cn } from "@/lib/cn";

export default function MarkAttendancePage() {
  const { data: sessions = [], isLoading, error, refetch } = useActiveSessions();
  const markMut = useMarkAttendance();

  const [selected, setSelected] = useState<StudentSession | null>(null);
  const [challenge, setChallenge] = useState<CurrentChallenge | null>(null);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(false);

  const [code, setCode] = useState("");
  const [face, setFace] = useState<string | null>(null);
  const [result, setResult] = useState<MarkResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Countdown to the challenge expiry.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!challenge) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [challenge]);
  const secondsLeft = useMemo(() => {
    if (!challenge) return 0;
    return Math.max(0, Math.round((new Date(challenge.expiryTime).getTime() - now) / 1000));
  }, [challenge, now]);

  const join = async (s: StudentSession) => {
    setSelected(s);
    setChallenge(null); setChallengeError(null); setLoadingChallenge(true);
    setCode(""); setFace(null); setResult(null); setSubmitError(null);
    try {
      setChallenge(await api.student.currentChallenge(s.id));
    } catch (e) {
      setChallengeError(e instanceof ApiError ? e.message : "No active challenge right now.");
    } finally {
      setLoadingChallenge(false);
    }
  };

  const back = () => { setSelected(null); setChallenge(null); setResult(null); };

  const submit = () => {
    if (!selected || !challenge) return;
    setSubmitError(null);
    markMut.mutate(
      { sessionId: selected.id, challengeId: challenge.challengeId, submittedCode: code.trim(), faceImage: face ?? undefined },
      {
        onSuccess: (r) => setResult(r as MarkResult),
        onError: (e) => setSubmitError(e instanceof ApiError ? e.message : "Could not mark attendance."),
      }
    );
  };

  return (
    <>
      <PageHeader
        title="Mark Attendance"
        subtitle="Pick your live session, enter the code, and verify your face."
        icon={Radio}
        crumbs={[{ label: "Student", href: "/student" }, { label: "Mark Attendance" }]}
      />

      {/* RESULT */}
      {result ? (
        <Card className="max-w-xl">
          <div className="text-center py-6">
            <div className={cn("size-16 mx-auto rounded-full grid place-items-center mb-4 ring-4",
              result.status === "PRESENT" || result.status === "VERIFIED"
                ? "bg-brand-50 ring-brand-100/60"
                : result.status === "PENDING_REVIEW" || result.status === "SUSPICIOUS"
                ? "bg-amber-50 ring-amber-100/60" : "bg-rose-50 ring-rose-100/60")}>
              <CheckCircle2 className={cn("size-8",
                result.status === "PRESENT" || result.status === "VERIFIED" ? "text-brand-600"
                  : result.status === "PENDING_REVIEW" || result.status === "SUSPICIOUS" ? "text-amber-600" : "text-rose-600")} />
            </div>
            <Badge tone={result.status === "PRESENT" || result.status === "VERIFIED" ? "success" : "warning"} dot>
              {result.status}
            </Badge>
            <p className="font-display text-[1.8rem] leading-tight text-ink-900 mt-3">
              {result.message || "Attendance recorded."}
            </p>
            <div className="grid grid-cols-3 gap-2 mt-6 max-w-md mx-auto text-left">
              <ResultStat label="Face match" value={result.faceConfidence != null ? `${Math.round(result.faceConfidence * 100)}%` : "—"} />
              <ResultStat label="Risk score" value={`${result.riskScore} / 100`} />
              <ResultStat label="Risk level" value={result.riskLevel ?? "—"} />
            </div>
            <Button variant="secondary" className="mt-6" onClick={back}>Mark another session</Button>
          </div>
        </Card>
      ) : !selected ? (
        /* SESSION PICKER */
        error ? (
          <ErrorBox error={error as Error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <LoadingBox />
        ) : sessions.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Radio className="size-8 text-ink-300 mx-auto mb-2" />
            <p className="font-display text-xl text-ink-700">No live sessions</p>
            <p className="text-sm text-ink-400 mt-1">
              When a teacher starts a session for one of your enrolled courses, it&apos;ll show up here.
            </p>
            <Button variant="secondary" className="mt-4" onClick={() => refetch()}>Refresh</Button>
          </div>
        ) : (
          <div className="grid gap-3 max-w-2xl">
            {sessions.map((s) => (
              <Card key={s.id} className="flex items-center gap-4">
                <div className="size-11 rounded-xl bg-brand-50 text-brand-700 grid place-items-center shrink-0">
                  <Radio className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge tone="live" dot>Live</Badge>
                    <span className="text-[0.7rem] text-ink-400 numeral">{s.sessionCode}</span>
                  </div>
                  <p className="text-[0.95rem] text-ink-900 mt-0.5 truncate">
                    <span className="numeral font-medium">{s.courseCode}</span> — {s.courseName}
                  </p>
                  <p className="text-xs text-ink-400">{s.sectionName}{s.sessionTitle ? ` · ${s.sessionTitle}` : ""}</p>
                </div>
                <Button onClick={() => join(s)}>Join <ArrowRight className="size-4" /></Button>
              </Card>
            ))}
          </div>
        )
      ) : (
        /* MARK FLOW */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 items-start max-w-4xl">
          <Card>
            <button onClick={back} className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-800 mb-3">
              <ArrowLeft className="size-3" /> Back to sessions
            </button>
            <CardHeader
              title={`${selected.courseCode} — ${selected.courseName}`}
              subtitle={`${selected.sectionName} · ${selected.sessionCode}`}
            />

            {loadingChallenge ? (
              <div className="flex items-center gap-2 text-sm text-ink-400 py-6"><Loader2 className="size-4 animate-spin" /> Checking for an open challenge…</div>
            ) : challengeError ? (
              <div className="p-4 rounded-xl bg-amber-50/70 ring-1 ring-amber-200/60 text-sm text-amber-900">
                <AlertCircle className="inline size-4 mr-1" /> {challengeError}
                <div className="mt-3"><Button variant="secondary" size="sm" onClick={() => join(selected)}>Retry</Button></div>
              </div>
            ) : challenge ? (
              <>
                <div className="flex items-center justify-between p-3 rounded-xl bg-ink-50/60 mb-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-500"><Clock className="size-3.5" /> Closes in</span>
                  <span className={cn("font-display text-xl numeral", secondsLeft <= 10 ? "text-rose-600 animate-pulse-soft" : "text-ink-900")}>
                    {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <Input
                  label="Live Code"
                  placeholder="ABCDEF"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={12}
                  className="font-mono text-lg tracking-[0.25em] text-center"
                  autoFocus
                />
                <p className="text-xs text-ink-400 mt-2">Type the code your teacher is displaying.</p>
              </>
            ) : null}
          </Card>

          {challenge ? (
            <Card>
              <CardHeader title="Verify your face" subtitle="Look at the camera and capture a clear photo." />
              <WebcamCapture onCapture={setFace} onClear={() => setFace(null)} captureLabel="Capture face" />

              {submitError ? <div className="mt-3"><Badge tone="danger">{submitError}</Badge></div> : null}

              <Button
                className="w-full mt-4"
                disabled={!code || !face || secondsLeft === 0 || markMut.isPending}
                onClick={submit}
              >
                {markMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {markMut.isPending ? "Verifying…" : secondsLeft === 0 ? "Challenge expired" : "Submit attendance"}
              </Button>
              <div className="mt-3 flex items-center gap-2 text-[0.7rem] text-ink-400">
                <ShieldCheck className="size-3.5" /> Your face is matched against your registered profile.
                <a href="/student/face" className="text-brand-700 hover:underline ml-auto">Set up profile</a>
              </div>
            </Card>
          ) : null}
        </div>
      )}
    </>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-brand-50/60 ring-1 ring-brand-100/60">
      <p className="text-[0.6rem] uppercase tracking-wider text-brand-600">{label}</p>
      <p className="font-medium text-sm text-ink-900 mt-0.5 numeral">{value}</p>
    </div>
  );
}

function LoadingBox() {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <Loader2 className="size-6 text-brand-600 animate-spin mx-auto mb-2" />
      <p className="text-sm text-ink-500">Loading sessions…</p>
    </div>
  );
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
