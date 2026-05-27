"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/icons/Logo";
import { api, ApiError } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Missing reset token. Use the link from your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.auth.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.replace("/login"), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mt-8 p-5 rounded-2xl bg-brand-50/60 ring-1 ring-brand-200/50">
        <div className="flex items-center gap-2 text-brand-800 font-medium">
          <CheckCircle2 className="size-4" />
          Password updated
        </div>
        <p className="mt-2 text-sm text-ink-600">
          Redirecting you to sign in…
        </p>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={submit}>
      <Input
        label="New Password"
        type="password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
      />
      <Input
        label="Confirm New Password"
        type="password"
        placeholder="Re-enter the same password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        autoComplete="new-password"
        error={error ?? undefined}
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Updating…" : (<><span>Update password</span><ArrowRight className="size-4" /></>)}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900" />
        <Logo variant="mark" className="size-14 drop-shadow-2xl" />
        <div className="max-w-md text-white">
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/50 mb-3">
            Set a new password
          </p>
          <h2 className="font-display text-[2.5rem] leading-[1.1] tracking-tight">
            Choose something <em className="text-brand-200">strong.</em>
          </h2>
          <p className="mt-4 text-white/70 text-sm leading-relaxed">
            Use at least 8 characters. A passphrase made of unrelated words is
            both easier to remember and harder to guess than a short complex
            password.
          </p>
        </div>
        <p className="text-[0.7rem] text-white/40 tracking-wide">
          © {new Date().getFullYear()} AttendAI
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6">
            <Logo variant="wordmark" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-50 text-brand-700 text-[0.7rem] font-medium ring-1 ring-brand-200/60 mb-4">
            <ShieldCheck className="size-3" />
            One-time link
          </span>

          <h1 className="font-display text-[2.5rem] leading-[1.05] tracking-tight text-ink-900">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Pick a new password for your account.
          </p>

          <Suspense fallback={<div className="mt-8 text-sm text-ink-400">Loading…</div>}>
            <ResetPasswordForm />
          </Suspense>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-xs font-medium text-ink-500 hover:text-ink-800">
              Back to sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
