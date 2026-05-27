"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/icons/Logo";
import { api, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.auth.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Marketing side */}
      <section className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900" />
        <Logo variant="mark" className="size-14 drop-shadow-2xl" />
        <div className="max-w-md text-white">
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/50 mb-3">
            Password recovery
          </p>
          <h2 className="font-display text-[2.5rem] leading-[1.1] tracking-tight">
            Locked out? <em className="text-brand-200">No problem.</em>
          </h2>
          <p className="mt-4 text-white/70 text-sm leading-relaxed">
            Enter the email tied to your account and we&apos;ll send you a secure link
            to choose a new password. The link expires in 30 minutes.
          </p>
        </div>
        <p className="text-[0.7rem] text-white/40 tracking-wide">
          © {new Date().getFullYear()} AttendAI
        </p>
      </section>

      {/* Form side */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6">
            <Logo variant="wordmark" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-50 text-brand-700 text-[0.7rem] font-medium ring-1 ring-brand-200/60 mb-4">
            <ShieldCheck className="size-3" />
            Secure reset
          </span>

          <h1 className="font-display text-[2.5rem] leading-[1.05] tracking-tight text-ink-900">
            Forgot password?
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Enter your account email and we&apos;ll send a reset link.
          </p>

          {sent ? (
            <div className="mt-8 p-5 rounded-2xl bg-brand-50/60 ring-1 ring-brand-200/50">
              <div className="flex items-center gap-2 text-brand-800 font-medium">
                <Mail className="size-4" />
                Check your inbox
              </div>
              <p className="mt-2 text-sm text-ink-600 leading-relaxed">
                If <span className="font-mono text-ink-800">{email}</span> is registered,
                you&apos;ll receive a reset link shortly. The link is valid for 30 minutes.
              </p>
              <p className="mt-3 text-xs text-ink-400">
                Don&apos;t see it? Check your spam folder.
              </p>
            </div>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={submit}>
              <Input
                label="Institution Email"
                type="email"
                placeholder="you@institution.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                error={error ?? undefined}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-800"
            >
              <ArrowLeft className="size-3" />
              Back to sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
