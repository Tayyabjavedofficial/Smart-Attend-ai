package com.attendai.domain.user;

import com.attendai.common.audit.Auditable;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "teachers",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_teachers_user_id", columnNames = "user_id"),
                @UniqueConstraint(name = "uk_teachers_employee_id", columnNames = "employee_id")
        },
        indexes = @Index(name = "idx_teachers_department", columnList = "department")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Teacher extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "employee_id", nullable = false, length = 50)
    private String employeeId;

    @Column(length = 80)
    private String department;

    @Column(length = 80)
    private String designation;
}
