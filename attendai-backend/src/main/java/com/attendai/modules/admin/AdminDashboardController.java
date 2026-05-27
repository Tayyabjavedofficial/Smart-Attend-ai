package com.attendai.modules.admin;

import com.attendai.common.response.ApiResponse;
import com.attendai.domain.attendance.AttendanceSessionRepository;
import com.attendai.domain.attendance.SessionStatus;
import com.attendai.domain.course.CourseRepository;
import com.attendai.domain.security.ProxyAlert;
import com.attendai.domain.security.ProxyAlertRepository;
import com.attendai.domain.user.StudentRepository;
import com.attendai.domain.user.TeacherRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Dashboard")
public class AdminDashboardController {

    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final CourseRepository courseRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final ProxyAlertRepository proxyAlertRepository;

    @GetMapping
    @Operation(summary = "Aggregate counters for the admin home page (API-ADMIN-01)")
    public ApiResponse<Map<String, Object>> dashboard() {
        long openAlerts = proxyAlertRepository
                .findByStatus(ProxyAlert.Status.OPEN, PageRequest.of(0, 1))
                .getTotalElements();
        long activeSessions = sessionRepository.findByStatus(SessionStatus.ACTIVE).size();

        return ApiResponse.ok(Map.of(
                "totalStudents", studentRepository.count(),
                "totalTeachers", teacherRepository.count(),
                "totalCourses", courseRepository.count(),
                "activeSessionsNow", activeSessions,
                "overallAttendance", 0.0,        // TODO Phase 4: compute from attendance_records
                "openProxyAlerts", openAlerts
        ));
    }
}
