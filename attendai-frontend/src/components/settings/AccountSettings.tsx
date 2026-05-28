"use client";

import { useState, useEffect, useRef } from "react";
import { UserCog, KeyRound, Loader2, CheckCircle2, Mail, ShieldCheck, Camera } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useProfile, useUpdateProfile, useChangePassword } from "@/lib/hooks";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/lib/api";

/** Resize + JPEG-compress an image file to a small base64 data URL. */
async function fileToCompressedDataUrl(file: File, maxSize = 256, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export function AccountSettings() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const updateUser = useAuthStore((s) => s.updateUser);
  const storeUser = useAuthStore((s) => s.user);

  // --- Profile form ---
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);   // preview / new upload
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName ?? "");
    setBio(profile.bio ?? "");
    setAvatar(profile.avatar ?? null);
  }, [profile]);

  const displayName = fullName || profile?.fullName || storeUser?.fullName || "";
  const email = profile?.email ?? storeUser?.email ?? "—";
  const role = profile?.role ?? storeUser?.role ?? "—";
  const status = profile?.status ?? "ACTIVE";
  const profileError = updateProfile.error as ApiError | undefined;

  // Read-only role-specific details.
  const details: { label: string; value: string }[] = [];
  if (profile?.role === "STUDENT") {
    if (profile.registrationNumber) details.push({ label: "Registration No.", value: profile.registrationNumber });
    if (profile.department) details.push({ label: "Department", value: profile.department });
    if (profile.semester != null) details.push({ label: "Semester", value: String(profile.semester) });
    if (profile.section) details.push({ label: "Section", value: profile.section });
  } else if (profile?.role === "TEACHER") {
    if (profile.employeeId) details.push({ label: "Employee ID", value: profile.employeeId });
    if (profile.designation) details.push({ label: "Designation", value: profile.designation });
    if (profile.department) details.push({ label: "Department", value: profile.department });
  }

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPhotoError("Please choose an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setPhotoError("Image is too large (max 10MB)."); return; }
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setAvatar(dataUrl);
    } catch {
      setPhotoError("Could not process that image.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveProfile = () => {
    setProfileSaved(false);
    updateProfile.mutate(
      { fullName: fullName.trim(), bio: bio.trim(), avatar: avatar ?? undefined },
      {
        onSuccess: (p) => {
          updateUser({ fullName: p.fullName });
          setProfileSaved(true);
          setTimeout(() => setProfileSaved(false), 2500);
        },
      }
    );
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
        <div className="flex items-center gap-2 mb-5">
          <UserCog className="size-4 text-brand-600" />
          <h2 className="font-display text-lg text-ink-900">Profile</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="Avatar" className="size-20 rounded-full object-cover ring-2 ring-white shadow" />
                ) : (
                  <div className="size-20 rounded-full bg-gradient-to-br from-brand-300 to-brand-600 text-white grid place-items-center font-display text-2xl">
                    {initials(displayName || "U")}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 size-7 rounded-full bg-brand-600 text-white grid place-items-center shadow ring-2 ring-white hover:bg-brand-700 transition-colors"
                  aria-label="Upload photo"
                >
                  <Camera className="size-3.5" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
              </div>
              <div className="text-sm">
                <p className="text-ink-700 font-medium">{displayName}</p>
                <p className="text-ink-400 text-xs">Click the camera to change your photo. It&apos;s resized automatically.</p>
                {photoError ? <p className="text-accent-rose text-xs mt-1">{photoError}</p> : null}
              </div>
            </div>

            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="A short bio about yourself…"
                className="block w-full px-3.5 py-2.5 rounded-xl bg-white/70 border border-ink-200/60 text-sm text-ink-900 placeholder:text-ink-300 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-y"
              />
              <p className="text-[0.7rem] text-ink-400 text-right">{bio.length}/2000</p>
            </div>

            {/* Read-only identity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide">Email</label>
                <div className="h-11 px-3.5 rounded-xl bg-ink-50/60 border border-ink-200/50 flex items-center gap-2 text-sm text-ink-500 truncate">
                  <Mail className="size-3.5 shrink-0" /> <span className="truncate">{email}</span>
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

            {/* Role-specific details */}
            {details.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {details.map((d) => (
                  <div key={d.label} className="space-y-1.5">
                    <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide">{d.label}</label>
                    <div className="h-11 px-3.5 rounded-xl bg-ink-50/60 border border-ink-200/50 flex items-center text-sm text-ink-700 truncate">
                      {d.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <p className="text-xs text-ink-400">
              Email, role, and academic details are managed by an administrator.
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
          <Input label="Current Password" type="password" value={cur}
            onChange={(e) => setCur(e.target.value)} autoComplete="current-password"
            placeholder="Your current password" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="New Password" type="password" value={next}
              onChange={(e) => setNext(e.target.value)} autoComplete="new-password"
              placeholder="At least 8 characters" />
            <Input label="Confirm New" type="password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password"
              placeholder="Re-enter new password" error={pwError ?? undefined} />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={savePassword} disabled={changePassword.isPending || !cur || !next || !confirm}>
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
