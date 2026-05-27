package com.attendai.domain.attendance;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    boolean existsByChallengeIdAndStudentId(Long challengeId, Long studentId);

    Optional<AttendanceRecord> findByChallengeIdAndStudentId(Long challengeId, Long studentId);

    List<AttendanceRecord> findBySessionIdOrderByMarkedAtDesc(Long sessionId);

    Page<AttendanceRecord> findByStudentIdOrderByMarkedAtDesc(Long studentId, Pageable pageable);

    long countBySessionIdAndStatus(Long sessionId, AttendanceStatus status);

    List<AttendanceRecord> findByStudentIdAndMarkedAtBetween(Long studentId, Instant from, Instant to);
}
