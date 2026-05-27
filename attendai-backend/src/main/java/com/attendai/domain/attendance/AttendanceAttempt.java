package com.attendai.domain.attendance;

import com.attendai.common.audit.Auditable;
import com.attendai.domain.user.Student;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Audit trail of every attendance attempt: successful and failed. Used by
 * the AI risk-scoring service to detect proxy patterns over time.
 */
@Entity
@Table(
        name = "attendance_attempts",
        indexes = {
                @Index(name = "idx_att_challenge", columnList = "challenge_id"),
                @Index(name = "idx_att_student", columnList = "student_id"),
                @Index(name = "idx_att_result", columnList = "result"),
                @Index(name = "idx_att_attempted_at", columnList = "attempted_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceAttempt extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "challenge_id", nullable = false)
    private AttendanceChallenge challenge;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "device_id")
    private Long deviceId;

    @Column(name = "attempted_at", nullable = false)
    private Instant attemptedAt;

    @Column(name = "submitted_code", length = 12)
    private String submittedCode;

    @Column(name = "submitted_qr_token", length = 100)
    private String submittedQrToken;

    @Column(name = "face_confidence")
    private Double faceConfidence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AttemptResult result;

    @Column(name = "failure_reason", length = 200)
    private String failureReason;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 300)
    private String userAgent;
}
