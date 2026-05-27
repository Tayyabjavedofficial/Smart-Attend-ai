package com.attendai.domain.course;

import com.attendai.common.audit.Auditable;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "courses",
        uniqueConstraints = @UniqueConstraint(name = "uk_courses_code", columnNames = "course_code")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_code", nullable = false, length = 20)
    private String courseCode;

    @Column(name = "course_name", nullable = false, length = 120)
    private String courseName;

    @Column(name = "credit_hours")
    private Integer creditHours;

    @Column(length = 80)
    private String department;
}
