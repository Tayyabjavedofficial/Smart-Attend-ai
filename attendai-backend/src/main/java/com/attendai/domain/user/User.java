package com.attendai.domain.user;

import com.attendai.common.audit.Auditable;
import jakarta.persistence.*;
import lombok.*;

/**
 * Authentication / identity record. One row per human, regardless of role.
 * Role-specific data lives in {@link Student}, {@link Teacher}, {@link Admin}.
 */
@Entity
@Table(
        name = "users",
        uniqueConstraints = @UniqueConstraint(name = "uk_users_email", columnNames = "email"),
        indexes = {
                @Index(name = "idx_users_role", columnList = "role"),
                @Index(name = "idx_users_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 200)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "last_login_at")
    private java.time.Instant lastLoginAt;

    @Column(columnDefinition = "TEXT")
    private String bio;

    // Base64 data URL of the user's avatar. MEDIUMTEXT to fit a compressed image.
    @Column(columnDefinition = "MEDIUMTEXT")
    private String avatar;

    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }
}
