package com.attendai.domain.course;

import com.attendai.common.audit.Auditable;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "sections",
        indexes = @Index(name = "idx_sections_dept_sem", columnList = "department,semester")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Section extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "section_name", nullable = false, length = 50)
    private String sectionName;

    @Column
    private Integer semester;

    @Column(length = 80)
    private String department;
}
