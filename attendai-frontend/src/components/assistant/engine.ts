import type { Role } from "@/types/api";

/** Normalised facts the assistant reasons over, gathered per role. */
export interface AssistantContext {
  role: Role;
  userName: string;
  data: {
    overall?: number | null;
    perCourse?: { code: string; name: string; pct: number | null }[];
    courses?: { code: string; name: string; section?: string }[];
    live?: { code: string; name: string }[];
    alertsOpen?: number;
    announcements?: { title: string; author: string }[];
    totals?: Partial<{ students: number; teachers: number; courses: number; activeSessions: number; overall: number }>;
    lowClasses?: { label: string; pct: number }[];
  };
}

export interface AssistantReply {
  text: string;
  action?: { label: string; href: string };
  suggestions?: string[];
}

interface NavEntry { kw: string[]; label: string; href: string }

const NAV: Record<Role, NavEntry[]> = {
  STUDENT: [
    { kw: ["mark", "attendance now", "join session", "scan", "check in"], label: "Mark Attendance", href: "/student/attendance" },
    { kw: ["schedule", "timetable", "agenda", "today", "calendar"], label: "Schedule", href: "/student/schedule" },
    { kw: ["my course", "courses", "classes", "subjects", "enroll"], label: "My Courses", href: "/student/courses" },
    { kw: ["history", "record", "past", "log"], label: "History", href: "/student/history" },
    { kw: ["announcement", "notice", "news"], label: "Announcements", href: "/student/announcements" },
    { kw: ["notification", "inbox", "alerts"], label: "Notifications", href: "/student/notifications" },
    { kw: ["face", "profile photo", "register face", "biometric"], label: "Face Profile", href: "/student/face" },
    { kw: ["setting", "password", "account"], label: "Settings", href: "/student/settings" },
    { kw: ["help", "guide", "how to", "onboard"], label: "Help", href: "/student/help" },
  ],
  TEACHER: [
    { kw: ["session", "start class", "open session", "challenge", "code"], label: "Sessions", href: "/teacher/sessions" },
    { kw: ["schedule", "timetable", "agenda", "today", "calendar"], label: "Schedule", href: "/teacher/schedule" },
    { kw: ["student", "roster", "class list"], label: "Students", href: "/teacher/students" },
    { kw: ["course", "classes", "subjects"], label: "Courses", href: "/teacher/courses" },
    { kw: ["analytic", "stats", "performance", "breakdown"], label: "Analytics", href: "/teacher/analytics" },
    { kw: ["report", "export", "download"], label: "Reports", href: "/teacher/reports" },
    { kw: ["alert", "proxy", "suspicious", "cheat"], label: "Proxy Alerts", href: "/teacher/alerts" },
    { kw: ["announcement", "notice", "post", "news"], label: "Announcements", href: "/teacher/announcements" },
    { kw: ["notification", "inbox"], label: "Notifications", href: "/teacher/notifications" },
    { kw: ["setting", "password", "account"], label: "Settings", href: "/teacher/settings" },
    { kw: ["help", "guide", "how to", "onboard"], label: "Help", href: "/teacher/help" },
  ],
  ADMIN: [
    { kw: ["student", "learner"], label: "Students", href: "/admin/students" },
    { kw: ["teacher", "faculty", "staff"], label: "Teachers", href: "/admin/teachers" },
    { kw: ["course", "subject"], label: "Courses", href: "/admin/courses" },
    { kw: ["section", "group"], label: "Sections", href: "/admin/sections" },
    { kw: ["batch", "cohort", "program"], label: "Batches", href: "/admin/batches" },
    { kw: ["assign", "allocation"], label: "Assignments", href: "/admin/assignments" },
    { kw: ["enroll", "registration"], label: "Enrollments", href: "/admin/enrollments" },
    { kw: ["alert", "proxy", "suspicious", "cheat", "fraud"], label: "Proxy Alerts", href: "/admin/alerts" },
    { kw: ["device", "trusted"], label: "Devices", href: "/admin/devices" },
    { kw: ["report", "export", "download"], label: "Reports", href: "/admin/reports" },
    { kw: ["announcement", "notice", "post", "news"], label: "Announcements", href: "/admin/announcements" },
    { kw: ["notification", "inbox"], label: "Notifications", href: "/admin/notifications" },
    { kw: ["setting", "account"], label: "Settings", href: "/admin/settings" },
    { kw: ["help", "guide", "how to", "onboard"], label: "Help", href: "/admin/help" },
  ],
};

function pct(n: number | null | undefined): string {
  return n == null ? "—" : `${n.toFixed(1)}%`;
}

function defaultSuggestions(role: Role): string[] {
  if (role === "STUDENT") return ["What's my attendance?", "Any live sessions?", "Show my history", "Where am I low?"];
  if (role === "TEACHER") return ["Any open alerts?", "How are my classes doing?", "Start a session", "Show low classes"];
  return ["How many students?", "Any proxy alerts?", "Open reports", "Post an announcement"];
}

