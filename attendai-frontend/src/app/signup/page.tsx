"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, CheckCircle2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/icons/Logo";
import { api, ApiError } from "@/lib/api";

export default function SignupPage() {
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirm: "",
    registrationNumber: "", department: "", semester: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.fullName.trim().length < 2) return setError("Please enter your full name.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (form.password !== form.confirm) return setError("Passwords don't match.");
    if (!form.registrationNumber.trim()) return setError("Your registration number is required.");
    setLoading(true);
    try {
      await api.auth.register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        registrationNumber: form.registrationNumber.trim(),
        department: form.department.trim() || undefined,
        semester: form.semester ? Number(form.semester) : undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create your account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Marketing side */}
      <section className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900" />
        <svg className="absolute -bottom-24 -left-24 size-[480px] opacity-[0.07] -z-10" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="98" stroke="white" strokeWidth="0.5" fill="none" />
          <circle cx="100" cy="100" r="72" stroke="white" strokeWidth="0.5" fill="none" />
          <circle cx="100" cy="100" r="46" stroke="white" strokeWidth="0.5" fill="none" />
        </svg>
        <Logo variant="mark" className="size-14 drop-shadow-2xl" />
        <div className="max-w-md text-white">
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/50 mb-3">For students</p>
          <h2 className="font-display text-[2.5rem] leading-[1.1] tracking-tight">
            Join your campus on <em className="text-brand-200">AttendAI</em>.
          </h2>
          <p className="mt-4 text-white/70 text-sm leading-relaxed balance">
            Create your account in a minute. Once an administrator approves it, you can register your face,
            enroll in classes, and mark attendance from any device.
          </p>
          <ol className="mt-8 space-y-3 text-sm text-white/80">
            {["Sign up with your details", "An admin reviews & approves", "Sign in and start marking"].map((s, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="size-6 rounded-full bg-white/10 ring-1 ring-white/20 grid place-items-center text-[0.7rem] font-semibold">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <p className="text-[0.7rem] text-white/40 tracking-wide">© {new Date().getFullYear()} AttendAI</p>
      </section>

      {/* Form side */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6"><Logo variant="wordmark" /></div>

          {done ? (
            <div className="text-center animate-scale-in">
              <div className="size-16 rounded-2xl bg-brand-50 text-brand-600 grid place-items-center mx-auto mb-4">
                <CheckCircle2 className="size-8" />
              </div>
              <h1 className="font-display text-[2.25rem] leading-tight text-ink-900">Account created!</h1>
              <p className="mt-3 text-sm text-ink-500 max-w-sm mx-auto balance">
                Your registration is now <strong className="text-ink-700">pending approval</strong>. An administrator
                will review it shortly — once approved, you can sign in and access your portal.
              </p>
              <Link href="/login"><Button className="mt-6 w-full">Back to sign in <ArrowRight className="size-4" /></Button></Link>
            </div>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-50 text-brand-700 text-[0.7rem] font-medium ring-1 ring-brand-200/60 mb-4">
                <GraduationCap className="size-3" /> Student registration
              </span>
              <h1 className="font-display text-[2.5rem] leading-[1.05] tracking-tight text-ink-900">Create your account</h1>
              <p className="mt-2 text-sm text-ink-500">Fill in your details. An admin will approve your access.</p>

              <form className="mt-7 space-y-4" onSubmit={submit}>
                <Input label="Full name" placeholder="e.g. Aarav Sharma" value={form.fullName} onChange={set("fullName")} required autoComplete="name" />
                <Input label="Email" type="email" placeholder="you@institution.edu" value={form.email} onChange={set("email")} required autoComplete="email" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Registration no." placeholder="S2021001" value={form.registrationNumber} onChange={set("registrationNumber")} required />
                  <Input label="Semester" type="number" min={1} max={12} placeholder="7" value={form.semester} onChange={set("semester")} />
                </div>
                <Input label="Department" placeholder="Computer Science (optional)" value={form.department} onChange={set("department")} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Password" type="password" placeholder="Min 8 characters" value={form.password} onChange={set("password")} required autoComplete="new-password" />
                  <Input label="Confirm" type="password" placeholder="Repeat password" value={form.confirm} onChange={set("confirm")} required autoComplete="new-password" />
                </div>

                {error ? <p className="text-sm text-accent-rose">{error}</p> : null}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account…" : (<><span>Create account</span><ArrowRight className="size-4" /></>)}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-ink-500">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-brand-700 hover:text-brand-800 hover:underline">Sign in</Link>
              </p>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.7rem] text-ink-400">
                <ShieldCheck className="size-3" /> Your details are encrypted and reviewed before access is granted.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
