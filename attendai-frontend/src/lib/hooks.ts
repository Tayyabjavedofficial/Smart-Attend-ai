"use client";

import {
  useMutation, useQuery, useQueryClient,
  type UseMutationOptions, type UseQueryOptions,
} from "@tanstack/react-query";
import { api, ApiError, type AssignmentDto, type ProfilePatch } from "@/lib/api";
import type { StudentRow, TeacherRow, CourseRow, SectionRow } from "@/lib/mockData";
import type { Announcement, NewAnnouncement } from "@/types/api";

/**
 * Centralised query-key tree. Keeping these as constants prevents the
 * "stringly-typed cache" trap where invalidations and queries don't match.
 */
export const qk = {
  admin: {
    dashboard: ["admin", "dashboard"] as const,
    students: ["admin", "students"] as const,
    pendingStudents: ["admin", "students", "pending"] as const,
    teachers: ["admin", "teachers"] as const,
    courses:  ["admin", "courses"]  as const,
    sections: ["admin", "sections"] as const,
    alerts:   ["admin", "alerts"]   as const,
    devices:  ["admin", "devices"]  as const,
    assignments: ["admin", "assignments"] as const,
  },
  teacher: {
    courses:  ["teacher", "courses"]  as const,
    sessions: ["teacher", "sessions"] as const,
    students: ["teacher", "students"] as const,
    alerts:   ["teacher", "alerts"]   as const,
    analytics:["teacher", "analytics"] as const,
    sessionLive: (id: number) => ["teacher", "sessions", id, "live"] as const,
  },
  student: {
    courses: ["student", "courses"] as const,
    available: ["student", "available-classes"] as const,
    active:  ["student", "active-sessions"] as const,
    history: ["student", "history"] as const,
    percentage: ["student", "percentage"] as const,
  },
} as const;

// ============================================================
// Admin
// ============================================================

export function useAdminDashboard() {
  return useQuery({
    queryKey: qk.admin.dashboard,
    queryFn: api.admin.dashboard,
  });
}

// ============================================================
// Current user (self-service account)
// ============================================================

export const qkMe = ["me"] as const;

export function useProfile() {
  return useQuery({ queryKey: qkMe, queryFn: api.me.profile });
}

export function useUpdateProfile(opts?: UseMutationOptions<Awaited<ReturnType<typeof api.me.updateProfile>>, ApiError, ProfilePatch>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => api.me.updateProfile(patch),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: qkMe });
      opts?.onSuccess?.(...args);
    },
    ...opts,
  });
}

export function useChangePassword(opts?: UseMutationOptions<void, ApiError, { currentPassword: string; newPassword: string }>) {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }) => api.me.changePassword(currentPassword, newPassword),
    ...opts,
  });
}

export function useStudents() {
  return useQuery({
    queryKey: qk.admin.students,
    queryFn: api.admin.listStudents,
  });
}

export function usePendingStudents() {
  return useQuery({
    queryKey: qk.admin.pendingStudents,
    queryFn: api.admin.listPendingStudents,
  });
}

export function useTeachers() {
  return useQuery({ queryKey: qk.admin.teachers, queryFn: api.admin.listTeachers });
}

export function useCourses() {
  return useQuery({ queryKey: qk.admin.courses, queryFn: api.admin.listCourses });
}

export function useSections() {
  return useQuery({ queryKey: qk.admin.sections, queryFn: api.admin.listSections });
}

export function useProxyAlerts() {
  return useQuery({ queryKey: qk.admin.alerts, queryFn: api.admin.listAlerts });
}

export function useDevices() {
  return useQuery({ queryKey: qk.admin.devices, queryFn: api.admin.listDevices });
}

/** Generic helper to bake invalidation into every CRUD mutation. */
function useInvalidating<TVars, TData>(
  fn: (vars: TVars) => Promise<TData>,
  invalidateKey: readonly unknown[],
  options?: UseMutationOptions<TData, ApiError, TVars>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: invalidateKey });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export const useCreateStudent = (opts?: UseMutationOptions<StudentRow, ApiError, Partial<StudentRow> & { password?: string }>) =>
  useInvalidating(api.admin.createStudent, qk.admin.students, opts);

export const useUpdateStudent = (opts?: UseMutationOptions<StudentRow, ApiError, { id: number; patch: Partial<StudentRow> }>) =>
  useInvalidating(
    ({ id, patch }) => api.admin.updateStudent(id, patch),
    qk.admin.students,
    opts,
  );

export const useDeactivateStudent = (opts?: UseMutationOptions<unknown, ApiError, number>) =>
  useInvalidating(api.admin.deactivateStudent, qk.admin.students, opts);

export const useCreateTeacher = (opts?: UseMutationOptions<TeacherRow, ApiError, Partial<TeacherRow> & { password?: string }>) =>
  useInvalidating(api.admin.createTeacher, qk.admin.teachers, opts);

export const useUpdateTeacher = (opts?: UseMutationOptions<TeacherRow, ApiError, { id: number; patch: Partial<TeacherRow> }>) =>
  useInvalidating(
    ({ id, patch }) => api.admin.updateTeacher(id, patch),
    qk.admin.teachers,
    opts,
  );

export const useDeactivateTeacher = (opts?: UseMutationOptions<unknown, ApiError, number>) =>
  useInvalidating(api.admin.deactivateTeacher, qk.admin.teachers, opts);

export const useCreateCourse = (opts?: UseMutationOptions<CourseRow, ApiError, Partial<CourseRow>>) =>
  useInvalidating(api.admin.createCourse, qk.admin.courses, opts);

export const useUpdateCourse = (opts?: UseMutationOptions<CourseRow, ApiError, { id: number; patch: Partial<CourseRow> }>) =>
  useInvalidating(
    ({ id, patch }) => api.admin.updateCourse(id, patch),
    qk.admin.courses,
    opts,
  );

