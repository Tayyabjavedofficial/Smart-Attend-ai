"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LifeBuoy, ChevronDown, ScanFace, Radio, BookOpen, ClipboardList,
  Users, GraduationCap, Layers, ShieldAlert, BarChart3,
  MapPin, KeyRound, Sparkles, type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { Role } from "@/types/api";

interface Step { icon: LucideIcon; title: string; desc: string; href?: string }
interface Faq { q: string; a: string }

const steps: Record<Role, Step[]> = {
  STUDENT: [
    { icon: ScanFace, title: "Register your face", desc: "Set up your face profile once — it's how the system confirms it's really you marking attendance.", href: "/student/face" },
    { icon: BookOpen, title: "Enroll in your classes", desc: "Browse available classes and join the ones you're taking this semester.", href: "/student/courses" },
    { icon: Radio, title: "Mark when a session is live", desc: "When your teacher starts a session, open Mark Attendance, type the code shown in class, and capture your face.", href: "/student/attendance" },
    { icon: ClipboardList, title: "Track your attendance", desc: "Check your percentage per course and your full record any time in History.", href: "/student/history" },
  ],
  TEACHER: [
    { icon: BookOpen, title: "Review your classes", desc: "Your assigned course + section pairs are listed under Courses — each can host an attendance session.", href: "/teacher/courses" },
    { icon: Radio, title: "Start a session", desc: "Open Sessions, start one, and a timed code appears. Read it out (or display it) for students to enter.", href: "/teacher/sessions" },
    { icon: BarChart3, title: "Watch it live", desc: "Present / late / absent counters update in real time as students mark in. Issue a new code anytime.", href: "/teacher/sessions" },
    { icon: ShieldAlert, title: "Review analytics & alerts", desc: "Spot low-attendance classes and any flagged proxy attempts, then export reports.", href: "/teacher/analytics" },
  ],
  ADMIN: [
    { icon: Users, title: "Add people", desc: "Create teacher and student accounts. They sign in with the email + password you set.", href: "/admin/teachers" },
    { icon: Layers, title: "Set up courses & sections", desc: "Define the courses offered and the sections (class groups) students belong to.", href: "/admin/courses" },
    { icon: GraduationCap, title: "Assign & enroll", desc: "Assign teachers to course+section pairs, then enroll students into them.", href: "/admin/assignments" },
    { icon: ShieldAlert, title: "Monitor the system", desc: "Keep an eye on proxy alerts, trusted devices, and campus-wide reports.", href: "/admin/alerts" },
  ],
};

const sharedFaqs: Faq[] = [
  { q: "Why does AttendAI use my camera?", a: "Attendance is verified with a quick face capture so one person can't mark another present. Images are used only to score the match — nothing is shared publicly." },
  { q: "What is the challenge code?", a: "When a session starts, the teacher's screen shows a short code that changes periodically. Entering the current code proves you're in class while the session is open." },
  { q: "Why is location sometimes required?", a: "Teachers can switch on a location check for a session. When it's on, your device must be inside the campus geofence for the mark to count — an extra guard against remote proxying." },
];

const roleFaqs: Record<Role, Faq[]> = {
  STUDENT: [
    { q: "I was marked absent but I was there — what do I do?", a: "Reach out to your teacher; they can review the session and correct your record. Your History page shows the exact status and time for reference." },
    { q: "My face won't verify. Help?", a: "Make sure you're in good lighting and facing the camera. If it keeps failing, re-register your face profile from the Face Profile page." },
  ],
  TEACHER: [
    { q: "Can I issue a new code mid-session?", a: "Yes — from the live session view you can generate a fresh code at any time. Old codes expire automatically." },
    { q: "How do I post a notice to my students?", a: "Use Announcements → New announcement, choose the Students audience, and it appears instantly on their dashboards." },
  ],
  ADMIN: [
    { q: "How do I reset a user's password?", a: "Open the user under Students or Teachers and update their account. Users can also use the Forgot Password flow from the login screen." },
    { q: "Where do proxy alerts come from?", a: "The system raises an alert when a mark looks suspicious (device reuse, repeated face mismatch, off-campus location, etc.). Review and resolve them under Proxy Alerts." },
  ],
};