function capabilities(role: Role): string {
  const common = "I can answer questions about your data and take you to the right page. Try asking about ";
  if (role === "STUDENT") return common + "your attendance percentage, live sessions, your courses, or where your attendance is low. You can also say things like “open my history” or “take me to mark attendance”.";
  if (role === "TEACHER") return common + "your overall attendance, per-class performance, open proxy alerts, or live sessions. Say “start a session” or “show analytics” to jump there.";
  return common + "total students/teachers/courses, live sessions across campus, or open proxy alerts. Say “open reports” or “post an announcement” to jump there.";
}

/** Pure intent matcher. Returns an answer + optional navigation action. */
export function runAssistant(input: string, ctx: AssistantContext): AssistantReply {
  const q = input.toLowerCase().trim();
  const { role, data } = ctx;
  const nav = NAV[role];
  const first = ctx.userName.split(" ")[0] || "there";

  if (!q) return { text: "Ask me anything about your attendance or where you'd like to go.", suggestions: defaultSuggestions(role) };

  // Greetings
  if (/^(hi|hello|hey|yo|salam|assalam|assalam|hiya|greetings|good (morning|afternoon|evening))\b/.test(q)) {
    return { text: `Hi ${first}! I'm your AttendAI assistant. Ask me about your data, or tell me where to go.`, suggestions: defaultSuggestions(role) };
  }

  // Capabilities
  if (q.includes("what can you") || q.includes("who are you") || q.includes("your capabilities") || q === "commands" || q === "help me") {
    return { text: capabilities(role), suggestions: defaultSuggestions(role) };
  }

  // Thanks
  if (/(thank|thanks|thx|appreciate)/.test(q)) {
    return { text: "Anytime! 🎓 Anything else I can help with?", suggestions: defaultSuggestions(role) };
  }

  // ---- Role-specific data intents ----
  if (role === "STUDENT") {
    if (/(attendance|percentage|how am i|how'?s my|am i doing|standing)/.test(q) && !/low|below|risk|danger/.test(q)) {
      const lows = (data.perCourse ?? []).filter((c) => c.pct != null && (c.pct as number) < 75);
      const tail = lows.length ? ` Watch out for ${lows.map((c) => c.code).join(", ")} (below 75%).` : " You're above the 75% line everywhere — nice.";
      return { text: `Your overall attendance is ${pct(data.overall)}.${data.perCourse?.length ? tail : ""}`, action: { label: "Open history", href: "/student/history" }, suggestions: ["Where am I low?", "Any live sessions?"] };
    }
    if (/(low|below|risk|danger|failing|short)/.test(q)) {
      const lows = (data.perCourse ?? []).filter((c) => c.pct != null && (c.pct as number) < 75);
      if (!data.perCourse?.length) return { text: "I don't see any course data yet. Once you've attended a few sessions I can flag low ones.", action: { label: "My courses", href: "/student/courses" } };
      if (!lows.length) return { text: "Good news — none of your courses are below 75%. Keep it up!", suggestions: ["What's my attendance?"] };
      return { text: `You're below 75% in: ${lows.map((c) => `${c.code} (${pct(c.pct)})`).join(", ")}. Try not to miss the next sessions.`, action: { label: "Open history", href: "/student/history" } };
    }
    if (/(live|now|ongoing|happening|active session|class right now)/.test(q)) {
      const live = data.live ?? [];
      if (!live.length) return { text: "No live sessions right now. I'll be here when one starts.", action: { label: "Schedule", href: "/student/schedule" } };
      return { text: `${live.length} live session${live.length > 1 ? "s" : ""}: ${live.map((s) => s.code).join(", ")}. Mark before it closes!`, action: { label: "Mark attendance", href: "/student/attendance" } };
    }
    if (/(my course|courses|classes|subjects|enrolled)/.test(q)) {
      const cs = data.courses ?? [];
      if (!cs.length) return { text: "You're not enrolled in any class yet.", action: { label: "Browse classes", href: "/student/courses" } };
      return { text: `You're enrolled in ${cs.length} class${cs.length > 1 ? "es" : ""}: ${cs.map((c) => c.code).join(", ")}.`, action: { label: "My courses", href: "/student/courses" } };
    }
  }

  if (role === "TEACHER") {
    if (/(alert|proxy|suspicious|cheat|flag)/.test(q)) {
      const n = data.alertsOpen ?? 0;
      return { text: n ? `You have ${n} open proxy alert${n > 1 ? "s" : ""} to review.` : "No open proxy alerts — all clear. ✅", action: { label: "Review alerts", href: "/teacher/alerts" } };
    }
    if (/(attendance|performance|how are my|classes doing|overall)/.test(q) && !/low|below/.test(q)) {
      return { text: `Your overall attendance across classes is ${pct(data.totals?.overall)}.`, action: { label: "Analytics", href: "/teacher/analytics" }, suggestions: ["Show low classes", "Any open alerts?"] };
    }
    if (/(low|below|struggling|worst|risk)/.test(q)) {
      const lows = data.lowClasses ?? [];
      if (!lows.length) return { text: "No classes are below 75% right now. 🎉", action: { label: "Analytics", href: "/teacher/analytics" } };
      return { text: `Below 75%: ${lows.map((c) => `${c.label} (${c.pct.toFixed(0)}%)`).join(", ")}.`, action: { label: "Analytics", href: "/teacher/analytics" } };
    }
    if (/(start|begin|open).*(session|class|attendance)|take attendance/.test(q)) {
      return { text: "Head to Sessions to start one — you'll get a timed code to share with the class.", action: { label: "Start a session", href: "/teacher/sessions" } };
    }
    if (/(live|now|ongoing|active session)/.test(q)) {
      const live = data.live ?? [];
      return { text: live.length ? `${live.length} of your sessions ${live.length > 1 ? "are" : "is"} live: ${live.map((s) => s.code).join(", ")}.` : "None of your sessions are live right now.", action: { label: "Sessions", href: "/teacher/sessions" } };
    }
  }

  if (role === "ADMIN") {
    if (/(how many|number of|count|total).*(student)/.test(q) || q === "students") {
      return { text: `There are ${data.totals?.students ?? "—"} students registered.`, action: { label: "Students", href: "/admin/students" } };
    }
    if (/(how many|number of|count|total).*(teacher|faculty)/.test(q) || q === "teachers") {
      return { text: `There are ${data.totals?.teachers ?? "—"} teachers.`, action: { label: "Teachers", href: "/admin/teachers" } };
    }
    if (/(how many|number of|count|total).*(course|subject)/.test(q)) {
      return { text: `There are ${data.totals?.courses ?? "—"} courses this term.`, action: { label: "Courses", href: "/admin/courses" } };
    }
    if (/(alert|proxy|suspicious|fraud|cheat|flag)/.test(q)) {
      const n = data.alertsOpen ?? 0;
      return { text: n ? `${n} proxy alert${n > 1 ? "s" : ""} need attention.` : "No open proxy alerts. ✅", action: { label: "Proxy alerts", href: "/admin/alerts" } };
    }
    if (/(overview|summary|status|how is the system|stats|dashboard)/.test(q)) {
      const t = data.totals ?? {};
      return { text: `System overview — ${t.students ?? "—"} students, ${t.teachers ?? "—"} teachers, ${t.courses ?? "—"} courses, ${t.activeSessions ?? 0} live now, overall attendance ${pct(t.overall ?? null)}.`, action: { label: "Dashboard", href: "/admin" } };
    }
    if (/(live|now|active session|ongoing)/.test(q)) {
      const n = data.totals?.activeSessions ?? 0;
      return { text: n ? `${n} session${n > 1 ? "s" : ""} live across campus right now.` : "No sessions are live right now.", action: { label: "Dashboard", href: "/admin" } };
    }
  }

  // Announcements (all roles)
  if (/(announcement|notice|news|latest)/.test(q)) {
    const a = data.announcements ?? [];
    const base = `/${role.toLowerCase()}/announcements`;
    if (!a.length) return { text: "There are no announcements right now.", action: { label: "Announcements", href: base } };
    return { text: `Latest: “${a[0].title}” — ${a[0].author}.${a.length > 1 ? ` (+${a.length - 1} more)` : ""}`, action: { label: "Read all", href: base } };
  }

  // Schedule
  if (/(schedule|timetable|agenda|today|tomorrow|this week|calendar)/.test(q)) {
    const base = role === "ADMIN" ? "/admin" : `/${role.toLowerCase()}/schedule`;
    return { text: role === "ADMIN" ? "Admins don't have a personal schedule, but the dashboard shows live activity." : "Here's your schedule — a week-by-week agenda of your sessions.", action: { label: role === "ADMIN" ? "Dashboard" : "Open schedule", href: base } };
  }

  // Logout (answer + navigate guidance — no auto-action under answer+navigate)
  if (/(log ?out|sign ?out|exit|leave)/.test(q)) {
    return { text: "You can log out from the Log out button at the bottom of the sidebar." };
  }

  // Generic navigation ("go to / open / take me to / show ...")
  const navMatch = nav.find((n) => n.kw.some((k) => q.includes(k)));
  if (navMatch) {
    return { text: `Sure — opening ${navMatch.label}.`, action: { label: `Go to ${navMatch.label}`, href: navMatch.href } };
  }

  // Fallback
  return {
    text: `I'm not sure about that yet, ${first}. I can help with your ${role === "STUDENT" ? "attendance, courses and live sessions" : role === "TEACHER" ? "classes, sessions, students and alerts" : "students, teachers, alerts and reports"} — or take you to any page.`,
    suggestions: defaultSuggestions(role),
  };
}
