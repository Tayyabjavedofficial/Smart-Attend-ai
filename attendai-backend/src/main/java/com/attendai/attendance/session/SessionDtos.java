package com.attendai.attendance.session;

import com.attendai.domain.attendance.AttendanceSession;
import com.attendai.domain.attendance.ChallengeType;
import com.attendai.domain.attendance.SessionStatus;
import com.attendai.domain.attendance.VerificationMode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class SessionDtos {

    private SessionDtos() {}

    public record CreateSessionRequest(
            @NotNull Long courseId,
            @NotNull Long sectionId,
            @Size(max = 200) String sessionTitle,
            VerificationMode verificationMode,
            Boolean requireLocation
    ) {}

    public record StartSessionRequest(
            @Min(10) @Max(600) Integer durationSeconds,
            ChallengeType challengeType
    ) {}

    public record NextChallengeRequest(
            @Min(10) @Max(600) Integer durationSeconds,
            ChallengeType challengeType
    ) {}

    public record SessionDto(
            Long id, String sessionCode, Long teacherId,
            Long courseId, String courseCode, String courseName,
            Long sectionId, String sectionName,
            String sessionTitle, SessionStatus status,
            VerificationMode verificationMode, Boolean requireLocation,
            Instant startTime, Instant endTime, Instant createdAt
    ) {
        public static SessionDto from(AttendanceSession s) {
            return new SessionDto(
                    s.getId(), s.getSessionCode(), s.getTeacher().getId(),
                    s.getCourse().getId(), s.getCourse().getCourseCode(), s.getCourse().getCourseName(),
                    s.getSection().getId(), s.getSection().getSectionName(),
                    s.getSessionTitle(), s.getStatus(), s.getVerificationMode(),
                    s.getRequireLocation(),
                    s.getStartTime(), s.getEndTime(), s.getCreatedAt()
            );
        }
    }

    public record ChallengeDto(
            Long challengeId,
            Long sessionId,
            String challengeCode,
            String qrToken,
            ChallengeType challengeType,
            Instant startTime,
            Instant expiryTime,
            Integer durationSeconds
    ) {}

    public record LiveCounters(
            int present, int absent, int late, int suspicious, int pendingReview, int total
    ) {}
}