export function HelpView({ role }: { role: Role }) {
  const base = `/${role.toLowerCase()}`;
  const roleName = role.charAt(0) + role.slice(1).toLowerCase();
  const faqs = [...roleFaqs[role], ...sharedFaqs];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <PageHeader
        title="Help & Getting Started"
        subtitle={`Everything you need to make the most of AttendAI as ${role === "ADMIN" ? "an" : "a"} ${roleName.toLowerCase()}.`}
        icon={LifeBuoy}
        crumbs={[{ label: roleName, href: base }, { label: "Help" }]}
      />

      {/* Hero */}
      <Card className="relative overflow-hidden p-0 mb-4">
        <div className="absolute inset-0 glass-dark" />
        <div className="relative p-6 text-white flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-white/12 ring-1 ring-white/20 grid place-items-center shrink-0 animate-float">
            <Sparkles className="size-6" />
          </div>
          <div>
            <p className="font-display text-[1.6rem] leading-tight">Welcome to AttendAI</p>
            <p className="text-white/70 text-sm mt-0.5 max-w-xl">Smart, secure attendance — face-verified, real-time, and fair. Follow the steps below to get going in minutes.</p>
          </div>
        </div>
      </Card>

      {/* Steps */}
      <h2 className="font-display text-2xl text-ink-900 mb-3 px-1">Getting started</h2>
      <div className="grid gap-4 sm:grid-cols-2 stagger mb-6">
        {steps[role].map((s, i) => {
          const Icon = s.icon;
          const inner = (
            <Card className="h-full hover-lift">
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div className="size-11 rounded-2xl bg-brand-50 text-brand-600 grid place-items-center"><Icon className="size-5" /></div>
                  <span className="absolute -top-1.5 -left-1.5 size-5 rounded-full bg-brand-600 text-white text-[0.62rem] font-semibold grid place-items-center numeral">{i + 1}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[0.95rem] font-medium text-ink-900">{s.title}</p>
                  <p className="text-[0.8rem] text-ink-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            </Card>
          );
          return s.href ? <Link key={i} href={s.href} className="block">{inner}</Link> : <div key={i}>{inner}</div>;
        })}
      </div>

      {/* FAQ */}
      <h2 className="font-display text-2xl text-ink-900 mb-3 px-1">Frequently asked</h2>
      <Card className="p-2 sm:p-3 mb-4">
        <ul className="divide-y divide-ink-100/70">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center gap-3 px-3 py-3.5 text-left hover:bg-white/50 rounded-xl transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="flex-1 text-[0.9rem] font-medium text-ink-900">{f.q}</span>
                  <ChevronDown className={cn("size-4 text-ink-400 transition-transform shrink-0", isOpen && "rotate-180 text-brand-600")} />
                </button>
                <div className={cn("grid transition-all duration-300 ease-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                  <div className="overflow-hidden">
                    <p className="px-3 pb-4 text-[0.83rem] text-ink-500 leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Quick reference */}
      <div className="grid gap-4 sm:grid-cols-3 stagger">
        <RefCard icon={ScanFace} title="Face = identity" desc="A quick capture confirms it's really you." />
        <RefCard icon={KeyRound} title="Code = presence" desc="The in-class code proves you're there now." />
        <RefCard icon={MapPin} title="Location = on campus" desc="Optional geofence blocks remote proxying." />
      </div>
    </>
  );
}

function RefCard({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <Card className="text-center hover-lift">
      <div className="size-11 rounded-2xl bg-brand-50 text-brand-600 grid place-items-center mx-auto mb-2"><Icon className="size-5" /></div>
      <p className="text-[0.9rem] font-medium text-ink-900">{title}</p>
      <p className="text-[0.78rem] text-ink-500 mt-0.5">{desc}</p>
    </Card>
  );
}
