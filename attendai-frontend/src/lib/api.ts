/**
 * Typed API client. Two modes:
 *   - Real backend: NEXT_PUBLIC_MOCK=false (or unset) — hits /api/backend/*
 *   - Mock:         NEXT_PUBLIC_MOCK=true  — returns canned data from lib/mockData
 *
 * Real-mode flow:
 *   - Reads access token from localStorage (set by the auth store).
 *   - On 401, tries the refresh endpoint once and retries the original
 *     request; if refresh fails, dispatches an `attendai:logout` event so
 *     the auth store can clear and redirect to /login.
 */

import type {
  ApiResponse, LoginResponse, User,
} from "@/types/api";
import * as mock from "@/lib/mockData";

const MOCK = process.env.NEXT_PUBLIC_MOCK === "true";
const BASE = "/api/backend";

export const isMock = MOCK;

/** Live counters payload — matches SessionEventPublisher.LiveCounters on the backend. */
export interface LiveCounters {
  present: number;
  absent: number;
  late: number;
  suspicious: number;
  pendingReview: number;
  total: number;
}

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

// ============================================================
// Request wrapper with 401 → refresh → retry
// ============================================================

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("attendai.accessToken");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("attendai.auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.refreshToken ?? null;
  } catch {
    return null;
  }
}

function setAccessToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("attendai.accessToken", token);
  }
}

function emitLogout() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("attendai:logout"));
  }
}

async function rawRequest<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string | null,
): Promise<T> {
  const token = accessToken ?? getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError("PARSE", "Server returned non-JSON response", res.status);
  }
  if (!res.ok || !json.success) {
    throw new ApiError(
      json.error?.code ?? "UNKNOWN",
      json.error?.message ?? `Request failed (${res.status})`,
      res.status,
    );
  }
  return json.data as T;
}

let refreshInFlight: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;          // collapse concurrent refreshes
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  refreshInFlight = (async () => {
    try {
      const data = await rawRequest<{ accessToken: string; refreshToken: string }>(
        "/auth/refresh-token",
        { method: "POST", body: JSON.stringify({ refreshToken }) },
        null,                                              // don't attach the (expired) access token
      );
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, init);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !path.startsWith("/auth/")) {
      const newToken = await tryRefresh();
      if (newToken) {
        return rawRequest<T>(path, init, newToken);
      }
      emitLogout();
    }
    throw err;
  }
}

// Spring Data's Page<T> wraps results as { content, totalElements, ... }.
// Components consume plain arrays, so unwrap transparently — and tolerate
// either shape so endpoints that return List<T> still work.
export async function requestList<T>(path: string, init: RequestInit = {}): Promise<T[]> {
  const raw = await request<unknown>(path, init);
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { content?: unknown }).content)) {
    return (raw as { content: T[] }).content;
  }
  return [];
}

// ============================================================
// File download helper (used by the report endpoints)
// ============================================================

export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let msg = `Server returned ${res.status}`;
    try { msg = (await res.json())?.error?.message || msg; } catch {}
    throw new ApiError("DOWNLOAD", msg, res.status);
  }
  const blob = await res.blob();
  const dispo = res.headers.get("Content-Disposition") || "";
  const filename = /filename="([^"]+)"/.exec(dispo)?.[1] || fallbackName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ============================================================
// MOCK helpers
// ============================================================

const delay = <T>(value: T, ms = 250): Promise<T> =>
  new Promise(r => setTimeout(() => r(value), ms));

const MOCK_USERS: Record<string, { user: User; password: string }> = {
  "admin@attendai.local": {
    user: { id: 1, fullName: "System Administrator", email: "admin@attendai.local", role: "ADMIN", status: "ACTIVE" },
    password: "Admin@12345",
  },
  "sarah.johnson@inst.edu": {
    user: { id: 2, fullName: "Dr. Sarah Johnson", email: "sarah.johnson@inst.edu", role: "TEACHER", status: "ACTIVE" },
    password: "Teacher@123",
  },
  "aarav.sharma@inst.edu": {
    user: { id: 3, fullName: "Aarav Sharma", email: "aarav.sharma@inst.edu", role: "STUDENT", status: "ACTIVE" },
    password: "Student@123",
  },
};

