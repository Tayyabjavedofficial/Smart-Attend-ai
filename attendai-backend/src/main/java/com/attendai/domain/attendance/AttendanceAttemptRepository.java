package com.attendai.domain.attendance;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface AttendanceAttemptRepository extends JpaRepository<AttendanceAttempt, Long> {

    Page<AttendanceAttempt> findByStudentIdOrderByAttemptedAtDesc(Long studentId, Pageable pageable);

    long countByStudentIdAndAttemptedAtAfter(Long studentId, Instant since);

    long countByStudentIdAndResultAndAttemptedAtAfter(Long studentId, AttemptResult result, Instant since);
}
