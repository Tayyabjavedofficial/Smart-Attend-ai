package com.attendai.domain.course;

import com.attendai.common.audit.Auditable;
import com.attendai.domain.user.Teacher;
import jakarta.persistence.*;
import lombok.*;

/**
 * Assigns a teacher to a specific (course, section) combination.
 */
@Entity
@Table(
        name = "teacher_courses",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_teacher_course_section",
                columnNames = {"teacher_id", "course_id", "section_id"}
        ),
        indexes = {
                @Index(name = "idx_tc_teacher", columnList = "teacher_id"),
                @Index(name = "idx_tc_course", columnList = "course_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherCourse extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;
}
