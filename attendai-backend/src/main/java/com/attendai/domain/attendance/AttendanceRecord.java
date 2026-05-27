package com.attendai.domain.attendance;

import com.attendai.common.audit.Auditable;
import com.attendai.domain.user.Student;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Final attendance result per (challenge, student). Unique constraint
 * enforces that a student can have at most one accepted record per challenge.
 */
@Entity
@Table(
        name = "attendance_records",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_record_challenge_student",
                columnNames = {"challenge_id", "student_id"}
        ),
        indexes = {
                @Index(name = "idx_rec_session", columnList = "session_id"),
                @Index(name = "idx_rec_student", columnList = "student_id"),
                @Index(name = "idx_rec_marked_at", columnList = "marked_at"),
                @Index(name = "idx_rec_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecord extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private AttendanceSession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "challenge_id", nullable = false)
    private AttendanceChallenge challenge;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "device_id")
    private Long deviceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AttendanceStatus status;

    @Column(name = "marked_at", nullable = false)
    private Instant markedAt;

    @Column(name = "code_verified")
    private Boolean codeVerified;

    @Column(name = "qr_verified")
    private Boolean qrVerified;

    @Column(name = "face_verified")
    private Boolean faceVerified;

    @Column(name = "device_verified")
    private Boolean deviceVerified;

    @Column(name = "face_confidence")
    private Double faceConfidence;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(length = 500)
    private String remarks;
}
