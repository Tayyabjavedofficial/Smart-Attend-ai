package com.attendai.domain.user;

import com.attendai.common.audit.Auditable;
import com.attendai.domain.course.Section;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "students",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_students_user_id", columnNames = "user_id"),
                @UniqueConstraint(name = "uk_students_reg_no", columnNames = "registration_number")
        },
        indexes = {
                @Index(name = "idx_students_section", columnList = "section_id"),
                @Index(name = "idx_students_department", columnList = "department")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "registration_number", nullable = false, length = 50)
    private String registrationNumber;

    @Column(length = 80)
    private String department;

    @Column
    private Integer semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private Section section;
}
