"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/icons/Logo";
import { api, isMock, MOCK_HINTS, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.login(email, password);
      setSession({
        user: res.user,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      router.replace(`/${res.user.role.toLowerCase()}`);
    } catch (err) {
      let msg = err instanceof ApiError ? err.message : "Could not sign in";
      // Friendlier copy for a self-registered account still awaiting approval.
      if (err instanceof ApiError && err.code === "AUTH_004" && /pending/i.test(err.message)) {
        msg = "Your account is awaiting admin approval. You'll be able to sign in once it's approved.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillHint = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Marketing side - left */}
      <section className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900" />
        {/* Decorative geometry */}
        <svg className="absolute -top-20 -right-20 size-[480px] opacity-[0.07] -z-10" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="98" stroke="white" strokeWidth="0.5" fill="none" />
          <circle cx="100" cy="100" r="72" stroke="white" strokeWidth="0.5" fill="none" />
          <circle cx="100" cy="100" r="46" stroke="white" strokeWidth="0.5" fill="none" />
          <circle cx="100" cy="100" r="22" stroke="white" strokeWidth="0.5" fill="none" />
        </svg>

        <Logo variant="mark" className="size-14 drop-shadow-2xl" />

        <div className="max-w-md text-white">
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/50 mb-3">
            Anti-proxy · Face verified · Device trusted
          </p>
          <h2 className="font-display text-[2.5rem] leading-[1.1] tracking-tight">
            Attendance, <em className="text-brand-200">verified</em> the moment it happens.
          </h2>
          <p className="mt-4 text-white/70 text-sm leading-relaxed balance">
            Live challenge codes that expire in seconds, on-the-fly face verification, and a risk model that catches proxy patterns
            before they become a habit.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { value: "92.6%", label: "Avg attendance" },
              { value: "<3s", label: "Mark + verify" },
              { value: "0", label: "Manual rolls" },
            ].map((s) => (
              <div key={s.label} className="border-l border-white/10 pl-3">
                <p className="font-display text-[1.6rem] text-white numeral">{s.value}</p>
                <p className="text-[0.7rem] text-white/50 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[0.7rem] text-white/40 tracking-wide">
          © {new Date().getFullYear()} AttendAI · Built for institutions that care about integrity
        </p>
      </section>

      {/* Form side - right */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6">
            <Logo variant="wordmark" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-50 text-brand-700 text-[0.7rem] font-medium ring-1 ring-brand-200/60 mb-4">
            <ShieldCheck className="size-3" />
            Encrypted · Role-based
          </span>

          <h1 className="font-display text-[2.5rem] leading-[1.05] tracking-tight text-ink-900">
            Welcome back.
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Sign in to access your dashboard.
          </p>

          <form className="mt-8 space-y-4" onSubmit={submit}>
            <Input
              label="Institution Email"
              type="email"
              placeholder="you@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              error={error ?? undefined}
            />

            <div className="flex justify-end -mt-1">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-brand-700 hover:text-brand-800 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : (<><span>Sign in</span><ArrowRight className="size-4" /></>)}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            New student?{" "}
            <Link href="/signup" className="font-medium text-brand-700 hover:text-brand-800 hover:underline">
              Create an account
            </Link>
          </p>

          {isMock ? (
            <div className="mt-8 p-4 rounded-2xl bg-amber-50/60 ring-1 ring-amber-200/50">
              <p className="text-[0.7rem] uppercase tracking-wider font-medium text-amber-800 mb-2">
                Demo Mode · No backend required
              </p>
              <div className="space-y-1.5">
                {MOCK_HINTS.map((h) => (
                  <button
                    key={h.email}
                    type="button"
                    onClick={() => fillHint(h.email, h.password)}
                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-100/50 transition-colors group"
                  >
                    <span className="inline-flex items-center justify-center w-14 text-[0.65rem] font-semibold text-amber-700 bg-amber-100 rounded">
                      {h.role}
                    </span>
                    <span className="font-mono text-xs text-ink-600 truncate flex-1">{h.email}</span>
                    <KeyRound className="size-3 text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
