package com.attendai.domain.security;

import com.attendai.common.audit.Auditable;
import com.attendai.domain.user.Student;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "trusted_devices",
        uniqueConstraints = @UniqueConstraint(name = "uk_device_token", columnNames = "device_token"),
        indexes = {
                @Index(name = "idx_device_student", columnList = "student_id"),
                @Index(name = "idx_device_token", columnList = "device_token")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrustedDevice extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "device_token", nullable = false, length = 100)
    private String deviceToken;

    @Column(name = "device_name", length = 120)
    private String deviceName;

    @Column(name = "browser_info", length = 300)
    private String browserInfo;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(nullable = false)
    @Builder.Default
    private Boolean trusted = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean blocked = false;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;
}
