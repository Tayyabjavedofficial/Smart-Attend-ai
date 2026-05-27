package com.attendai.domain.security;

import com.attendai.common.audit.Auditable;
import com.attendai.domain.user.Student;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "proxy_alerts",
        indexes = {
                @Index(name = "idx_alert_student", columnList = "student_id"),
                @Index(name = "idx_alert_session", columnList = "session_id"),
                @Index(name = "idx_alert_severity", columnList = "severity"),
                @Index(name = "idx_alert_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProxyAlert extends Auditable {

    public enum Severity { LOW, MEDIUM, HIGH, CRITICAL }

    public enum Status { OPEN, REVIEWED, RESOLVED, DISMISSED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "session_id")
    private Long sessionId;

    @Column(name = "challenge_id")
    private Long challengeId;

    @Column(name = "alert_type", length = 60)
    private String alertType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Severity severity;

    @Column(length = 500)
    private String description;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.OPEN;

    @Column(name = "resolution_note", length = 500)
    private String resolutionNote;
}
