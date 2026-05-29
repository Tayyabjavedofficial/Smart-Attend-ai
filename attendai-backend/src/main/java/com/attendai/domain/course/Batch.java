package com.attendai.domain.course;

import com.attendai.common.audit.Auditable;
import jakarta.persistence.*;
import lombok.*;

/**
 * A student cohort / degree program that groups {@link Section}s across
 * semesters 1..{@code totalSemesters} (typically 8). Sections reference a batch
 * via {@code batch_id}; the relationship is owned on the Section side.
 */
@Entity
@Table(
        name = "batches",
        uniqueConstraints = @UniqueConstraint(name = "uk_batches_name", columnNames = "name"),
        indexes = @Index(name = "idx_batches_department", columnList = "department")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Batch extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 80)
    private String program;

    @Column(length = 80)
    private String department;

    @Column(name = "start_year")
    private Integer startYear;

    @Column(name = "total_semesters", nullable = false)
    @Builder.Default
    private Integer totalSemesters = 8;

    @Column(length = 120)
    private String advisor;
}
