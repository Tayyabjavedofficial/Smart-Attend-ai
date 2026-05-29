package com.attendai.domain.attendance;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface AttendanceAttemptRepository extends JpaRepository<AttendanceAttempt, Long> {

    @Modifying
    @Query("delete from AttendanceAttempt a where a.challenge.id in (select c.id from AttendanceChallenge c where c.session.id = :sessionId)")
    void deleteBySessionId(@Param("sessionId") Long sessionId);

    Page<AttendanceAttempt> findByStudentIdOrderByAttemptedAtDesc(Long studentId, Pageable pageable);

    long countByStudentIdAndAttemptedAtAfter(Long studentId, Instant since);

    long countByStudentIdAndResultAndAttemptedAtAfter(Long studentId, AttemptResult result, Instant since);
}