export const useDeleteCourse = (opts?: UseMutationOptions<unknown, ApiError, number>) =>
  useInvalidating(api.admin.deleteCourse, qk.admin.courses, opts);

export const useCreateSection = (opts?: UseMutationOptions<SectionRow, ApiError, Partial<SectionRow>>) =>
  useInvalidating(api.admin.createSection, qk.admin.sections, opts);

export const useDeleteSection = (opts?: UseMutationOptions<unknown, ApiError, number>) =>
  useInvalidating(api.admin.deleteSection, qk.admin.sections, opts);

export function useAssignments() {
  return useQuery({ queryKey: qk.admin.assignments, queryFn: api.admin.listAssignments });
}

export const useCreateAssignment = (opts?: UseMutationOptions<AssignmentDto, ApiError, { teacherId: number; courseId: number; sectionId: number }>) =>
  useInvalidating(api.admin.createAssignment, qk.admin.assignments, opts);

export const useDeleteAssignment = (opts?: UseMutationOptions<unknown, ApiError, number>) =>
  useInvalidating(api.admin.deleteAssignment, qk.admin.assignments, opts);

export const useResolveAlert = (opts?: UseMutationOptions<unknown, ApiError, { id: number; status: "RESOLVED" | "DISMISSED"; note?: string }>) =>
  useInvalidating(
    ({ id, status, note }) => api.admin.resolveAlert(id, status, note),
    qk.admin.alerts,
    opts,
  );

export const useUpdateDevice = (opts?: UseMutationOptions<unknown, ApiError, { id: number; action: "APPROVE" | "BLOCK" | "REMOVE" }>) =>
  useInvalidating(
    ({ id, action }) => api.admin.updateDevice(id, action),
    qk.admin.devices,
    opts,
  );

// ============================================================
// Teacher
// ============================================================

export function useTeacherCourses() {
  return useQuery({ queryKey: qk.teacher.courses, queryFn: api.teacher.myAssignments });
}

export function useTeacherSessions() {
  return useQuery({ queryKey: qk.teacher.sessions, queryFn: api.teacher.listSessions });
}

export function useTeacherStudents() {
  return useQuery({ queryKey: qk.teacher.students, queryFn: api.teacher.students });
}
export function useTeacherAlerts() {
  return useQuery({ queryKey: qk.teacher.alerts, queryFn: api.teacher.alerts });
}
export function useTeacherAnalytics() {
  return useQuery({ queryKey: qk.teacher.analytics, queryFn: api.teacher.analytics });
}

export function useSessionLive(sessionId: number | null) {
  return useQuery({
    queryKey: sessionId ? qk.teacher.sessionLive(sessionId) : ["teacher", "sessions", "no-id", "live"],
    queryFn: () => api.teacher.sessionLive(sessionId!),
    enabled: sessionId != null,
  });
}

// ============================================================
// Student
// ============================================================

export function useMyCourses() {
  return useQuery({ queryKey: qk.student.courses, queryFn: api.student.myCourses });
}

export function useAvailableClasses() {
  return useQuery({ queryKey: qk.student.available, queryFn: api.student.availableClasses });
}

export function useEnrollSelf(opts?: UseMutationOptions<Awaited<ReturnType<typeof api.student.enrollSelf>>, ApiError, { courseId: number; sectionId: number }>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sectionId }: { courseId: number; sectionId: number }) => api.student.enrollSelf(courseId, sectionId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: qk.student.courses });
      qc.invalidateQueries({ queryKey: qk.student.available });
      qc.invalidateQueries({ queryKey: qk.student.active });
      opts?.onSuccess?.(...args);
    },
    ...opts,
  });
}

export function useUnenrollSelf(opts?: UseMutationOptions<void, ApiError, number>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: number) => api.student.unenrollSelf(enrollmentId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: qk.student.courses });
      qc.invalidateQueries({ queryKey: qk.student.available });
      opts?.onSuccess?.(...args);
    },
    ...opts,
  });
}

export function useActiveSessions() {
  return useQuery({
    queryKey: qk.student.active,
    queryFn: api.student.activeSessions,
    refetchInterval: 15_000,                     // poll: cheap and good enough
  });
}

export function useHistory() {
  return useQuery({ queryKey: qk.student.history, queryFn: api.student.history });
}

export function usePercentage() {
  return useQuery({ queryKey: qk.student.percentage, queryFn: api.student.percentage });
}

export const useRegisterFace = (opts?: UseMutationOptions<Awaited<ReturnType<typeof api.student.registerFace>>, ApiError, string[]>) =>
  useMutation({ mutationFn: (images: string[]) => api.student.registerFace(images), ...opts });

// ============================================================
// Announcements (shared across all roles)
// ============================================================

export const qkAnnouncements = ["announcements"] as const;

export function useAnnouncements() {
  return useQuery({ queryKey: qkAnnouncements, queryFn: api.announcements.list });
}

export const useCreateAnnouncement = (opts?: UseMutationOptions<Announcement, ApiError, NewAnnouncement>) =>
  useInvalidating(api.announcements.create, qkAnnouncements, opts);

export const useDeleteAnnouncement = (opts?: UseMutationOptions<void, ApiError, number>) =>
  useInvalidating(api.announcements.remove, qkAnnouncements, opts);

export const useMarkAttendance = (opts?: UseMutationOptions<unknown, ApiError, Parameters<typeof api.student.markAttendance>[0]>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.student.markAttendance,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: qk.student.history });
      qc.invalidateQueries({ queryKey: qk.student.percentage });
      qc.invalidateQueries({ queryKey: qk.student.active });
      opts?.onSuccess?.(...args);
    },
    ...opts,
  });
};
