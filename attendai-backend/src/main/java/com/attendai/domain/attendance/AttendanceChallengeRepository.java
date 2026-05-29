package com.attendai.domain.attendance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AttendanceChallengeRepository extends JpaRepository<AttendanceChallenge, Long> {

    Optional<AttendanceChallenge> findByQrToken(String qrToken);

    List<AttendanceChallenge> findBySessionIdOrderByStartTimeDesc(Long sessionId);

    List<AttendanceChallenge> findByStatusAndExpiryTimeBefore(ChallengeStatus status, Instant cutoff);

    @Modifying
    @Query("delete from AttendanceChallenge c where c.session.id = :sessionId")
    void deleteBySessionId(@Param("sessionId") Long sessionId);
}
