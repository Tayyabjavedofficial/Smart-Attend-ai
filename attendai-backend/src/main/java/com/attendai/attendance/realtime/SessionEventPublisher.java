package com.attendai.attendance.realtime;

import com.attendai.domain.attendance.AttendanceStatus;
import com.attendai.domain.attendance.SessionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Publishes session-scoped events to WebSocket subscribers. Two topics per
 * session:
 *  - /topic/session/{id}/events   : per-attendance and lifecycle events
 *  - /topic/session/{id}/live     : aggregate counters for the live dashboard
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SessionEventPublisher {

    private final SimpMessagingTemplate broker;

    public sealed interface SessionEvent permits
            AttendanceMarkedEvent, ChallengeStartedEvent, ChallengeExpiredEvent,
            SessionStartedEvent, SessionClosedEvent {
        Instant timestamp();
    }

    public record AttendanceMarkedEvent(
            String type,
            Long sessionId,
            Long challengeId,
            Long studentId,
            String studentName,
            AttendanceStatus status,
            int riskScore,
            Instant timestamp
    ) implements SessionEvent {
        public AttendanceMarkedEvent(Long sessionId, Long challengeId, Long studentId, String studentName,
                                     AttendanceStatus status, int riskScore) {
            this("ATTENDANCE_MARKED", sessionId, challengeId, studentId, studentName, status, riskScore, Instant.now());
        }
    }

    public record ChallengeStartedEvent(
            String type, Long sessionId, Long challengeId,
            String challengeCode, Instant expiryTime, Instant timestamp
    ) implements SessionEvent {
        public ChallengeStartedEvent(Long sessionId, Long challengeId, String code, Instant expiry) {
            this("CHALLENGE_STARTED", sessionId, challengeId, code, expiry, Instant.now());
        }
    }

    public record ChallengeExpiredEvent(
            String type, Long sessionId, Long challengeId, Instant timestamp
    ) implements SessionEvent {
        public ChallengeExpiredEvent(Long sessionId, Long challengeId) {
            this("CHALLENGE_EXPIRED", sessionId, challengeId, Instant.now());
        }
    }

    public record SessionStartedEvent(
            String type, Long sessionId, Instant timestamp
    ) implements SessionEvent {
        public SessionStartedEvent(Long sessionId) { this("SESSION_STARTED", sessionId, Instant.now()); }
    }

    public record SessionClosedEvent(
            String type, Long sessionId, SessionStatus status, Instant timestamp
    ) implements SessionEvent {
        public SessionClosedEvent(Long sessionId, SessionStatus status) {
            this("SESSION_CLOSED", sessionId, status, Instant.now());
        }
    }

    public record LiveCounters(
            int present, int absent, int late, int suspicious, int pendingReview, int total
    ) {}

    public void publishEvent(SessionEvent event) {
        try {
            Long sessionId = extractSessionId(event);
            broker.convertAndSend("/topic/session/" + sessionId + "/events", event);
            log.debug("Published {} for session {}", event.getClass().getSimpleName(), sessionId);
        } catch (Exception e) {
            log.warn("Failed to publish session event: {}", e.getMessage());
        }
    }

    public void publishLiveCounters(Long sessionId, LiveCounters counters) {
        try {
            broker.convertAndSend("/topic/session/" + sessionId + "/live", counters);
        } catch (Exception e) {
            log.warn("Failed to publish live counters: {}", e.getMessage());
        }
    }

    private Long extractSessionId(SessionEvent e) {
        return switch (e) {
            case AttendanceMarkedEvent ev -> ev.sessionId();
            case ChallengeStartedEvent ev -> ev.sessionId();
            case ChallengeExpiredEvent ev -> ev.sessionId();
            case SessionStartedEvent ev -> ev.sessionId();
            case SessionClosedEvent ev -> ev.sessionId();
        };
    }
}
