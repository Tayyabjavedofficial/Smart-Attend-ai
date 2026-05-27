package com.attendai.attendance.challenge;

import com.attendai.attendance.realtime.SessionEventPublisher;
import com.attendai.attendance.realtime.SessionEventPublisher.ChallengeExpiredEvent;
import com.attendai.attendance.realtime.SessionEventPublisher.ChallengeStartedEvent;
import com.attendai.common.exception.ResourceNotFoundException;
import com.attendai.common.util.CodeGenerator;
import com.attendai.domain.attendance.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChallengeService {

    private final AttendanceChallengeRepository challengeRepository;
    private final SessionEventPublisher eventPublisher;

    @Transactional
    public AttendanceChallenge createChallenge(AttendanceSession session, int durationSeconds, ChallengeType type) {
        Instant now = Instant.now();
        AttendanceChallenge ch = AttendanceChallenge.builder()
                .session(session)
                .challengeCode(CodeGenerator.shortCode())
                .qrToken(CodeGenerator.qrToken())
                .challengeType(type)
                .startTime(now)
                .expiryTime(now.plusSeconds(durationSeconds))
                .durationSeconds(durationSeconds)
                .status(ChallengeStatus.ACTIVE)
                .build();
        AttendanceChallenge saved = challengeRepository.save(ch);

        eventPublisher.publishEvent(new ChallengeStartedEvent(
                session.getId(), saved.getId(), saved.getChallengeCode(), saved.getExpiryTime()));
        log.info("Created challenge {} for session {} (expires in {}s)",
                saved.getId(), session.getId(), durationSeconds);
        return saved;
    }

    @Transactional(readOnly = true)
    public Optional<AttendanceChallenge> findActiveBySession(Long sessionId) {
        return challengeRepository.findBySessionIdOrderByStartTimeDesc(sessionId).stream()
                .filter(c -> c.getStatus() == ChallengeStatus.ACTIVE && !c.isExpired())
                .findFirst();
    }

    @Transactional(readOnly = true)
    public AttendanceChallenge requireActive(Long sessionId) {
        return findActiveBySession(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active challenge for session " + sessionId));
    }

    @Transactional
    public int expireAllForSession(Long sessionId) {
        List<AttendanceChallenge> active = challengeRepository
                .findBySessionIdOrderByStartTimeDesc(sessionId).stream()
                .filter(c -> c.getStatus() == ChallengeStatus.ACTIVE)
                .toList();
        active.forEach(c -> c.setStatus(ChallengeStatus.EXPIRED));
        challengeRepository.saveAll(active);
        active.forEach(c -> eventPublisher.publishEvent(
                new ChallengeExpiredEvent(c.getSession().getId(), c.getId())));
        return active.size();
    }

    /**
     * Called by the scheduled job. Picks up any ACTIVE challenge past its
     * expiry_time and transitions it to EXPIRED. Broadcasts an event so
     * teacher UIs stop counting down.
     */
    @Transactional
    public int expireOverdueChallenges() {
        Instant now = Instant.now();
        List<AttendanceChallenge> overdue = challengeRepository
                .findByStatusAndExpiryTimeBefore(ChallengeStatus.ACTIVE, now);
        if (overdue.isEmpty()) return 0;

        overdue.forEach(c -> c.setStatus(ChallengeStatus.EXPIRED));
        challengeRepository.saveAll(overdue);

        overdue.forEach(c -> eventPublisher.publishEvent(
                new ChallengeExpiredEvent(c.getSession().getId(), c.getId())));

        log.info("Expired {} overdue challenges", overdue.size());
        return overdue.size();
    }
}
