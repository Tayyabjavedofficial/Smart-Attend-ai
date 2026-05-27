package com.attendai.domain.attendance;

import com.attendai.common.audit.Auditable;
import com.attendai.domain.course.Course;
import com.attendai.domain.course.Section;
import com.attendai.domain.user.Teacher;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "attendance_sessions",
        uniqueConstraints = @UniqueConstraint(name = "uk_session_code", columnNames = "session_code"),
        indexes = {
                @Index(name = "idx_sess_teacher", columnList = "teacher_id"),
                @Index(name = "idx_sess_course", columnList = "course_id"),
                @Index(name = "idx_sess_status", columnList = "status"),
                @Index(name = "idx_sess_start", columnList = "start_time")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceSession extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_code", nullable = false, length = 40)
    private String sessionCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @Column(name = "session_title", length = 200)
    private String sessionTitle;

    @Column(name = "start_time")
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private SessionStatus status = SessionStatus.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_mode", nullable = false, length = 30)
    @Builder.Default
    private VerificationMode verificationMode = VerificationMode.QR_FACE_DEVICE;

    public boolean isActive() {
        return status == SessionStatus.ACTIVE;
    }
}
