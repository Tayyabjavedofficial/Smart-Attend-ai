package com.attendai.domain.attendance;

import com.attendai.common.audit.Auditable;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "attendance_challenges",
        indexes = {
                @Index(name = "idx_chal_session", columnList = "session_id"),
                @Index(name = "idx_chal_status", columnList = "status"),
                @Index(name = "idx_chal_expiry", columnList = "expiry_time")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceChallenge extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private AttendanceSession session;

    @Column(name = "challenge_code", nullable = false, length = 12)
    private String challengeCode;

    @Column(name = "qr_token", nullable = false, length = 100)
    private String qrToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "challenge_type", nullable = false, length = 20)
    @Builder.Default
    private ChallengeType challengeType = ChallengeType.CODE_QR;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "expiry_time", nullable = false)
    private Instant expiryTime;

    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ChallengeStatus status = ChallengeStatus.ACTIVE;

    public boolean isExpired() {
        return Instant.now().isAfter(expiryTime) || status != ChallengeStatus.ACTIVE;
    }
}
