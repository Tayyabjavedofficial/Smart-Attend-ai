package com.attendai.modules.student;

import com.attendai.attendance.marking.AttendanceMarkingService;
import com.attendai.attendance.marking.MarkingDtos.MarkAttendanceRequest;
import com.attendai.attendance.marking.MarkingDtos.MarkAttendanceResponse;
import com.attendai.attendance.session.SessionDtos.SessionDto;
import com.attendai.ai.AiServiceClient;
import com.attendai.common.exception.ApiException;
import com.attendai.common.response.ApiResponse;
import com.attendai.common.response.PageResponse;
import com.attendai.common.util.SecurityUtils;
import com.attendai.domain.attendance.AttendanceChallenge;
import com.attendai.domain.attendance.AttendanceChallengeRepository;
import com.attendai.domain.attendance.AttendanceSession;
import com.attendai.domain.attendance.AttendanceSessionRepository;
import com.attendai.domain.attendance.ChallengeStatus;
import com.attendai.domain.attendance.SessionStatus;
import com.attendai.domain.course.StudentCourseRepository;
import com.attendai.modules.student.StudentService.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
@Tag(name = "Student - Self-Service")
public class StudentController {

    private final StudentService studentService;
    private final AttendanceMarkingService markingService;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceChallengeRepository challengeRepository;
    private final StudentCourseRepository studentCourseRepository;
    private final com.attendai.ai.AiServiceClient aiServiceClient;

    @GetMapping("/courses")
    @Operation(summary = "List enrolled courses (API-STUDENT-01)")
    public ApiResponse<List<CourseSummary>> myCourses() {
        return ApiResponse.ok(studentService.myCourses());
    }

    @GetMapping("/active-sessions")
    @Operation(summary = "Active sessions for the student's courses (API-STUDENT-02)")
    @Transactional(readOnly = true)
    public ApiResponse<List<SessionDto>> activeSessions() {
        Long studentId = studentService.currentStudent().getId();

        // Build the (courseId, sectionId) tuples the student is enrolled in.
        Set<String> enrolledKeys = studentCourseRepository.findByStudentId(studentId).stream()
                .map(sc -> sc.getCourse().getId() + ":" + sc.getSection().getId())
                .collect(Collectors.toSet());

        List<SessionDto> result = sessionRepository.findByStatus(SessionStatus.ACTIVE).stream()
                .filter(s -> enrolledKeys.contains(s.getCourse().getId() + ":" + s.getSection().getId()))
                .map(SessionDto::from)
                .toList();
        return ApiResponse.ok(result);
    }

    @GetMapping("/active-sessions/{sessionId}/current-challenge")
    @Operation(summary = "Current open challenge for a session (student-facing; omits the code)")
    @Transactional(readOnly = true)
    public ApiResponse<CurrentChallengeDto> currentChallenge(@PathVariable Long sessionId) {
        var now = java.time.Instant.now();
        AttendanceChallenge active = challengeRepository.findBySessionIdOrderByStartTimeDesc(sessionId).stream()
                .filter(c -> c.getStatus() == ChallengeStatus.ACTIVE && c.getExpiryTime().isAfter(now))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NO_ACTIVE_CHALLENGE",
                        "No active challenge right now — ask your teacher to start one."));
        // Deliberately does NOT expose challengeCode; the student must type the
        // code the teacher displays. challengeId is what the mark call needs.
        return ApiResponse.ok(new CurrentChallengeDto(
                active.getId(), sessionId, active.getChallengeType().name(),
                active.getExpiryTime(), active.getDurationSeconds()));
    }

    public record CurrentChallengeDto(
            Long challengeId, Long sessionId, String challengeType,
            java.time.Instant expiryTime, Integer durationSeconds
    ) {}

    @PostMapping("/attendance/mark")
    @Operation(summary = "Submit attendance attempt (API-STUDENT-03)")
    public ApiResponse<MarkAttendanceResponse> mark(
            @Valid @RequestBody MarkAttendanceRequest req,
            HttpServletRequest http
    ) {
        Long userId = SecurityUtils.currentUserId();
        return ApiResponse.ok(markingService.mark(userId, req, http.getRemoteAddr(), http.getHeader("User-Agent")));
    }

    @GetMapping("/attendance/history")
    @Operation(summary = "Paged attendance history (API-STUDENT-07)")
    public ApiResponse<PageResponse<AttendanceHistoryRow>> history(Pageable pageable) {
        return ApiResponse.ok(PageResponse.from(studentService.history(pageable)));
    }

    @GetMapping("/attendance/percentage")
    @Operation(summary = "Overall + per-course attendance percentage (API-STUDENT-08)")
    public ApiResponse<PercentageResult> percentage() {
        return ApiResponse.ok(studentService.percentage());
    }

    @PostMapping("/device/register")
    @Operation(summary = "Register a trusted device (API-STUDENT-06)")
    public ResponseEntity<ApiResponse<DeviceRegisterResponse>> registerDevice(
            @Valid @RequestBody DeviceRegisterRequest req,
            HttpServletRequest http
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(studentService.registerDevice(req, http.getRemoteAddr())));
    }

    // ---- Phase 5: face register / verify via AI service ----

    @PostMapping("/face/register")
    @Operation(summary = "Register face profile (API-STUDENT-04)")
    public ApiResponse<AiServiceClient.FaceRegisterResponse> registerFace(
            @Valid @RequestBody FaceRegisterRequest req
    ) {
        Long studentId = studentService.currentStudent().getId();
        var resp = aiServiceClient.registerFace(studentId, req.images());
        // Persist a row in the face_profiles table so the marking pipeline's
        // "has a face profile?" check passes.
        studentService.recordFaceProfile(studentId, resp.profileId());
        return ApiResponse.ok(resp);
    }

    @PostMapping("/face/verify")
    @Operation(summary = "Verify face stand-alone (API-STUDENT-05)")
    public ApiResponse<AiServiceClient.FaceVerifyResponse> verifyFace(
            @Valid @RequestBody FaceVerifyRequest req
    ) {
        Long studentId = studentService.currentStudent().getId();
        return ApiResponse.ok(aiServiceClient.verifyFace(studentId, req.image()));
    }

    public record FaceRegisterRequest(@jakarta.validation.constraints.NotEmpty List<String> images) {}
    public record FaceVerifyRequest(@jakarta.validation.constraints.NotBlank String image) {}
}
