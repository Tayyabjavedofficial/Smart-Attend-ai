package com.attendai.domain.course;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByDepartment(String department);

    List<Section> findByBatchIdOrderBySemesterAscSectionNameAsc(Long batchId);

    long countByBatchId(Long batchId);
}
