"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, Send, ArrowRight, Bot } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import {
  useMyCourses, usePercentage, useActiveSessions, useAnnouncements,
  useTeacherSessions, useTeacherAlerts, useTeacherAnalytics,
  useAdminDashboard, useProxyAlerts,
} from "@/lib/hooks";
import type { PercentageResult } from "@/lib/api";
import type { Role } from "@/types/api";
import { runAssistant, type AssistantContext, type AssistantReply } from "./engine";
import { cn } from "@/lib/cn";

export function AssistantWidget({ role }: { role: Role }) {
  if (role === "STUDENT") return <StudentAssistant />;
  if (role === "TEACHER") return <TeacherAssistant />;
  return <AdminAssistant />;
}

// ---- Role context wrappers (each calls only its own role's hooks) ----

function StudentAssistant() {
  const user = useAuthStore((s) => s.user);
  const { data: courses = [] } = useMyCourses();
  const { data: pct } = usePercentage();
  const { data: live = [] } = useActiveSessions();
  const { data: anns = [] } = useAnnouncements();
  const p = pct as PercentageResult | undefined;

  const ctx: AssistantContext = {
    role: "STUDENT",
    userName: user?.fullName ?? "Student",
    data: {
      overall: p?.overall ?? null,
      perCourse: p?.perCourse?.map((c) => ({ code: c.courseCode, name: c.courseName, pct: c.percentage })) ?? [],
      courses: courses.map((c) => ({ code: c.courseCode, name: c.courseName, section: c.sectionName })),
      live: live.map((s) => ({ code: s.courseCode, name: s.courseName })),
      announcements: anns.map((a) => ({ title: a.title, author: a.authorName })),
    },
  };
  return <AssistantPanel ctx={ctx} />;
}

function TeacherAssistant() {
  const user = useAuthStore((s) => s.user);
  const { data: analytics } = useTeacherAnalytics();
  const { data: sessions = [] } = useTeacherSessions();
  const { data: alerts = [] } = useTeacherAlerts();
  const { data: anns = [] } = useAnnouncements();

  const ctx: AssistantContext = {
    role: "TEACHER",
    userName: user?.fullName ?? "Teacher",
    data: {
      totals: { overall: analytics?.overallAttendancePct },
      lowClasses: (analytics?.perClass ?? []).filter((c) => c.attendancePct < 75).map((c) => ({ label: `${c.courseCode} ${c.sectionName}`, pct: c.attendancePct })),
      live: sessions.filter((s) => s.status === "ACTIVE").map((s) => ({ code: s.courseCode, name: s.courseName })),
      alertsOpen: alerts.filter((a) => a.status === "OPEN" || a.status === "PENDING").length,
      announcements: anns.map((a) => ({ title: a.title, author: a.authorName })),
    },
  };
  return <AssistantPanel ctx={ctx} />;
}

function AdminAssistant() {
  const user = useAuthStore((s) => s.user);
  const { data: dash } = useAdminDashboard();
  const { data: alerts = [] } = useProxyAlerts();
  const { data: anns = [] } = useAnnouncements();
  const c = dash as Partial<{ totalStudents: number; totalTeachers: number; totalCourses: number; activeSessionsNow: number; overallAttendance: number }> | undefined;

  const ctx: AssistantContext = {
    role: "ADMIN",
    userName: user?.fullName ?? "Admin",
    data: {
      totals: {
        students: c?.totalStudents, teachers: c?.totalTeachers, courses: c?.totalCourses,
        activeSessions: c?.activeSessionsNow, overall: c?.overallAttendance,
      },
      alertsOpen: alerts.filter((a) => a.status === "OPEN").length,
      announcements: anns.map((a) => ({ title: a.title, author: a.authorName })),
    },
  };
  return <AssistantPanel ctx={ctx} />;
}

// ---- Shared chat panel ----

interface Msg { from: "user" | "bot"; text: string; action?: AssistantReply["action"]; suggestions?: string[] }

function AssistantPanel({ ctx }: { ctx: AssistantContext }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Seed greeting the first time the panel opens.
  useEffect(() => {
    if (open && msgs.length === 0) {
      const r = runAssistant("hi", ctx);
      setMsgs([{ from: "bot", text: r.text, suggestions: r.suggestions }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  function send(text: string) {
    const q = text.trim();
    if (!q) return;
    const reply = runAssistant(q, ctx);
    setMsgs((m) => [...m, { from: "user", text: q }, { from: "bot", text: reply.text, action: reply.action, suggestions: reply.suggestions }]);
    setInput("");
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI assistant"
        className={cn(
          "fixed bottom-5 right-5 z-[90] size-14 rounded-full grid place-items-center text-white shadow-glass-lg transition-all hover:scale-105 active:scale-95",
          "bg-gradient-to-br from-brand-500 to-brand-700",
          open && "rotate-90"
        )}
      >
        {open ? <X className="size-6" /> : <Sparkles className="size-6" />}
        {!open ? <span className="absolute inset-0 rounded-full ring-2 ring-brand-400/40 animate-ping" style={{ animationDuration: "2.4s" }} /> : null}
      </button>

      {/* Chat panel */}
      {open ? (
        <div className="fixed bottom-24 right-5 z-[90] w-[calc(100vw-2.5rem)] max-w-[380px] h-[min(560px,calc(100vh-8rem))] flex flex-col glass-strong rounded-3xl shadow-glass-lg overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="glass-dark text-white px-4 py-3.5 flex items-center gap-3 shrink-0">
            <div className="size-9 rounded-xl bg-white/12 ring-1 ring-white/20 grid place-items-center">
              <Bot className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-[1.15rem] leading-none">AttendAI Assistant</p>
              <p className="text-[0.66rem] text-white/55 mt-0.5">Ask about your data · I can take you anywhere</p>
            </div>
            <button onClick={() => setOpen(false)} className="size-7 grid place-items-center rounded-lg hover:bg-white/10 text-white/70" aria-label="Close"><X className="size-4" /></button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[0.85rem] leading-relaxed",
                  m.from === "user" ? "bg-brand-600 text-white rounded-br-md" : "bg-white/80 text-ink-800 rounded-bl-md ring-1 ring-ink-100")}>
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.action ? (
                    <button onClick={() => go(m.action!.href)} className="mt-2 inline-flex items-center gap-1.5 text-[0.78rem] font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg px-2.5 py-1.5 transition-colors">
                      {m.action.label} <ArrowRight className="size-3.5" />
                    </button>
                  ) : null}
                  {m.suggestions?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.suggestions.map((s) => (
                        <button key={s} onClick={() => send(s)} className="text-[0.72rem] text-ink-600 bg-ink-100/70 hover:bg-ink-200/70 rounded-full px-2.5 py-1 transition-colors">{s}</button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="p-3 border-t border-ink-100/80 flex items-center gap-2 shrink-0 bg-white/40"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything…"
              className="flex-1 h-10 px-3.5 rounded-xl bg-white border border-ink-200/60 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
            <button type="submit" disabled={!input.trim()} className="size-10 grid place-items-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 transition-colors shrink-0" aria-label="Send">
              <Send className="size-4" />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
