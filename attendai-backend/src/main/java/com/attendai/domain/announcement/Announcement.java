package com.attendai.domain.announcement;

import com.attendai.common.audit.Auditable;
import com.attendai.domain.user.Role;
import jakarta.persistence.*;
import lombok.*;

/**
 * A campus announcement posted by an admin or teacher. {@link Audience} scopes
 * visibility; {@code pinned} floats important notices to the top of the feed.
 * Author name/role are stored denormalised so the feed renders without a join.
 */
@Entity
@Table(
        name = "announcements",
        indexes = {
                @Index(name = "idx_announcements_audience", columnList = "audience"),
                @Index(name = "idx_announcements_created", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Announcement extends Auditable {

    /** Who an announcement is targeted at. ALL is visible to every role. */
    public enum Audience { ALL, STUDENTS, TEACHERS }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Audience audience = Audience.ALL;

    @Column(nullable = false)
    @Builder.Default
    private boolean pinned = false;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(name = "author_name", nullable = false, length = 120)
    private String authorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "author_role", nullable = false, length = 20)
    private Role authorRole;
}
