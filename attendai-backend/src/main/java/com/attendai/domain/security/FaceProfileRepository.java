package com.attendai.domain.security;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FaceProfileRepository extends JpaRepository<FaceProfile, Long> {
    Optional<FaceProfile> findByStudentId(Long studentId);
    boolean existsByStudentId(Long studentId);
}
