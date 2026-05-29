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
  ApiResponse, LoginResponse, User, Announcement, NewAnnouncement,
} from "@/types/api";
import * as mock from "@/lib/mockData";
import { useAuthStore } from "@/store/authStore";

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

/** The current user's own profile, mirroring the backend MeDto. */
export interface MeProfile {
  id: number;
  fullName: string;
  email: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  status: string;
  bio?: string | null;
  avatar?: string | null;
  // Role-specific; null when not applicable.
  registrationNumber?: string | null;
  employeeId?: string | null;
  department?: string | null;
  designation?: string | null;
  semester?: number | null;
  section?: string | null;
}

export interface ProfilePatch {
  fullName: string;
  bio?: string;
  avatar?: string;
}

/** A course+section pair the teacher is assigned to teach (from /teacher/courses). */
export interface TeacherCourseOption {
  assignmentId: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  sectionId: number;
  sectionName: string;
}

/** A teacher's attendance session (backend SessionDto). */
export interface TeacherSession {
  id: number;
  sessionCode: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  sectionId: number;
  sectionName: string;
  sessionTitle?: string | null;
  status: string;
  startTime?: string | null;
  endTime?: string | null;
  requireLocation?: boolean;
}

/** A challenge as the teacher sees it — includes the visible code to display. */
export interface ChallengeInfo {
  challengeId: number;
  sessionId: number;
  challengeCode: string;
  qrToken?: string;
  challengeType: string;
  startTime?: string;
  expiryTime: string;
  durationSeconds: number;
}

export interface StartResult { session: TeacherSession; challenge: ChallengeInfo; }

/** A student in one of the teacher's classes (backend TeacherStudentRow). */
export interface TeacherStudentRow {
  studentId: number;
  fullName: string;
  email: string;
  registrationNumber?: string | null;
  courseCode: string;
  courseName: string;
  sectionName: string;
}

/** A proxy alert on one of the teacher's sessions (backend TeacherAlertRow). */
export interface TeacherAlertRow {
  id: number;
  studentId: number;
  sessionId?: number | null;
  alertType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  riskScore: number;
  status: string;
  createdAt: string;
}

/** Per-class analytics row + the overall summary (backend Analytics). */
export interface TeacherCourseStat {
  courseCode: string;
  courseName: string;
  sectionName: string;
  students: number;
  sessions: number;
  present: number;
  total: number;
  attendancePct: number;
}
export interface TeacherAnalytics {
  totalCourses: number;
  totalStudents: number;
  totalSessions: number;
  activeSessions: number;
  overallAttendancePct: number;
  perClass: TeacherCourseStat[];
}

/** A class the student is enrolled in (backend CourseSummary). */
export interface StudentCourseSummary {
  enrollmentId: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  sectionId: number;
  sectionName: string;
}

/** A class the student can self-enroll in (backend AvailableClass). */
export interface AvailableClass {
  courseId: number;
  courseCode: string;
  courseName: string;
  sectionId: number;
  sectionName: string;
  teacherName: string;
  enrolled: boolean;
}

/** Attendance percentages (backend PercentageResult). */
export interface PercentageResult {
  overall: number;
  perCourse: { courseCode: string; courseName: string; percentage: number; present: number; total: number }[];
}

/** An active attendance session a student is enrolled in (backend SessionDto). */
export interface StudentSession {
  id: number;
  sessionCode: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  sectionId: number;
  sectionName: string;
  sessionTitle?: string | null;
  status: string;
  startTime?: string | null;
  requireLocation?: boolean;
}

/** The currently-open challenge for a session (code intentionally omitted). */
export interface CurrentChallenge {
  challengeId: number;
  sessionId: number;
  challengeType: string;
  expiryTime: string;
  durationSeconds: number;
}

/** Result of a mark-attendance attempt (backend MarkAttendanceResponse). */
export interface MarkResult {
  recordId: number;
  status: string;
  riskScore: number;
  riskLevel: string;
  faceConfidence?: number | null;
  factors?: string[];
  markedAt?: string;
  message?: string;
}

/** A trusted device, mirroring the backend DeviceDto. */
export interface DeviceDto {
  id: number;
  studentId: number;
  studentName: string;
  deviceName: string;
  browserInfo: string;
  ipAddress: string;
  trusted: boolean;
  blocked: boolean;
  lastUsedAt?: string | null;
  createdAt?: string | null;
}

/** A proxy alert, mirroring the backend AlertDto. */
export interface ProxyAlertDto {
  id: number;
  studentId: number;
  sessionId?: number | null;
  challengeId?: number | null;
  alertType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  riskScore: number;
  status: "OPEN" | "RESOLVED" | "DISMISSED" | string;
  createdAt: string;
}

