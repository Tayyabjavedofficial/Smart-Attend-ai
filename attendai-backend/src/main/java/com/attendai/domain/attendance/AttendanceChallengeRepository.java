package com.attendai.domain.attendance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AttendanceChallengeRepository extends JpaRepository<AttendanceChallenge, Long> {

    Optional<AttendanceChallenge> findByQrToken(String qrToken);

    List<AttendanceChallenge> findBySessionIdOrderByStartTimeDesc(Long sessionId);

    List<AttendanceChallenge> findByStatusAndExpiryTimeBefore(ChallengeStatus status, Instant cutoff);
}
