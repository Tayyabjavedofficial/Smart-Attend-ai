"use client";

import { useState, useEffect } from "react";
import { UserCog, KeyRound, Loader2, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useProfile, useUpdateProfile, useChangePassword } from "@/lib/hooks";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/lib/api";

export function AccountSettings() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const updateUser = useAuthStore((s) => s.updateUser);
  const storeUser = useAuthStore((s) => s.user);

  // --- Profile form ---
  const [fullName, setFullName] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    const name = profile?.fullName ?? storeUser?.fullName;
    if (name) setFullName(name);
  }, [profile?.fullName, storeUser?.fullName]);

  const email = profile?.email ?? storeUser?.email ?? "—";
  const role = profile?.role ?? storeUser?.role ?? "—";
  const status = profile?.status ?? "ACTIVE";
  const profileError = updateProfile.error as ApiError | undefined;

  const saveProfile = () => {
    setProfileSaved(false);
    updateProfile.mutate(fullName.trim(), {
      onSuccess: (p) => {
        updateUser({ fullName: p.fullName });
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 2500);
      },
    });
  };

  // --- Password form ---
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);

  const savePassword = () => {
    setPwError(null);
    if (next.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (next !== confirm) { setPwError("New passwords do not match."); return; }
    changePassword.mutate(
      { currentPassword: cur, newPassword: next },
      {
        onSuccess: () => {
          setPwSaved(true);
          setCur(""); setNext(""); setConfirm("");
          setTimeout(() => setPwSaved(false), 3000);
        },
        onError: (e) => setPwError(e instanceof ApiError ? e.message : "Could not change password"),
      }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <section className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCog className="size-4 text-brand-600" />
          <h2 className="font-display text-lg text-ink-900">Profile</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide">Email</label>
                <div className="h-11 px-3.5 rounded-xl bg-ink-50/60 border border-ink-200/50 flex items-center gap-2 text-sm text-ink-500">
                  <Mail className="size-3.5" /> {email}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide">Role</label>
                <div className="h-11 px-3.5 rounded-xl bg-ink-50/60 border border-ink-200/50 flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-ink-400" />
                  <Badge tone={status === "ACTIVE" ? "success" : "neutral"}>{role}</Badge>
                </div>
              </div>
            </div>

            <p className="text-xs text-ink-400">
              Email and role can&apos;t be changed here — contact an administrator if they&apos;re wrong.
            </p>

            {profileError ? <Badge tone="danger">{profileError.message}</Badge> : null}

            <div className="flex items-center gap-3">
              <Button onClick={saveProfile} disabled={updateProfile.isPending || !fullName.trim()}>
                {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Save profile
              </Button>
              {profileSaved ? (
                <span className="inline-flex items-center gap-1 text-sm text-brand-700">
                  <CheckCircle2 className="size-4" /> Saved
                </span>
              ) : null}
            </div>
          </div>
        )}
      </section>

      {/* Password */}
      <section className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="size-4 text-brand-600" />
          <h2 className="font-display text-lg text-ink-900">Change Password</h2>
        </div>

        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={cur}
            onChange={(e) => setCur(e.target.value)}
            autoComplete="current-password"
            placeholder="Your current password"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="New Password"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            <Input
              label="Confirm New"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="Re-enter new password"
              error={pwError ?? undefined}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={savePassword}
              disabled={changePassword.isPending || !cur || !next || !confirm}
            >
              {changePassword.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Update password
            </Button>
            {pwSaved ? (
              <span className="inline-flex items-center gap-1 text-sm text-brand-700">
                <CheckCircle2 className="size-4" /> Password changed
              </span>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
