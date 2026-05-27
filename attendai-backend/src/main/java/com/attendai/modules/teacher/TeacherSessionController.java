package com.attendai.modules.teacher;

import com.attendai.attendance.marking.AttendanceMarkingService;
import com.attendai.attendance.realtime.SessionEventPublisher.LiveCounters;
import com.attendai.attendance.session.SessionDtos.*;
import com.attendai.attendance.session.SessionLifecycleService;
import com.attendai.common.response.ApiResponse;
import com.attendai.common.response.PageResponse;
import com.attendai.common.util.SecurityUtils;
import com.attendai.domain.attendance.AttendanceSessionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teacher/attendance-sessions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
@Tag(name = "Teacher - Attendance Sessions")
public class TeacherSessionController {

    private final SessionLifecycleService lifecycleService;
    private final AttendanceMarkingService markingService;
    private final AttendanceSessionRepository sessionRepository;

    @PostMapping
    @Operation(summary = "Create a new attendance session (API-TEACHER-02)")
    public ResponseEntity<ApiResponse<SessionDto>> create(@Valid @RequestBody CreateSessionRequest req) {
        SessionDto dto = lifecycleService.create(SecurityUtils.currentUserId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(dto));
    }

    @PostMapping("/{id}/start")
    @Operation(summary = "Start session and issue the first challenge (API-TEACHER-03)")
    public ApiResponse<SessionLifecycleService.StartResult> start(
            @PathVariable Long id,
            @Valid @RequestBody StartSessionRequest req
    ) {
        return ApiResponse.ok(lifecycleService.start(SecurityUtils.currentUserId(), id, req));
    }

    @PostMapping("/{id}/challenges")
    @Operation(summary = "Generate a random challenge inside an active session (API-TEACHER-04)")
    public ApiResponse<ChallengeDto> nextChallenge(
            @PathVariable Long id,
            @Valid @RequestBody NextChallengeRequest req
    ) {
        return ApiResponse.ok(lifecycleService.nextChallenge(SecurityUtils.currentUserId(), id, req));
    }

    @PostMapping("/{id}/close")
    @Operation(summary = "Close the session (API-TEACHER-05)")
    public ApiResponse<SessionDto> close(@PathVariable Long id) {
        return ApiResponse.ok(lifecycleService.close(SecurityUtils.currentUserId(), id));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one session")
    public ApiResponse<SessionDto> get(@PathVariable Long id) {
        return ApiResponse.ok(lifecycleService.get(SecurityUtils.currentUserId(), id));
    }

    @GetMapping("/{id}/live")
    @Operation(summary = "Live counters for the session (API-TEACHER-06)")
    public ApiResponse<LiveCounters> live(@PathVariable Long id) {
        // Authorisation: confirm the session belongs to this teacher.
        lifecycleService.get(SecurityUtils.currentUserId(), id);
        return ApiResponse.ok(markingService.computeLiveCounters(id));
    }

    @GetMapping
    @Operation(summary = "List teacher's sessions, most recent first")
    @Transactional(readOnly = true)
    public ApiResponse<PageResponse<SessionDto>> list(Pageable pageable) {
        // We use the lifecycle service for the auth + ownership boundary but
        // the list query itself is straightforward.
        Long userId = SecurityUtils.currentUserId();
        Long teacherId = lifecycleService.requireTeacher(userId).getId();
        return ApiResponse.ok(PageResponse.from(
                sessionRepository.findByTeacherIdOrderByStartTimeDesc(teacherId, pageable),
                SessionDto::from));
    }
}
