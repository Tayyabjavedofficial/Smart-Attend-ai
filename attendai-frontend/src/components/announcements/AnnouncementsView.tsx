"use client";

import { useState } from "react";
import {
  Megaphone, Pin, Trash2, Plus, Users, GraduationCap, Globe, AlertCircle, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from "@/lib/hooks";
import { useAuthStore } from "@/store/authStore";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Announcement, AnnouncementAudience, Role } from "@/types/api";

const audienceMeta: Record<AnnouncementAudience, { label: string; icon: typeof Globe; tone: "info" | "success" | "warning" }> = {
  ALL: { label: "Everyone", icon: Globe, tone: "info" },
  STUDENTS: { label: "Students", icon: Users, tone: "success" },
  TEACHERS: { label: "Teachers", icon: GraduationCap, tone: "warning" },
};

export function AnnouncementsView({ role }: { role: Role }) {
  const base = `/${role.toLowerCase()}`;
  const canPost = role !== "STUDENT";
  const user = useAuthStore((s) => s.user);

  const { data: items = [], isLoading, error } = useAnnouncements();
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle={canPost ? "Post notices and keep your campus in the loop." : "Notices from your teachers and administration."}
        icon={Megaphone}
        crumbs={[{ label: role.charAt(0) + role.slice(1).toLowerCase(), href: base }, { label: "Announcements" }]}
        action={canPost ? <Button onClick={() => setComposeOpen(true)}><Plus className="size-4" /> New announcement</Button> : undefined}
      />

      {error ? (
        <Card className="text-center py-10">
          <AlertCircle className="size-7 text-accent-rose mx-auto mb-2" />
          <p className="font-display text-xl text-ink-900">Couldn&apos;t load announcements</p>
          <p className="text-sm text-ink-500 mt-1">{(error as Error).message}</p>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-5 h-36 animate-pulse-soft" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-14">
          <div className="size-14 rounded-2xl bg-brand-50 text-brand-600 grid place-items-center mx-auto mb-3 animate-float">
            <Megaphone className="size-6" />
          </div>
          <p className="font-display text-2xl text-ink-900">No announcements yet</p>
          <p className="text-sm text-ink-500 mt-1 max-w-sm mx-auto">
            {canPost ? "Be the first to post — students and faculty will see it instantly." : "When your teachers or admin post a notice, it will show up here."}
          </p>
          {canPost ? <Button className="mt-4" onClick={() => setComposeOpen(true)}><Plus className="size-4" /> New announcement</Button> : null}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 stagger">
          {items.map((a) => (
            <AnnouncementCard
              key={a.id}
              item={a}
              canDelete={role === "ADMIN" || a.authorId === user?.id}
            />
          ))}
        </div>
      )}

      {canPost ? (
        <ComposeModal role={role} open={composeOpen} onClose={() => setComposeOpen(false)} />
      ) : null}
    </>
  );
}

function AnnouncementCard({ item, canDelete }: { item: Announcement; canDelete: boolean }) {
  const del = useDeleteAnnouncement();
  const meta = audienceMeta[item.audience];
  const AudIcon = meta.icon;

  return (
    <Card className={cn("flex flex-col hover-lift", item.pinned && "ring-2 ring-brand-300/60")}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {item.pinned ? (
            <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded-md shrink-0">
              <Pin className="size-3" /> Pinned
            </span>
          ) : null}
          <Badge tone={meta.tone}><AudIcon className="size-3" /> {meta.label}</Badge>
        </div>
        {canDelete ? (
          <button
            type="button"
            onClick={() => { if (window.confirm("Delete this announcement?")) del.mutate(item.id); }}
            disabled={del.isPending}
            className="size-7 grid place-items-center rounded-lg text-ink-300 hover:text-accent-rose hover:bg-rose-50 transition-colors shrink-0"
            aria-label="Delete announcement"
          >
            {del.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </button>
        ) : null}
      </div>

      <h3 className="font-display text-[1.35rem] leading-tight text-ink-900 balance">{item.title}</h3>
      <p className="text-sm text-ink-600 mt-1.5 whitespace-pre-line flex-1">{item.body}</p>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ink-100/80">
        <div className="size-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white grid place-items-center text-[0.6rem] font-semibold shrink-0">
          {item.authorName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </div>
        <span className="text-[0.72rem] text-ink-500 truncate">{item.authorName}</span>
        <span className="text-ink-300">·</span>
        <span className="text-[0.72rem] text-ink-400 numeral whitespace-nowrap">{timeAgo(item.createdAt)}</span>
      </div>
    </Card>
  );
}

function ComposeModal({ role, open, onClose }: { role: Role; open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("ALL");
  const [pinned, setPinned] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const create = useCreateAnnouncement({
    onSuccess: () => { reset(); onClose(); },
    onError: (e) => setErr(e.message),
  });

  // Teachers can target everyone or students; only admins broadcast to faculty.
  const audiences: AnnouncementAudience[] = role === "ADMIN" ? ["ALL", "STUDENTS", "TEACHERS"] : ["ALL", "STUDENTS"];

  function reset() {
    setTitle(""); setBody(""); setAudience("ALL"); setPinned(false); setErr(null);
  }

  function submit() {
    setErr(null);
    if (title.trim().length < 3) { setErr("Give your announcement a title."); return; }
    if (body.trim().length < 3) { setErr("Write a short message."); return; }
    create.mutate({ title: title.trim(), body: body.trim(), audience, pinned });
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="New announcement"
      description="It will appear instantly for everyone in the selected audience."
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
            Post
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Title" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Class rescheduled to 2 PM" />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={8000}
            placeholder="Share the details…"
            className="block w-full px-3.5 py-3 rounded-xl bg-white/70 border border-ink-200/60 text-sm text-ink-900 placeholder:text-ink-300 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide">Audience</label>
          <div className="flex flex-wrap gap-2">
            {audiences.map((a) => {
              const m = audienceMeta[a];
              const Icon = m.icon;
              const active = audience === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAudience(a)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm transition-all border",
                    active ? "bg-brand-600 text-white border-brand-600 shadow-glass" : "bg-white/60 text-ink-600 border-ink-200/60 hover:bg-white"
                  )}
                >
                  <Icon className="size-3.5" /> {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <button
            type="button"
            role="switch"
            aria-checked={pinned}
            onClick={() => setPinned((p) => !p)}
            className={cn("relative h-6 w-10 rounded-full transition-colors shrink-0", pinned ? "bg-brand-600" : "bg-ink-200")}
          >
            <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", pinned ? "left-[1.125rem]" : "left-0.5")} />
          </button>
          <span className="text-sm text-ink-700 inline-flex items-center gap-1.5"><Pin className="size-3.5 text-brand-600" /> Pin to top of the feed</span>
        </label>

        {err ? <p className="text-sm text-accent-rose flex items-center gap-1.5"><AlertCircle className="size-4" /> {err}</p> : null}
      </div>
    </Modal>
  );
}
