package com.attendai.domain.course;

import com.attendai.common.audit.Auditable;
import com.attendai.domain.user.Student;
import jakarta.persistence.*;
import lombok.*;

/**
 * Join table for student enrollment in a (course, section) tuple.
 */
@Entity
@Table(
        name = "student_courses",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_student_course_section",
                columnNames = {"student_id", "course_id", "section_id"}
        ),
        indexes = {
                @Index(name = "idx_sc_student", columnList = "student_id"),
                @Index(name = "idx_sc_course", columnList = "course_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentCourse extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;
}
