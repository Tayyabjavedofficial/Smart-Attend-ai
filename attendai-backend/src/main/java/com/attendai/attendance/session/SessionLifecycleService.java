package com.attendai.attendance.session;

import com.attendai.attendance.challenge.ChallengeService;
import com.attendai.attendance.realtime.SessionEventPublisher;
import com.attendai.attendance.session.SessionDtos.*;
import com.attendai.common.exception.ApiException;
import com.attendai.common.exception.ResourceNotFoundException;
import com.attendai.common.util.CodeGenerator;
import com.attendai.config.AppProperties;
import com.attendai.domain.attendance.*;
import com.attendai.domain.course.*;
import com.attendai.domain.user.Teacher;
import com.attendai.domain.user.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Owns the lifecycle of an {@link AttendanceSession}:
 *   SCHEDULED -> ACTIVE -> CLOSED
 * with EXPIRED reached automatically if the session ages out without being
 * started. All state transitions go through this service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SessionLifecycleService {

    private final AttendanceSessionRepository sessionRepository;
    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final TeacherRepository teacherRepository;
    private final TeacherCourseRepository teacherCourseRepository;
    private final ChallengeService challengeService;
    private final SessionEventPublisher eventPublisher;
    private final AppProperties props;

    /** Resolves the authenticated user's teacher record. */
    @Transactional(readOnly = true)
    public Teacher requireTeacher(Long userId) {
        return teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "TEACHER_PROFILE_MISSING",
                        "Authenticated user has no teacher profile"));
    }

    /** Enforces that the teacher is allowed to operate on this session. */
    private void requireOwnership(AttendanceSession session, Long teacherId) {
        if (!session.getTeacher().getId().equals(teacherId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "TEACHER_FORBIDDEN",
                    "Session belongs to another teacher");
        }
    }

    @Transactional
    public SessionDto create(Long teacherUserId, CreateSessionRequest req) {
        Teacher teacher = requireTeacher(teacherUserId);

        // Must be assigned to (course, section) before they can start attendance there.
        if (!teacherCourseRepository.existsByTeacherIdAndCourseIdAndSectionId(
                teacher.getId(), req.courseId(), req.sectionId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "TEACHER_NOT_ASSIGNED",
                    "You are not assigned to that course/section");
        }

        Course course = courseRepository.findById(req.courseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", req.courseId()));
        Section section = sectionRepository.findById(req.sectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Section", req.sectionId()));

        VerificationMode mode = req.verificationMode() != null
                ? req.verificationMode() : VerificationMode.QR_FACE_DEVICE;

        AttendanceSession session = AttendanceSession.builder()
                .sessionCode(CodeGenerator.sessionCode())
                .teacher(teacher)
                .course(course)
                .section(section)
                .sessionTitle(req.sessionTitle())
                .status(SessionStatus.SCHEDULED)
                .verificationMode(mode)
                .requireLocation(Boolean.TRUE.equals(req.requireLocation()))
                .build();
        AttendanceSession saved = sessionRepository.save(session);
        log.info("Created session {} ({}) for course {} / section {}",
                saved.getId(), saved.getSessionCode(), course.getCourseCode(), section.getSectionName());
        return SessionDto.from(saved);
    }

    public record StartResult(SessionDto session, ChallengeDto challenge) {}

    @Transactional
    public StartResult start(Long teacherUserId, Long sessionId, StartSessionRequest req) {
        Teacher teacher = requireTeacher(teacherUserId);
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("AttendanceSession", sessionId));
        requireOwnership(session, teacher.getId());

        if (session.getStatus() != SessionStatus.SCHEDULED) {
            throw new ApiException(HttpStatus.CONFLICT, "SESSION_BAD_STATE",
                    "Session must be SCHEDULED to start (current: " + session.getStatus() + ")");
        }

        int duration = Optional.ofNullable(req.durationSeconds())
                .orElse(props.attendance().defaultChallengeDurationSeconds());
        ChallengeType type = Optional.ofNullable(req.challengeType()).orElse(ChallengeType.CODE_QR);

        session.setStatus(SessionStatus.ACTIVE);
        session.setStartTime(Instant.now());
        sessionRepository.save(session);

        AttendanceChallenge challenge = challengeService.createChallenge(session, duration, type);
        eventPublisher.publishEvent(new SessionEventPublisher.SessionStartedEvent(session.getId()));

        return new StartResult(SessionDto.from(session), toChallengeDto(challenge));
    }

    @Transactional
    public ChallengeDto nextChallenge(Long teacherUserId, Long sessionId, NextChallengeRequest req) {
        Teacher teacher = requireTeacher(teacherUserId);
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("AttendanceSession", sessionId));
        requireOwnership(session, teacher.getId());

        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new ApiException(HttpStatus.CONFLICT, "SESSION_BAD_STATE",
                    "Session is not ACTIVE");
        }

        // Expire any still-active challenge before issuing the new one.
        challengeService.expireAllForSession(sessionId);

        int duration = Optional.ofNullable(req.durationSeconds())
                .orElse(props.attendance().defaultChallengeDurationSeconds());
        ChallengeType type = Optional.ofNullable(req.challengeType()).orElse(ChallengeType.CODE_QR);
        return toChallengeDto(challengeService.createChallenge(session, duration, type));
    }

    @Transactional
    public SessionDto close(Long teacherUserId, Long sessionId) {
        Teacher teacher = requireTeacher(teacherUserId);
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("AttendanceSession", sessionId));
        requireOwnership(session, teacher.getId());

        if (session.getStatus() == SessionStatus.CLOSED || session.getStatus() == SessionStatus.EXPIRED) {
            return SessionDto.from(session);
        }

        challengeService.expireAllForSession(sessionId);
        session.setStatus(SessionStatus.CLOSED);
        session.setEndTime(Instant.now());
        sessionRepository.save(session);

        eventPublisher.publishEvent(new SessionEventPublisher.SessionClosedEvent(sessionId, SessionStatus.CLOSED));
        log.info("Closed session {}", sessionId);
        return SessionDto.from(session);
    }

    @Transactional(readOnly = true)
    public SessionDto get(Long teacherUserId, Long sessionId) {
        Teacher teacher = requireTeacher(teacherUserId);
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("AttendanceSession", sessionId));
        requireOwnership(session, teacher.getId());
        return SessionDto.from(session);
    }

    @Transactional(readOnly = true)
    public List<SessionDto> listActiveForTeacher(Long teacherUserId) {
        Teacher teacher = requireTeacher(teacherUserId);
        // Could be optimised with a custom query; this is fine for class-sized data.
        return sessionRepository.findByTeacherIdOrderByStartTimeDesc(
                        teacher.getId(), org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .filter(s -> s.getStatus() == SessionStatus.ACTIVE)
                .map(SessionDto::from)
                .toList();
    }

    private ChallengeDto toChallengeDto(AttendanceChallenge ch) {
        return new ChallengeDto(
                ch.getId(),
                ch.getSession().getId(),
                ch.getChallengeCode(),
                ch.getQrToken(),
                ch.getChallengeType(),
                ch.getStartTime(),
                ch.getExpiryTime(),
                ch.getDurationSeconds()
        );
    }
}
