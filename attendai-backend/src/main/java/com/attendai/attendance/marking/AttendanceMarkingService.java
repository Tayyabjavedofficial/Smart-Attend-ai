package com.attendai.attendance.marking;

import com.attendai.attendance.marking.MarkingDtos.MarkAttendanceRequest;
import com.attendai.attendance.marking.MarkingDtos.MarkAttendanceResponse;
import com.attendai.attendance.realtime.SessionEventPublisher;
import com.attendai.attendance.realtime.SessionEventPublisher.AttendanceMarkedEvent;
import com.attendai.attendance.realtime.SessionEventPublisher.LiveCounters;
import com.attendai.attendance.verification.FaceVerifier;
import com.attendai.attendance.verification.RiskScorer;
import com.attendai.attendance.verification.RiskScorer.RiskInput;
import com.attendai.attendance.verification.RiskScorer.RiskOutput;
import com.attendai.common.exception.ApiException;
import com.attendai.common.exception.BusinessRuleException;
import com.attendai.common.exception.ResourceNotFoundException;
import com.attendai.domain.attendance.*;
import com.attendai.domain.course.StudentCourseRepository;
import com.attendai.domain.security.*;
import com.attendai.domain.user.Student;
import com.attendai.domain.user.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

/**
 * The attendance validation pipeline. Runs every check in order and produces a
 * final {@link AttendanceRecord} plus a parallel {@link AttendanceAttempt} log
 * row (the record gets saved only on success; the attempt is always saved).
 *
 * Pipeline order matters: cheaper checks first so we fail fast.
 *   1.  Resolve student
 *   2.  Resolve session & challenge
 *   3.  Session must be ACTIVE
 *   4.  Challenge must still be active (not past expiry)
 *   5.  Student must be enrolled in (course, section)
 *   6.  Code or QR token matches (per verificationMode)
 *   7.  Duplicate check (DB unique constraint + early read)
 *   8.  Device trust evaluation
 *   9.  Face verification (delegated to FaceVerifier)
 *  10.  Risk scoring (delegated to RiskScorer)
 *  11.  Decide final status from risk + per-check results
 *  12.  Persist record + attempt; publish event; spawn ProxyAlert if needed
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceMarkingService {

    private final StudentRepository studentRepository;
    private final StudentCourseRepository studentCourseRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceChallengeRepository challengeRepository;
    private final AttendanceRecordRepository recordRepository;
    private final AttendanceAttemptRepository attemptRepository;
    private final TrustedDeviceRepository deviceRepository;
    private final FaceProfileRepository faceProfileRepository;
    private final ProxyAlertRepository proxyAlertRepository;
    private final FaceVerifier faceVerifier;
    private final RiskScorer riskScorer;
    private final SessionEventPublisher eventPublisher;
    private final com.attendai.config.AppProperties props;

    @Transactional
    public MarkAttendanceResponse mark(Long userId, MarkAttendanceRequest req, String ipAddress, String userAgent) {
        // ---- 1. Student ----
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "STUDENT_PROFILE_MISSING",
                        "Authenticated user has no student profile"));

        // ---- 2. Session + challenge ----
        AttendanceSession session = sessionRepository.findById(req.sessionId())
                .orElseThrow(() -> new ResourceNotFoundException("AttendanceSession", req.sessionId()));
        AttendanceChallenge challenge = challengeRepository.findById(req.challengeId())
                .orElseThrow(() -> new ResourceNotFoundException("AttendanceChallenge", req.challengeId()));

        if (!challenge.getSession().getId().equals(session.getId())) {
            throw new BusinessRuleException("ATT_CHALLENGE_MISMATCH",
                    "Challenge does not belong to the supplied session");
        }

        // ---- 3. Session ACTIVE ----
        if (session.getStatus() != SessionStatus.ACTIVE) {
            logAttempt(student, challenge, req, AttemptResult.FAILED_EXPIRED,
                    "Session not active", null, null, ipAddress, userAgent);
            throw new BusinessRuleException("ATT_001",
                    "Session is not active (status=" + session.getStatus() + ")");
        }

        // ---- 4. Challenge not expired ----
        Instant now = Instant.now();
        boolean lateSubmission = now.isAfter(challenge.getExpiryTime());
        if (lateSubmission || challenge.getStatus() != ChallengeStatus.ACTIVE) {
            logAttempt(student, challenge, req, AttemptResult.FAILED_EXPIRED,
                    "Challenge expired", null, null, ipAddress, userAgent);
            throw new BusinessRuleException("ATT_002", "Challenge expired");
        }

        // ---- 5. Enrollment ----
        boolean enrolled = studentCourseRepository.existsByStudentIdAndCourseIdAndSectionId(
                student.getId(), session.getCourse().getId(), session.getSection().getId());
        if (!enrolled) {
            logAttempt(student, challenge, req, AttemptResult.FAILED_NOT_ENROLLED,
                    "Not enrolled", null, null, ipAddress, userAgent);
            throw new BusinessRuleException("ATT_004",
                    "You are not enrolled in this course/section");
        }

        // ---- 6. Code / QR check (per verification mode) ----
        VerificationMode mode = session.getVerificationMode();
        boolean codeOk = !mode.requiresCode() || matchesCode(req.submittedCode(), challenge.getChallengeCode());
        boolean qrOk = !mode.requiresQr() || matchesCode(req.qrToken(), challenge.getQrToken());

        if (!codeOk || !qrOk) {
            logAttempt(student, challenge, req, AttemptResult.FAILED_CODE,
                    "Code/QR mismatch", null, null, ipAddress, userAgent);
            throw new BusinessRuleException("ATT_003", "Submitted code or QR token does not match");
        }

        // ---- 6b. Location / geofence (only if the session requires it) ----
        if (Boolean.TRUE.equals(session.getRequireLocation())) {
            if (req.latitude() == null || req.longitude() == null) {
                logAttempt(student, challenge, req, AttemptResult.FAILED_CODE,
                        "Location required but not provided", null, null, ipAddress, userAgent);
                throw new BusinessRuleException("ATT_LOCATION_REQUIRED",
                        "This session requires your location. Enable location access and try again.");
            }
            var gf = props.geofence();
            double distance = haversineMeters(req.latitude(), req.longitude(), gf.latitude(), gf.longitude());
            double allowed = gf.radiusMeters() + gf.accuracyBufferMeters();
            if (distance > allowed) {
                logAttempt(student, challenge, req, AttemptResult.FAILED_CODE,
                        "Outside campus geofence (" + Math.round(distance) + "m)", null, null, ipAddress, userAgent);
                throw new BusinessRuleException("ATT_LOCATION_OUT_OF_RANGE",
                        "You appear to be about " + Math.round(distance) + "m away — you must be on campus to mark attendance.");
            }
        }

        // ---- 7. Duplicate ----
        if (recordRepository.existsByChallengeIdAndStudentId(challenge.getId(), student.getId())) {
            logAttempt(student, challenge, req, AttemptResult.FAILED_DUPLICATE,
                    "Already submitted", null, null, ipAddress, userAgent);
            throw new ApiException(HttpStatus.CONFLICT, "ATT_005",
                    "You have already submitted attendance for this challenge");
        }

        // ---- 8. Device trust ----
        Optional<TrustedDevice> device = req.deviceToken() != null
                ? deviceRepository.findByDeviceToken(req.deviceToken())
                : Optional.empty();
        boolean deviceTrusted = device.map(d -> d.getTrusted() && !d.getBlocked()
                && d.getStudent().getId().equals(student.getId()))
                .orElse(false);
        boolean deviceMultiAccount = req.deviceToken() != null
                && deviceRepository.countDistinctStudentsForToken(req.deviceToken()) > 1;

        if (device.isPresent() && Boolean.TRUE.equals(device.get().getBlocked())) {
            logAttempt(student, challenge, req, AttemptResult.FAILED_DEVICE,
                    "Device blocked", null, null, ipAddress, userAgent);
            throw new BusinessRuleException("ATT_007", "This device has been blocked");
        }

        // ---- 9. Face verification ----
        boolean faceOk;
        double faceConfidence = 1.0;
        if (mode.requiresFace()) {
            // Require an existing face profile.
            if (!faceProfileRepository.existsByStudentId(student.getId())) {
                logAttempt(student, challenge, req, AttemptResult.FAILED_FACE,
                        "Face profile missing", null, null, ipAddress, userAgent);
                throw new BusinessRuleException("AI_001",
                        "You haven't registered a face profile yet");
            }
            FaceVerifier.VerifyResult fr = faceVerifier.verify(student.getId(), req.faceImage());
            faceOk = fr.verified();
            faceConfidence = fr.confidence();
        } else {
            faceOk = true;
        }

        // ---- 10. Risk scoring ----
        long failedCodeRecently = attemptRepository.countByStudentIdAndResultAndAttemptedAtAfter(
                student.getId(), AttemptResult.FAILED_CODE, now.minus(1, ChronoUnit.HOURS));

        RiskInput riskInput = new RiskInput(
                (int) failedCodeRecently,
                deviceTrusted,
                deviceMultiAccount,
                !faceOk,
                faceConfidence,
                0,
                false,
                0,
                false
        );
        RiskOutput risk = riskScorer.score(riskInput);

        // ---- 11. Decide final status ----
        AttendanceStatus finalStatus;
        if (!faceOk) {
            finalStatus = AttendanceStatus.SUSPICIOUS;
        } else if (risk.level() == RiskScorer.Level.CRITICAL) {
            finalStatus = AttendanceStatus.SUSPICIOUS;
        } else if (risk.level() == RiskScorer.Level.HIGH) {
            finalStatus = AttendanceStatus.PENDING_REVIEW;
        } else {
            finalStatus = AttendanceStatus.PRESENT;
        }

        // ---- 12. Persist record + attempt ----
        AttendanceRecord record = AttendanceRecord.builder()
                .session(session)
                .challenge(challenge)
                .student(student)
                .deviceId(device.map(TrustedDevice::getId).orElse(null))
                .status(finalStatus)
                .markedAt(now)
                .codeVerified(mode.requiresCode() ? codeOk : null)
                .qrVerified(mode.requiresQr() ? qrOk : null)
                .faceVerified(mode.requiresFace() ? faceOk : null)
                .deviceVerified(mode.requiresDevice() ? deviceTrusted : null)
                .faceConfidence(mode.requiresFace() ? faceConfidence : null)
                .riskScore(risk.score())
                .remarks(risk.factors().isEmpty() ? null : String.join(",", risk.factors()))
                .build();
        try {
            record = recordRepository.save(record);
        } catch (DataIntegrityViolationException e) {
            // Concurrent duplicate submission - someone else won the race.
            log.warn("Duplicate detected at save time: challenge={} student={}",
                    challenge.getId(), student.getId());
            throw new ApiException(HttpStatus.CONFLICT, "ATT_005",
                    "You have already submitted attendance for this challenge");
        }

        logAttempt(student, challenge, req,
                faceOk ? AttemptResult.SUCCESS : AttemptResult.FLAGGED_SUSPICIOUS,
                null, faceConfidence, risk.score(), ipAddress, userAgent);

        if (device.isPresent()) {
            device.get().setLastUsedAt(now);
            deviceRepository.save(device.get());
        }

        if (risk.level() == RiskScorer.Level.HIGH || risk.level() == RiskScorer.Level.CRITICAL) {
            createProxyAlert(student, session.getId(), challenge.getId(), risk);
        }

        eventPublisher.publishEvent(new AttendanceMarkedEvent(
                session.getId(), challenge.getId(), student.getId(),
                student.getUser().getFullName(), finalStatus, risk.score()));

        publishLiveCounters(session.getId());

        return new MarkAttendanceResponse(
                record.getId(),
                finalStatus,
                risk.score(),
                risk.level().name(),
                mode.requiresFace() ? faceConfidence : null,
                risk.factors(),
                now,
                statusMessage(finalStatus)
        );
    }

    // ---------- Live counters ----------

    @Transactional(readOnly = true)
    public LiveCounters computeLiveCounters(Long sessionId) {
        long present = recordRepository.countBySessionIdAndStatus(sessionId, AttendanceStatus.PRESENT)
                + recordRepository.countBySessionIdAndStatus(sessionId, AttendanceStatus.MANUAL_PRESENT);
        long late = recordRepository.countBySessionIdAndStatus(sessionId, AttendanceStatus.LATE);
        long suspicious = recordRepository.countBySessionIdAndStatus(sessionId, AttendanceStatus.SUSPICIOUS);
        long pending = recordRepository.countBySessionIdAndStatus(sessionId, AttendanceStatus.PENDING_REVIEW);

        // Total enrolled = students enrolled in the session's (course, section).
        AttendanceSession session = sessionRepository.findById(sessionId).orElseThrow();
        long total = studentCourseRepository.findByCourseIdAndSectionId(
                session.getCourse().getId(), session.getSection().getId()).size();
        long absent = Math.max(0, total - (present + late + suspicious + pending));

        return new LiveCounters(
                (int) present, (int) absent, (int) late, (int) suspicious, (int) pending, (int) total);
    }

    private void publishLiveCounters(Long sessionId) {
        try {
            eventPublisher.publishLiveCounters(sessionId, computeLiveCounters(sessionId));
        } catch (Exception e) {
            log.warn("Failed to publish live counters: {}", e.getMessage());
        }
    }

    // ---------- Helpers ----------

    private boolean matchesCode(String submitted, String expected) {
        return submitted != null && expected != null && submitted.trim().equalsIgnoreCase(expected);
    }

    /** Great-circle distance between two lat/lng points, in metres. */
    private static double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6_371_000; // Earth radius (m)
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private void logAttempt(Student student, AttendanceChallenge challenge, MarkAttendanceRequest req,
                            AttemptResult result, String failureReason, Double faceConfidence,
                            Integer riskScore, String ipAddress, String userAgent) {
        try {
            attemptRepository.save(AttendanceAttempt.builder()
                    .challenge(challenge)
                    .student(student)
                    .attemptedAt(Instant.now())
                    .submittedCode(req.submittedCode())
                    .submittedQrToken(req.qrToken())
                    .faceConfidence(faceConfidence)
                    .result(result)
                    .failureReason(failureReason)
                    .riskScore(riskScore)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build());
        } catch (Exception e) {
            // Never let attempt logging break the main flow.
            log.warn("Failed to log attempt: {}", e.getMessage());
        }
    }

    private void createProxyAlert(Student student, Long sessionId, Long challengeId, RiskOutput risk) {
        ProxyAlert.Severity severity = switch (risk.level()) {
            case CRITICAL -> ProxyAlert.Severity.CRITICAL;
            case HIGH -> ProxyAlert.Severity.HIGH;
            case MEDIUM -> ProxyAlert.Severity.MEDIUM;
            case LOW -> ProxyAlert.Severity.LOW;
        };
        proxyAlertRepository.save(ProxyAlert.builder()
                .student(student)
                .sessionId(sessionId)
                .challengeId(challengeId)
                .alertType(risk.factors().isEmpty() ? "high_risk_score" : risk.factors().get(0))
                .severity(severity)
                .description("Risk score " + risk.score() + ": " + String.join(", ", risk.factors()))
                .riskScore(risk.score())
                .status(ProxyAlert.Status.OPEN)
                .build());
    }

    private String statusMessage(AttendanceStatus s) {
        return switch (s) {
            case PRESENT -> "Attendance marked.";
            case PENDING_REVIEW -> "Attendance recorded - your teacher will review it.";
            case SUSPICIOUS -> "Attendance flagged as suspicious. Contact your teacher.";
            default -> "Attendance recorded as " + s.name();
        };
    }
}
