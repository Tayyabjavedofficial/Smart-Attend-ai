"use client";

import { useState, useEffect } from "react";
import {
  Radio, ScanFace, QrCode, Hash, ShieldCheck, CheckCircle2,
  ArrowRight, Sparkles, AlertCircle, Camera, Clock,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type Step = "idle" | "code" | "face" | "submitting" | "done";

export default function MarkAttendancePage() {
  const [step, setStep] = useState<Step>("idle");
  const [secondsLeft, setSecondsLeft] = useState(42);
  const [code, setCode] = useState("");
  const [faceCaptured, setFaceCaptured] = useState(false);

  // Countdown timer for the active session
  useEffect(() => {
    if (step === "done") return;
    const id = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [step]);

  const submit = () => {
    setStep("submitting");
    setTimeout(() => setStep("done"), 1400);
  };

  const reset = () => {
    setStep("idle");
    setCode("");
    setFaceCaptured(false);
    setSecondsLeft(42);
  };

  return (
    <>
      <PageHeader
        title="Mark Attendance"
        subtitle="Complete the verification flow before the timer expires."
        icon={Radio}
        crumbs={[{ label: "Student", href: "/student" }, { label: "Mark Attendance" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 items-start">
        {/* Active session + step flow */}
        <div className="space-y-4">
          {/* Active session banner */}
          <Card className="relative overflow-hidden p-0">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800" />
            <svg className="absolute -right-12 -top-12 size-72 opacity-10" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="98" stroke="white" strokeWidth="0.5" />
              <circle cx="100" cy="100" r="72" stroke="white" strokeWidth="0.5" />
              <circle cx="100" cy="100" r="46" stroke="white" strokeWidth="0.5" />
            </svg>
            <div className="relative p-5 text-white flex items-center gap-5">
              <div className="size-12 rounded-xl bg-white/12 ring-1 ring-white/20 grid place-items-center shrink-0">
                <Radio className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <Badge tone="live" dot>Live now</Badge>
                <h2 className="font-display text-[1.6rem] leading-tight tracking-tight mt-1">
                  CS201 — Artificial Intelligence
                </h2>
                <p className="text-white/70 text-xs">Dr. Sarah Johnson · Section BCS-7A · Started 10:15 AM</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[0.6rem] uppercase tracking-wider text-white/45">Expires in</p>
                <p className={cn(
                  "font-display text-[2rem] leading-none numeral mt-0.5",
                  secondsLeft <= 10 ? "text-rose-200 animate-pulse-soft" : "text-white"
                )}>
                  00:{secondsLeft.toString().padStart(2, "0")}
                </p>
              </div>
            </div>
          </Card>

          {/* Step indicator */}
          <div className="flex items-center gap-2 px-1">
            {[
              { n: 1, label: "Enter code", active: step === "code" || step === "face" || step === "submitting" || step === "done" || step === "idle" },
              { n: 2, label: "Verify face", active: step === "face" || step === "submitting" || step === "done" },
              { n: 3, label: "Submit", active: step === "submitting" || step === "done" },
            ].map((s, i, arr) => (
              <div key={s.n} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "size-7 rounded-full grid place-items-center text-xs font-semibold transition-all",
                  s.active ? "bg-brand-600 text-white" : "bg-ink-200/60 text-ink-400"
                )}>
                  {s.n}
                </div>
                <span className={cn("text-xs flex-1", s.active ? "text-ink-900 font-medium" : "text-ink-400")}>
                  {s.label}
                </span>
                {i < arr.length - 1 ? (
                  <div className={cn(
                    "h-0.5 flex-1 rounded-full transition-all",
                    s.active && arr[i + 1].active ? "bg-brand-500" : "bg-ink-200/60"
                  )} />
                ) : null}
              </div>
            ))}
          </div>

          {/* Step content */}
          {step !== "done" ? (
            <Card>
              {step === "idle" || step === "code" ? (
                <>
                  <CardHeader
                    title="Step 1 · Enter the live code"
                    subtitle="Your teacher reveals a 6-character code at the start of the challenge."
                  />
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Input
                        label="Live Code"
                        placeholder="ABCDEF"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="font-mono text-lg tracking-[0.3em] text-center numeral"
                        autoFocus
                      />
                    </div>
                    <span className="text-ink-300 mb-3">or</span>
                    <Button variant="secondary" className="mb-0.5">
                      <QrCode className="size-4" />
                      Scan QR
                    </Button>
                  </div>
                  <Button
                    className="w-full mt-4"
                    disabled={code.length !== 6}
                    onClick={() => setStep("face")}
                  >
                    Continue to face verification
                    <ArrowRight className="size-4" />
                  </Button>
                </>
              ) : null}

              {step === "face" ? (
                <>
                  <CardHeader
                    title="Step 2 · Face verification"
                    subtitle="A quick scan against your registered face profile."
                  />
                  <div className="relative">
                    <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-ink-900 via-brand-900 to-brand-800 grid place-items-center relative overflow-hidden">
                      {/* Scanning overlay */}
                      <svg className="absolute inset-0 size-full opacity-20" viewBox="0 0 400 300" fill="none">
                        <circle cx="200" cy="150" r="120" stroke="white" strokeWidth="0.5" strokeDasharray="2 4" />
                        <circle cx="200" cy="150" r="90" stroke="white" strokeWidth="0.5" />
                        <circle cx="200" cy="150" r="60" stroke="white" strokeWidth="0.5" />
                      </svg>
                      <div className="relative text-center">
                        <div className="size-28 mx-auto rounded-full bg-white/8 ring-2 ring-white/15 grid place-items-center mb-3">
                          {faceCaptured
                            ? <CheckCircle2 className="size-10 text-brand-300" />
                            : <ScanFace className="size-10 text-white/60" />}
                        </div>
                        <p className="text-white/70 text-xs">
                          {faceCaptured
                            ? "Face captured · 94.2% confidence"
                            : "Look directly at your camera"}
                        </p>
                      </div>

                      {/* Decorative scan lines */}
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/40 to-transparent animate-pulse-soft" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {!faceCaptured ? (
                      <>
                        <Button variant="secondary" onClick={() => setStep("code")}>
                          Back
                        </Button>
                        <Button onClick={() => setFaceCaptured(true)}>
                          <Camera className="size-4" />
                          Capture
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="secondary" onClick={() => setFaceCaptured(false)}>
                          Retake
                        </Button>
                        <Button onClick={submit}>
                          Submit attendance
                          <ArrowRight className="size-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </>
              ) : null}

              {step === "submitting" ? (
                <div className="text-center py-12">
                  <div className="size-16 mx-auto rounded-full bg-brand-50 grid place-items-center mb-4">
                    <Sparkles className="size-7 text-brand-600 animate-pulse-soft" />
                  </div>
                  <p className="font-display text-xl text-ink-900">Verifying…</p>
                  <p className="text-sm text-ink-500 mt-1">Running face match and AI risk analysis</p>
                </div>
              ) : null}
            </Card>
          ) : (
            <Card>
              <div className="text-center py-6">
                <div className="size-16 mx-auto rounded-full bg-brand-50 grid place-items-center mb-4 ring-4 ring-brand-100/60">
                  <CheckCircle2 className="size-8 text-brand-600" />
                </div>
                <Badge tone="success" dot>Attendance marked</Badge>
                <p className="font-display text-[1.8rem] leading-tight text-ink-900 mt-3">
                  You're marked present.
                </p>
                <p className="text-sm text-ink-500 mt-1">CS201 · {new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</p>

                <div className="grid grid-cols-3 gap-2 mt-6 max-w-md mx-auto text-left">
                  <ResultStat label="Face match" value="94.2%" tone="brand" />
                  <ResultStat label="Risk score" value="12 / 100" tone="brand" />
                  <ResultStat label="Status" value="Verified" tone="brand" />
                </div>

                <Button variant="secondary" className="mt-6" onClick={reset}>
                  Mark another session
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right column - help + status */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Verification checklist" subtitle="What we're checking before marking you present." />
            <ul className="space-y-2.5 text-sm">
              {[
                { icon: Hash, label: "Live code matches", done: code.length === 6 },
                { icon: ScanFace, label: "Face matches your profile", done: faceCaptured },
                { icon: ShieldCheck, label: "Device is trusted", done: true },
                { icon: Sparkles, label: "AI risk score is low", done: step === "done" },
              ].map((c, i) => {
                const Icon = c.icon;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <div className={cn(
                      "size-7 rounded-lg grid place-items-center shrink-0",
                      c.done ? "bg-brand-50 text-brand-700" : "bg-ink-100 text-ink-400"
                    )}>
                      <Icon className="size-3.5" />
                    </div>
                    <span className={cn("text-[0.82rem]", c.done ? "text-ink-900" : "text-ink-500")}>{c.label}</span>
                    {c.done ? <CheckCircle2 className="size-4 text-brand-600 ml-auto" /> : null}
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Troubleshooting" />
            <ul className="space-y-3 text-xs text-ink-500">
              <li className="flex items-start gap-2.5">
                <AlertCircle className="size-3.5 text-accent-amber mt-0.5 shrink-0" />
                <p>Camera not working? Allow access in your browser's site permissions and reload.</p>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="size-3.5 text-accent-amber mt-0.5 shrink-0" />
                <p>Missed the window? Submit a correction request and your teacher will review.</p>
              </li>
              <li className="flex items-start gap-2.5">
                <ScanFace className="size-3.5 text-brand-600 mt-0.5 shrink-0" />
                <p>Face not matching? Re-register your profile in <strong>Face Profile</strong>.</p>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

function ResultStat({ label, value, tone = "brand" }: { label: string; value: string; tone?: "brand" | "neutral" }) {
  return (
    <div className="p-2.5 rounded-xl bg-brand-50/60 ring-1 ring-brand-100/60">
      <p className="text-[0.6rem] uppercase tracking-wider text-brand-600">{label}</p>
      <p className="font-medium text-sm text-ink-900 mt-0.5 numeral">{value}</p>
    </div>
  );
}