/** A teacher↔course↔section assignment, mirroring the backend AssignmentDto. */
export interface AssignmentDto {
  id: number;
  teacherId: number;
  teacherName: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  sectionId: number;
  sectionName: string;
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
      // The backend rotates refresh tokens (old one is revoked), so we MUST
      // persist the new pair — otherwise the next refresh reuses a revoked
      // token and fails.
      try {
        useAuthStore.setState({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      } catch { /* store not ready (SSR) — localStorage access token is enough for this tab */ }
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
    // An expired access token surfaces as 401 normally, but because Spring
    // falls back to an anonymous principal it often comes back as 403
    // ("Access denied"). Try a token refresh + one retry for both, so an
    // expired session self-heals instead of stranding the user.
    if (err instanceof ApiError && (err.status === 401 || err.status === 403) && !path.startsWith("/auth/")) {
      const newToken = await tryRefresh();
      if (newToken) {
        return rawRequest<T>(path, init, newToken);
      }
      // Refresh failed: a 401 means the session is truly gone — log out.
      // A 403 with no refresh available is a genuine authorization error.
      if (err.status === 401) emitLogout();
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

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 1, title: "Mid-term attendance audit this Friday", body: "All students must ensure their face profile is registered before Friday. Sessions flagged with low confidence will require an in-person review.", audience: "ALL", pinned: true, authorId: 1, authorName: "Tayyab Admin", authorRole: "ADMIN", createdAt: new Date(Date.now() - 3600_000).toISOString() },
  { id: 2, title: "AI lab rescheduled to 2 PM", body: "Tomorrow's Artificial Intelligence lab (CS201) is moved to 2 PM in Lab B. The attendance session will open 5 minutes before class.", audience: "STUDENTS", pinned: false, authorId: 21, authorName: "Dr. Sarah Johnson", authorRole: "TEACHER", createdAt: new Date(Date.now() - 26 * 3600_000).toISOString() },
  { id: 3, title: "Faculty: new geofence radius live", body: "The campus geofence is now active for location-required sessions. Toggle 'Require location' when starting a session to enable it.", audience: "TEACHERS", pinned: false, authorId: 1, authorName: "Tayyab Admin", authorRole: "ADMIN", createdAt: new Date(Date.now() - 3 * 24 * 3600_000).toISOString() },
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

    async forgotPassword(email: string): Promise<void> {
      if (MOCK) { await delay(null, 350); return; }
      await request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },

    async resetPassword(token: string, newPassword: string): Promise<void> {
      if (MOCK) { await delay(null, 350); return; }
      await request("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
    },
  },

  // ----- CURRENT USER (self-service) -----
  me: {
    profile: () => MOCK
      ? delay({ id: 1, fullName: "Demo User", email: "demo@attendai.local", role: "ADMIN", status: "ACTIVE" } as MeProfile)
      : request<MeProfile>("/me"),

    updateProfile: (patch: ProfilePatch) => MOCK
      ? delay({ id: 1, email: "demo@attendai.local", role: "ADMIN", status: "ACTIVE", ...patch } as MeProfile)
      : request<MeProfile>("/me", { method: "PUT", body: JSON.stringify(patch) }),

    changePassword: (currentPassword: string, newPassword: string) => MOCK
      ? delay(undefined)
      : request<void>("/me/change-password", {
          method: "POST",
          body: JSON.stringify({ currentPassword, newPassword }),
        }),
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

    createTeacher: (body: Partial<mock.TeacherRow> & { password?: string }) => MOCK
      ? delay({ ...body, id: Math.floor(Math.random() * 10000), status: "ACTIVE" } as mock.TeacherRow)
      : request<mock.TeacherRow>("/admin/teachers", { method: "POST", body: JSON.stringify(body) }),

    updateTeacher: (id: number, body: Partial<mock.TeacherRow>) => MOCK
      ? delay({ ...body, id } as mock.TeacherRow)
      : request<mock.TeacherRow>(`/admin/teachers/${id}`, { method: "PUT", body: JSON.stringify(body) }),

    deactivateTeacher: (id: number) => MOCK
      ? delay({ id, status: "INACTIVE" } as Partial<mock.TeacherRow>)
      : request<void>(`/admin/teachers/${id}`, { method: "DELETE" }),

    listCourses: () => MOCK
      ? delay(mock.COURSES)
      : requestList<mock.CourseRow>("/admin/courses"),

    createCourse: (body: Partial<mock.CourseRow>) => MOCK
      ? delay({ ...body, id: Math.floor(Math.random() * 10000) } as mock.CourseRow)
      : request<mock.CourseRow>("/admin/courses", { method: "POST", body: JSON.stringify(body) }),

    updateCourse: (id: number, body: Partial<mock.CourseRow>) => MOCK
      ? delay({ ...body, id } as mock.CourseRow)
      : request<mock.CourseRow>(`/admin/courses/${id}`, { method: "PUT", body: JSON.stringify(body) }),

    deleteCourse: (id: number) => MOCK
      ? delay({ id })
      : request<void>(`/admin/courses/${id}`, { method: "DELETE" }),

    listSections: () => MOCK
      ? delay(mock.SECTIONS)
      : requestList<mock.SectionRow>("/admin/sections"),

    createSection: (body: Partial<mock.SectionRow>) => MOCK
      ? delay({ ...body, id: Math.floor(Math.random() * 10000) } as mock.SectionRow)
      : request<mock.SectionRow>("/admin/sections", { method: "POST", body: JSON.stringify(body) }),

    deleteSection: (id: number) => MOCK
      ? delay({ id })
      : request<void>(`/admin/sections/${id}`, { method: "DELETE" }),

    // ----- Teacher ↔ course ↔ section assignments -----
    listAssignments: () => MOCK
      ? delay([] as AssignmentDto[])
      : requestList<AssignmentDto>("/admin/teacher-assignments"),

    createAssignment: (body: { teacherId: number; courseId: number; sectionId: number }) => MOCK
      ? delay({ id: Math.floor(Math.random() * 10000), ...body } as unknown as AssignmentDto)
      : request<AssignmentDto>("/admin/teacher-assignments", { method: "POST", body: JSON.stringify(body) }),

    deleteAssignment: (id: number) => MOCK
      ? delay({ id })
      : request<void>(`/admin/teacher-assignments/${id}`, { method: "DELETE" }),

    listAlerts: () => MOCK
      ? delay(mock.ALERTS as unknown as ProxyAlertDto[])
      : requestList<ProxyAlertDto>("/admin/proxy-alerts"),

    resolveAlert: (id: number, status: "RESOLVED" | "DISMISSED", note?: string) => MOCK
      ? delay({ id, status })
      : request<ProxyAlertDto>(`/admin/proxy-alerts/${id}`, {
          method: "PUT",
          body: JSON.stringify({ status, resolutionNote: note }),
        }),

    listDevices: () => MOCK
      ? delay(mock.DEVICES as unknown as DeviceDto[])
      : requestList<DeviceDto>("/admin/devices"),

    updateDevice: (id: number, action: "APPROVE" | "BLOCK" | "REMOVE") => MOCK
      ? delay({ id } as unknown as DeviceDto)
      : request<DeviceDto>(`/admin/devices/${id}`, { method: "PUT", body: JSON.stringify({ action }) }),

    // ----- Student enrollment in a course/section -----
    enroll: (body: { courseId: number; sectionId: number; studentIds: number[] }) => MOCK
      ? delay({ enrolled: body.studentIds.length, skipped: 0 })
      : request<{ enrolled: number; skipped: number }>("/admin/enrollments", { method: "POST", body: JSON.stringify(body) }),

    enrolledStudentIds: (courseId: number, sectionId: number) => MOCK
      ? delay([] as number[])
      : request<number[]>(`/admin/enrollments?courseId=${courseId}&sectionId=${sectionId}`),
  },

  // ----- TEACHER -----
  teacher: {
    // The teacher's assigned course+section pairs (each can host a session).
    myAssignments: () => MOCK
      ? delay([] as TeacherCourseOption[])
      : requestList<TeacherCourseOption>("/teacher/courses"),

    listSessions: () => MOCK
      ? delay(mock.SESSIONS as unknown as TeacherSession[])
      : requestList<TeacherSession>("/teacher/attendance-sessions"),

    sessionLive: (sessionId: number): Promise<LiveCounters> => MOCK
      ? delay({ present: 38, absent: 7, late: 2, suspicious: 0, pendingReview: 0, total: 45 })
      : request<LiveCounters>(`/teacher/attendance-sessions/${sessionId}/live`),

    createSession: (body: { courseId: number; sectionId: number; sessionTitle?: string; requireLocation?: boolean }) => MOCK
      ? delay({ id: 999, sessionCode: "AS-NEW", status: "SCHEDULED" } as TeacherSession)
      // CODE_FACE = student types the code + face verification (no QR scanner
      // in the UI, no trusted-device requirement). Matches how students mark.
      : request<TeacherSession>("/teacher/attendance-sessions", { method: "POST", body: JSON.stringify({ ...body, verificationMode: "CODE_FACE" }) }),

    startSession: (id: number, body: { durationSeconds?: number; challengeType?: string }) => MOCK
      ? delay({ session: { id, status: "ACTIVE" } as TeacherSession, challenge: { challengeId: 1, sessionId: id, challengeCode: "G7Q4M2", challengeType: "CODE_QR", expiryTime: new Date(Date.now() + 60000).toISOString(), durationSeconds: 60 } } as StartResult)
      : request<StartResult>(`/teacher/attendance-sessions/${id}/start`, { method: "POST", body: JSON.stringify(body) }),

    nextChallenge: (id: number, body: { durationSeconds?: number; challengeType?: string }) => MOCK
      ? delay({ challengeId: Math.floor(Math.random() * 1000), sessionId: id, challengeCode: "ABC123", challengeType: "CODE_QR", expiryTime: new Date(Date.now() + 60000).toISOString(), durationSeconds: 60 } as ChallengeInfo)
      : request<ChallengeInfo>(`/teacher/attendance-sessions/${id}/challenges`, { method: "POST", body: JSON.stringify(body) }),

    closeSession: (id: number) => MOCK
      ? delay({ id, status: "CLOSED" } as TeacherSession)
      : request<TeacherSession>(`/teacher/attendance-sessions/${id}/close`, { method: "POST" }),

    deleteSession: (id: number) => MOCK
      ? delay(undefined)
      : request<void>(`/teacher/attendance-sessions/${id}`, { method: "DELETE" }),

    students: () => MOCK
      ? delay([] as TeacherStudentRow[])
      : requestList<TeacherStudentRow>("/teacher/students"),

    alerts: () => MOCK
      ? delay([] as TeacherAlertRow[])
      : requestList<TeacherAlertRow>("/teacher/alerts"),

    analytics: () => MOCK
      ? delay({ totalCourses: 0, totalStudents: 0, totalSessions: 0, activeSessions: 0, overallAttendancePct: 0, perClass: [] } as TeacherAnalytics)
      : request<TeacherAnalytics>("/teacher/analytics"),
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
        })) as StudentCourseSummary[])
      : requestList<StudentCourseSummary>("/student/courses"),

    availableClasses: () => MOCK
      ? delay([] as AvailableClass[])
      : requestList<AvailableClass>("/student/available-classes"),

    enrollSelf: (courseId: number, sectionId: number) => MOCK
      ? delay({ enrollmentId: Date.now(), courseId, courseCode: "", courseName: "", sectionId, sectionName: "" } as StudentCourseSummary)
      : request<StudentCourseSummary>("/student/enroll", { method: "POST", body: JSON.stringify({ courseId, sectionId }) }),

    unenrollSelf: (enrollmentId: number) => MOCK
      ? delay(undefined)
      : request<void>(`/student/enroll/${enrollmentId}`, { method: "DELETE" }),

    activeSessions: () => MOCK
      ? delay(mock.SESSIONS.filter(s => s.status === "ACTIVE") as unknown as StudentSession[])
      : requestList<StudentSession>("/student/active-sessions"),

    currentChallenge: (sessionId: number) => MOCK
      ? delay({ challengeId: 1, sessionId, challengeType: "CODE_QR", expiryTime: new Date(Date.now() + 60000).toISOString(), durationSeconds: 60 } as CurrentChallenge)
      : request<CurrentChallenge>(`/student/active-sessions/${sessionId}/current-challenge`),

    history: () => MOCK
      ? delay({ content: mock.STUDENT_HISTORY, totalElements: mock.STUDENT_HISTORY.length })
      : request<{ content: unknown[]; totalElements: number }>("/student/attendance/history"),

    percentage: () => MOCK
      ? delay({ overall: 87.5, perCourse: [] } as PercentageResult)
      : request<PercentageResult>("/student/attendance/percentage"),

    markAttendance: (body: {
      sessionId: number; challengeId: number;
      submittedCode?: string; qrToken?: string;
      faceImage?: string; deviceToken?: string;
      latitude?: number; longitude?: number; locationAccuracy?: number;
    }) => MOCK
      ? delay({
          recordId: Math.floor(Math.random() * 10000),
          status: "PRESENT",
          riskScore: 12,
          riskLevel: "LOW",
          faceConfidence: 0.94,
          factors: [],
          message: "Attendance marked.",
        } as MarkResult)
      : request<MarkResult>("/student/attendance/mark", { method: "POST", body: JSON.stringify(body) }),

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

  // ----- ANNOUNCEMENTS (read by all, posted by admin/teacher) -----
  announcements: {
    list: (): Promise<Announcement[]> => MOCK
      ? delay(MOCK_ANNOUNCEMENTS)
      : requestList<Announcement>("/announcements?size=50"),

    create: (body: NewAnnouncement): Promise<Announcement> => MOCK
      ? delay({ ...body, id: Math.floor(Math.random() * 100000), authorId: 1, authorName: "You", authorRole: "ADMIN", createdAt: new Date().toISOString() } as Announcement)
      : request<Announcement>("/announcements", { method: "POST", body: JSON.stringify(body) }),

    remove: (id: number): Promise<void> => MOCK
      ? delay(undefined)
      : request<void>(`/announcements/${id}`, { method: "DELETE" }),
  },
};
