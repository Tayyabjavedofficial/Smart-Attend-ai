package com.attendai.domain.course;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BatchRepository extends JpaRepository<Batch, Long> {

    boolean existsByNameIgnoreCase(String name);

    List<Batch> findByDepartment(String department);
}
