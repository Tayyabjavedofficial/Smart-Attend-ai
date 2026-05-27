export type Role = "ADMIN" | "TEACHER" | "STUDENT";
export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED" | "PENDING_VERIFICATION";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string; details?: unknown };
  timestamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: User;
}

export interface DashboardCounters {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  activeSessionsNow?: number;
  totalSessionsToday?: number;
  overallAttendance: number;
  openProxyAlerts: number;
}

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "REJECTED"
  | "SUSPICIOUS"
  | "PENDING_REVIEW"
  | "MANUAL_PRESENT"
  | "EXCUSED";

export interface CourseSummary {
  enrollmentId: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  sectionId: number;
  sectionName: string;
}

export interface AttendanceHistoryRow {
  recordId: number;
  sessionId: number;
  courseCode: string;
  status: AttendanceStatus;
  markedAt: string;
  riskScore: number | null;
}
