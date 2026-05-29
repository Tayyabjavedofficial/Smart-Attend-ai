package com.attendai.modules.teacher;

import com.attendai.common.response.ApiResponse;
import com.attendai.common.util.SecurityUtils;
import com.attendai.domain.attendance.AttendanceRecord;
import com.attendai.domain.attendance.AttendanceRecordRepository;
import com.attendai.domain.attendance.AttendanceSession;
import com.attendai.domain.attendance.AttendanceSessionRepository;
import com.attendai.domain.attendance.AttendanceStatus;
import com.attendai.domain.attendance.SessionStatus;
import com.attendai.domain.course.StudentCourse;
import com.attendai.domain.course.StudentCourseRepository;
import com.attendai.domain.course.TeacherCourse;
import com.attendai.domain.course.TeacherCourseRepository;
import com.attendai.domain.security.ProxyAlert;
import com.attendai.domain.security.ProxyAlertRepository;
import com.attendai.domain.user.TeacherRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Read-only insights for the teacher panel: the students they teach, proxy
 * alerts on their sessions, and a small analytics summary. All scoped to the
 * authenticated teacher.
 */
public class TeacherInsightsModule {

    public record TeacherStudentRow(
            Long studentId, String fullName, String email, String registrationNumber,
            String courseCode, String courseName, String sectionName
    ) {}

    public record TeacherAlertRow(
            Long id, Long studentId, Long sessionId, String alertType,
            String severity, String description, Integer riskScore, String status, Instant createdAt
    ) {}

    public record CourseStat(
            String courseCode, String courseName, String sectionName,
            int students, int sessions, int present, int total, double attendancePct
    ) {}

    public record Analytics(
            int totalCourses, int totalStudents, int totalSessions, int activeSessions,
            double overallAttendancePct, List<CourseStat> perClass
    ) {}

    @Service
    @RequiredArgsConstructor
    public static class TeacherInsightsService {

        private final TeacherRepository teacherRepository;
        private final TeacherCourseRepository teacherCourseRepository;
        private final StudentCourseRepository studentCourseRepository;
        private final AttendanceSessionRepository sessionRepository;
        private final AttendanceRecordRepository attendanceRecordRepository;
        private final ProxyAlertRepository proxyAlertRepository;

        private Long teacherId() {
            Long userId = SecurityUtils.currentUserId();
            return teacherRepository.findByUserId(userId).orElseThrow().getId();
        }

        @Transactional(readOnly = true)
        public List<TeacherStudentRow> students() {
            List<TeacherStudentRow> rows = new ArrayList<>();
            for (TeacherCourse tc : teacherCourseRepository.findByTeacherId(teacherId())) {
                for (StudentCourse sc : studentCourseRepository.findByCourseIdAndSectionId(
                        tc.getCourse().getId(), tc.getSection().getId())) {
                    rows.add(new TeacherStudentRow(
                            sc.getStudent().getId(),
                            sc.getStudent().getUser().getFullName(),
                            sc.getStudent().getUser().getEmail(),
                            sc.getStudent().getRegistrationNumber(),
                            tc.getCourse().getCourseCode(),
                            tc.getCourse().getCourseName(),
                            tc.getSection().getSectionName()));
                }
            }
            return rows;
        }

        @Transactional(readOnly = true)
        public List<TeacherAlertRow> alerts() {
            Set<Long> sessionIds = mySessions().stream().map(AttendanceSession::getId).collect(Collectors.toSet());
            if (sessionIds.isEmpty()) return List.of();
            return proxyAlertRepository.findAll().stream()
                    .filter(a -> a.getSessionId() != null && sessionIds.contains(a.getSessionId()))
                    .map(a -> new TeacherAlertRow(
                            a.getId(), a.getStudent().getId(), a.getSessionId(), a.getAlertType(),
                            a.getSeverity().name(), a.getDescription(), a.getRiskScore(),
                            a.getStatus().name(), a.getCreatedAt()))
                    .toList();
        }

        @Transactional(readOnly = true)
        public Analytics analytics() {
            var assignments = teacherCourseRepository.findByTeacherId(teacherId());
            var sessions = mySessions();

            // Group sessions by course+section.
            Map<String, List<AttendanceSession>> sessionsByClass = new LinkedHashMap<>();
            for (AttendanceSession s : sessions) {
                String key = s.getCourse().getId() + ":" + s.getSection().getId();
                sessionsByClass.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
            }

            List<CourseStat> perClass = new ArrayList<>();
            int totalPresent = 0, totalAll = 0;
            Set<Long> distinctStudents = new java.util.HashSet<>();
            Set<Long> distinctCourses = new java.util.HashSet<>();

            for (TeacherCourse tc : assignments) {
                distinctCourses.add(tc.getCourse().getId());
                String key = tc.getCourse().getId() + ":" + tc.getSection().getId();
                var classSessions = sessionsByClass.getOrDefault(key, List.of());

                int students = 0;
                for (StudentCourse sc : studentCourseRepository.findByCourseIdAndSectionId(
                        tc.getCourse().getId(), tc.getSection().getId())) {
                    students++;
                    distinctStudents.add(sc.getStudent().getId());
                }

                int present = 0, total = 0;
                for (AttendanceSession s : classSessions) {
                    for (AttendanceRecord r : attendanceRecordRepository.findBySessionIdOrderByMarkedAtDesc(s.getId())) {
                        total++;
                        if (isPresentLike(r.getStatus())) present++;
                    }
                }
                totalPresent += present; totalAll += total;
                double pct = total == 0 ? 0.0 : Math.round(1000.0 * present / total) / 10.0;
                perClass.add(new CourseStat(
                        tc.getCourse().getCourseCode(), tc.getCourse().getCourseName(),
                        tc.getSection().getSectionName(), students, classSessions.size(),
                        present, total, pct));
            }

            int activeSessions = (int) sessions.stream().filter(s -> s.getStatus() == SessionStatus.ACTIVE).count();
            double overall = totalAll == 0 ? 0.0 : Math.round(1000.0 * totalPresent / totalAll) / 10.0;
            return new Analytics(distinctCourses.size(), distinctStudents.size(), sessions.size(),
                    activeSessions, overall, perClass);
        }

        private List<AttendanceSession> mySessions() {
            return sessionRepository.findByTeacherIdOrderByStartTimeDesc(teacherId(), Pageable.unpaged()).getContent();
        }

        private boolean isPresentLike(AttendanceStatus s) {
            return s == AttendanceStatus.PRESENT || s == AttendanceStatus.LATE
                    || s == AttendanceStatus.MANUAL_PRESENT || s == AttendanceStatus.EXCUSED;
        }
    }

    @RestController
    @RequestMapping("/api/teacher")
    @RequiredArgsConstructor
    @PreAuthorize("hasRole('TEACHER')")
    @Tag(name = "Teacher - Insights")
    public static class TeacherInsightsController {

        private final TeacherInsightsService service;

        @GetMapping("/students")
        @Operation(summary = "Students across the teacher's assigned classes")
        public ApiResponse<List<TeacherStudentRow>> students() {
            return ApiResponse.ok(service.students());
        }

        @GetMapping("/alerts")
        @Operation(summary = "Proxy alerts raised on the teacher's sessions")
        public ApiResponse<List<TeacherAlertRow>> alerts() {
            return ApiResponse.ok(service.alerts());
        }

        @GetMapping("/analytics")
        @Operation(summary = "Attendance analytics summary for the teacher")
        public ApiResponse<Analytics> analytics() {
            return ApiResponse.ok(service.analytics());
        }
    }
}