/** Demo credential hints surfaced on the login screen when in mock mode. */
export const MOCK_HINTS = [
  { role: "Admin",   email: "admin@attendai.local",     password: "Admin@12345" },
  { role: "Teacher", email: "sarah.johnson@inst.edu",   password: "Teacher@123" },
  { role: "Student", email: "aarav.sharma@inst.edu",    password: "Student@123" },
];

// ============================================================
// Public API namespaces
// ============================================================

export const api = {
  // ----- AUTH -----
  auth: {
    async login(email: string, password: string): Promise<LoginResponse> {
      if (MOCK) {
        await delay(null, 350);
        const found = MOCK_USERS[email.toLowerCase()];
        if (!found || found.password !== password) {
          throw new ApiError("AUTH_001", "Invalid email or password", 401);
        }
        return {
          accessToken: "mock-access-" + Date.now(),
          refreshToken: "mock-refresh-" + Date.now(),
          expiresInSeconds: 900,
          user: found.user,
        };
      }
      return request<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },

    async logout(refreshToken: string): Promise<void> {
      if (MOCK) return;
      await request("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    },
  },

  // ----- ADMIN -----
  admin: {
    dashboard: () => MOCK
      ? delay({
          totalStudents: 1242, totalTeachers: 86, totalCourses: 64,
          activeSessionsNow: 7, totalSessionsToday: 24,
          overallAttendance: 92.9, openProxyAlerts: 5,
        })
      : request<unknown>("/admin/dashboard"),

    listStudents: () => MOCK
      ? delay(mock.STUDENTS)
      : requestList<mock.StudentRow>("/admin/students"),

    createStudent: (body: Partial<mock.StudentRow> & { password?: string }) => MOCK
      ? delay({ ...body, id: Math.floor(Math.random() * 10000), status: "ACTIVE" } as mock.StudentRow)
      : request<mock.StudentRow>("/admin/students", { method: "POST", body: JSON.stringify(body) }),

    updateStudent: (id: number, body: Partial<mock.StudentRow>) => MOCK
      ? delay({ ...body, id } as mock.StudentRow)
      : request<mock.StudentRow>(`/admin/students/${id}`, { method: "PUT", body: JSON.stringify(body) }),

    deactivateStudent: (id: number) => MOCK
      ? delay({ id, status: "INACTIVE" } as Partial<mock.StudentRow>)
      : request<void>(`/admin/students/${id}`, { method: "DELETE" }),

    listTeachers: () => MOCK
      ? delay(mock.TEACHERS)
      : requestList<mock.TeacherRow>("/admin/teachers"),

    listCourses: () => MOCK
      ? delay(mock.COURSES)
      : requestList<mock.CourseRow>("/admin/courses"),

    listSections: () => MOCK
      ? delay(mock.SECTIONS)
      : requestList<mock.SectionRow>("/admin/sections"),

    listAlerts: () => MOCK
      ? delay(mock.ALERTS)
      : requestList<mock.AlertRow>("/admin/proxy-alerts"),

    resolveAlert: (id: number, status: "RESOLVED" | "DISMISSED", note?: string) => MOCK
      ? delay({ id, status })
      : request(`/admin/proxy-alerts/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status, resolutionNote: note }),
        }),

    listDevices: () => MOCK
      ? delay(mock.DEVICES)
      : requestList<mock.DeviceRow>("/admin/devices"),
  },

  // ----- TEACHER -----
  teacher: {
    listCourses: () => MOCK
      ? delay(mock.COURSES.slice(0, 4))
      : requestList<mock.CourseRow>("/teacher/courses"),

    listSessions: () => MOCK
      ? delay(mock.SESSIONS)
      : requestList<mock.SessionRow>("/teacher/attendance-sessions"),

    sessionLive: (sessionId: number): Promise<LiveCounters> => MOCK
      ? delay({ present: 38, absent: 7, late: 2, suspicious: 0, pendingReview: 0, total: 45 })
      : request<LiveCounters>(`/teacher/attendance-sessions/${sessionId}/live`),

    createSession: (body: { courseId: number; sectionId: number; sessionTitle?: string }) => MOCK
      ? delay({ id: 999, sessionCode: "AS-NEW", status: "SCHEDULED" })
      : request("/teacher/attendance-sessions", { method: "POST", body: JSON.stringify(body) }),

    startSession: (id: number, body: { durationSeconds?: number; challengeType?: string }) => MOCK
      ? delay({ session: { id, status: "ACTIVE" }, challenge: { challengeId: 1, challengeCode: "G7Q4M2", expiryTime: new Date(Date.now() + 60000).toISOString() } })
      : request(`/teacher/attendance-sessions/${id}/start`, { method: "POST", body: JSON.stringify(body) }),

    nextChallenge: (id: number, body: { durationSeconds?: number; challengeType?: string }) => MOCK
      ? delay({ challengeId: Math.floor(Math.random() * 1000), challengeCode: "ABC123", expiryTime: new Date(Date.now() + 60000).toISOString() })
      : request(`/teacher/attendance-sessions/${id}/challenges`, { method: "POST", body: JSON.stringify(body) }),

    closeSession: (id: number) => MOCK
      ? delay({ id, status: "CLOSED" })
      : request(`/teacher/attendance-sessions/${id}/close`, { method: "POST" }),
  },

  // ----- STUDENT -----
  student: {
    myCourses: () => MOCK
      ? delay(mock.COURSES.slice(0, 5).map((c, i) => ({
          enrollmentId: i + 1,
          courseId: c.id,
          courseCode: c.courseCode,
          courseName: c.courseName,
          sectionId: 1,
          sectionName: "BCS-7A",
        })))
      : requestList<unknown>("/student/courses"),

    activeSessions: () => MOCK
      ? delay(mock.SESSIONS.filter(s => s.status === "ACTIVE"))
      : requestList<mock.SessionRow>("/student/active-sessions"),

    history: () => MOCK
      ? delay({ content: mock.STUDENT_HISTORY, totalElements: mock.STUDENT_HISTORY.length })
      : request<{ content: unknown[]; totalElements: number }>("/student/attendance/history"),

    percentage: () => MOCK
      ? delay({ overall: 87.5, courseBreakdown: [] })
      : request("/student/attendance/percentage"),

    markAttendance: (body: {
      sessionId: number; challengeId: number;
      submittedCode?: string; qrToken?: string;
      faceImage?: string; deviceToken?: string;
    }) => MOCK
      ? delay({
          recordId: Math.floor(Math.random() * 10000),
          status: "PRESENT",
          riskScore: 12,
          riskLevel: "LOW",
          faceConfidence: 0.94,
          factors: [],
          message: "Attendance marked.",
        })
      : request("/student/attendance/mark", { method: "POST", body: JSON.stringify(body) }),

    registerFace: (images: string[]) => MOCK
      ? delay({ profileId: "fp_mock_" + Date.now(), samplesUsed: images.length, qualityScore: 0.9 })
      : request("/student/face/register", { method: "POST", body: JSON.stringify({ images }) }),

    verifyFace: (image: string) => MOCK
      ? delay({ verified: true, confidence: 0.94, status: "VERIFIED" })
      : request("/student/face/verify", { method: "POST", body: JSON.stringify({ image }) }),

    registerDevice: (body: { deviceName: string; browserInfo: string }) => MOCK
      ? delay({ deviceId: 1, deviceToken: "mock-device-" + Date.now(), trusted: true })
      : request("/student/device/register", { method: "POST", body: JSON.stringify(body) }),
  },

  // ----- REPORTS -----
  reports: {
    downloadStudent: (studentId: number, format: "pdf" | "xlsx" | "csv") =>
      downloadFile(`/reports/student/${studentId}/export?format=${format}`,
                   `student-${studentId}.${format}`),

    downloadCourse: (courseId: number, format: "pdf" | "xlsx" | "csv", sectionId?: number) =>
      downloadFile(
        `/reports/course/${courseId}/export?format=${format}${sectionId ? `&sectionId=${sectionId}` : ""}`,
        `course-${courseId}.${format}`),

    downloadDefaulters: (format: "pdf" | "xlsx" | "csv", threshold?: number) =>
      downloadFile(
        `/reports/defaulters/export?format=${format}${threshold ? `&threshold=${threshold}` : ""}`,
        `defaulters.${format}`),

    downloadProxyAlerts: (format: "pdf" | "xlsx" | "csv") =>
      downloadFile(`/reports/proxy-alerts/export?format=${format}`, `proxy-alerts.${format}`),

    downloadRange: (from: string, to: string, format: "pdf" | "xlsx" | "csv", courseId?: number) =>
      downloadFile(
        `/reports/range/export?from=${from}&to=${to}&format=${format}${courseId ? `&courseId=${courseId}` : ""}`,
        `range-${from}-${to}.${format}`),
  },
};
