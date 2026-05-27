package com.attendai.attendance.marking;

import com.attendai.domain.attendance.AttendanceStatus;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public final class MarkingDtos {

    private MarkingDtos() {}

    public record MarkAttendanceRequest(
            @NotNull Long sessionId,
            @NotNull Long challengeId,
            String submittedCode,
            String qrToken,
            String faceImage,
            String deviceToken
    ) {}

    public record MarkAttendanceResponse(
            Long recordId,
            AttendanceStatus status,
            int riskScore,
            String riskLevel,
            Double faceConfidence,
            List<String> factors,
            Instant markedAt,
            String message
    ) {}
}
