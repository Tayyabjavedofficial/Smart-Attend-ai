package com.attendai.attendance.marking;

import com.attendai.attendance.marking.MarkingDtos.MarkAttendanceRequest;
import com.attendai.attendance.marking.MarkingDtos.MarkAttendanceResponse;
import com.attendai.attendance.realtime.SessionEventPublisher;
import com.attendai.attendance.verification.FaceVerifier;
import com.attendai.attendance.verification.RiskScorer;
import com.attendai.common.exception.ApiException;
import com.attendai.common.exception.BusinessRuleException;
import com.attendai.domain.attendance.*;
import com.attendai.domain.course.Course;
import com.attendai.domain.course.Section;
import com.attendai.domain.course.StudentCourseRepository;
import com.attendai.domain.security.*;
import com.attendai.domain.user.Student;
import com.attendai.domain.user.StudentRepository;
import com.attendai.domain.user.Teacher;
import com.attendai.domain.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttendanceMarkingServiceTest {

    @Mock StudentRepository studentRepository;
    @Mock StudentCourseRepository studentCourseRepository;
    @Mock AttendanceSessionRepository sessionRepository;
    @Mock AttendanceChallengeRepository challengeRepository;
    @Mock AttendanceRecordRepository recordRepository;
    @Mock AttendanceAttemptRepository attemptRepository;
    @Mock TrustedDeviceRepository deviceRepository;
    @Mock FaceProfileRepository faceProfileRepository;
    @Mock ProxyAlertRepository proxyAlertRepository;
    @Mock FaceVerifier faceVerifier;
    @Mock RiskScorer riskScorer;
    @Mock SessionEventPublisher eventPublisher;

    @InjectMocks AttendanceMarkingService service;

    private Student student;
    private AttendanceSession session;
    private AttendanceChallenge challenge;
    private final MarkAttendanceRequest req = new MarkAttendanceRequest(
            301L, 901L, "ABC123", "qr-token-xyz", "fake-base64-image-data", "device-uuid");

    @BeforeEach
    void setUp() {
        User u = User.builder().id(10L).fullName("Test Student").build();
        student = Student.builder().id(101L).user(u).build();

        Course course = Course.builder().id(7L).courseCode("CS201").courseName("AI").build();
        Section section = Section.builder().id(12L).sectionName("BCS-7A").build();
        Teacher teacher = Teacher.builder().id(21L).build();

        session = AttendanceSession.builder()
                .id(301L).teacher(teacher).course(course).section(section)
                .status(SessionStatus.ACTIVE)
                .verificationMode(VerificationMode.QR_FACE_DEVICE)
                .build();

        challenge = AttendanceChallenge.builder()
                .id(901L).session(session)
                .challengeCode("ABC123").qrToken("qr-token-xyz")
                .status(ChallengeStatus.ACTIVE)
                .startTime(Instant.now().minusSeconds(10))
                .expiryTime(Instant.now().plusSeconds(50))
                .durationSeconds(60)
                .build();

        lenient().when(studentRepository.findByUserId(10L)).thenReturn(Optional.of(student));
        lenient().when(sessionRepository.findById(301L)).thenReturn(Optional.of(session));
        lenient().when(challengeRepository.findById(901L)).thenReturn(Optional.of(challenge));
        lenient().when(studentCourseRepository
                .existsByStudentIdAndCourseIdAndSectionId(101L, 7L, 12L)).thenReturn(true);
        lenient().when(faceProfileRepository.existsByStudentId(101L)).thenReturn(true);
        lenient().when(deviceRepository.findByDeviceToken("device-uuid"))
                .thenReturn(Optional.of(TrustedDevice.builder()
                        .id(200L).deviceToken("device-uuid")
                        .student(student).trusted(true).blocked(false).build()));
        lenient().when(deviceRepository.countDistinctStudentsForToken("device-uuid")).thenReturn(1L);
        lenient().when(faceVerifier.verify(101L, "fake-base64-image-data"))
                .thenReturn(new FaceVerifier.VerifyResult(true, 0.95, FaceVerifier.Status.VERIFIED));
        lenient().when(recordRepository.existsByChallengeIdAndStudentId(901L, 101L)).thenReturn(false);
        lenient().when(recordRepository.save(any(AttendanceRecord.class)))
                .thenAnswer(inv -> {
                    AttendanceRecord r = inv.getArgument(0);
                    r.setId(5001L);
                    return r;
                });
        lenient().when(riskScorer.score(any(RiskScorer.RiskInput.class)))
                .thenReturn(new RiskScorer.RiskOutput(12, RiskScorer.Level.LOW, List.of()));
    }

    @Test
    void happyPath_marksPresentWithLowRisk() {
        MarkAttendanceResponse resp = service.mark(10L, req, "127.0.0.1", "TestAgent/1.0");
        assertThat(resp.status()).isEqualTo(AttendanceStatus.PRESENT);
        assertThat(resp.riskScore()).isEqualTo(12);
        assertThat(resp.riskLevel()).isEqualTo("LOW");
        assertThat(resp.faceConfidence()).isGreaterThan(0.9);
    }

    @Test
    void rejectsWhenSessionNotActive() {
        session.setStatus(SessionStatus.CLOSED);
        assertThatThrownBy(() -> service.mark(10L, req, "127.0.0.1", "ua"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("not active");
    }

    @Test
    void rejectsWhenChallengeExpired() {
        challenge.setExpiryTime(Instant.now().minusSeconds(5));
        assertThatThrownBy(() -> service.mark(10L, req, "127.0.0.1", "ua"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void rejectsWhenCodeMismatch() {
        MarkAttendanceRequest bad = new MarkAttendanceRequest(
                301L, 901L, "WRONG", "qr-token-xyz", "fake", "device-uuid");
        assertThatThrownBy(() -> service.mark(10L, bad, "127.0.0.1", "ua"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("does not match");
    }

    @Test
    void rejectsWhenNotEnrolled() {
        lenient().when(studentCourseRepository
                .existsByStudentIdAndCourseIdAndSectionId(101L, 7L, 12L)).thenReturn(false);
        assertThatThrownBy(() -> service.mark(10L, req, "127.0.0.1", "ua"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("not enrolled");
    }

    @Test
    void rejectsWhenDuplicate() {
        lenient().when(recordRepository.existsByChallengeIdAndStudentId(901L, 101L)).thenReturn(true);
        assertThatThrownBy(() -> service.mark(10L, req, "127.0.0.1", "ua"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("already submitted");
    }

    @Test
    void faceFailure_flagsSuspicious() {
        lenient().when(faceVerifier.verify(101L, "fake-base64-image-data"))
                .thenReturn(new FaceVerifier.VerifyResult(false, 0.3, FaceVerifier.Status.FAILED));
        lenient().when(riskScorer.score(any())).thenReturn(
                new RiskScorer.RiskOutput(58, RiskScorer.Level.MEDIUM, List.of("face_failed")));
        MarkAttendanceResponse resp = service.mark(10L, req, "127.0.0.1", "ua");
        assertThat(resp.status()).isEqualTo(AttendanceStatus.SUSPICIOUS);
    }

    @Test
    void blockedDevice_rejected() {
        lenient().when(deviceRepository.findByDeviceToken("device-uuid"))
                .thenReturn(Optional.of(TrustedDevice.builder()
                        .id(200L).deviceToken("device-uuid")
                        .student(student).trusted(false).blocked(true).build()));
        assertThatThrownBy(() -> service.mark(10L, req, "127.0.0.1", "ua"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("blocked");
    }

    @Test
    void missingFaceProfile_rejected() {
        lenient().when(faceProfileRepository.existsByStudentId(101L)).thenReturn(false);
        assertThatThrownBy(() -> service.mark(10L, req, "127.0.0.1", "ua"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("face profile");
    }

    @Test
    void criticalRisk_marksSuspicious() {
        lenient().when(riskScorer.score(any())).thenReturn(
                new RiskScorer.RiskOutput(92, RiskScorer.Level.CRITICAL, List.of("multi_account_device")));
        MarkAttendanceResponse resp = service.mark(10L, req, "127.0.0.1", "ua");
        assertThat(resp.status()).isEqualTo(AttendanceStatus.SUSPICIOUS);
        assertThat(resp.riskLevel()).isEqualTo("CRITICAL");
    }

    @Test
    void highRisk_marksPendingReview() {
        lenient().when(riskScorer.score(any())).thenReturn(
                new RiskScorer.RiskOutput(72, RiskScorer.Level.HIGH, List.of("untrusted_device", "low_face_confidence")));
        MarkAttendanceResponse resp = service.mark(10L, req, "127.0.0.1", "ua");
        assertThat(resp.status()).isEqualTo(AttendanceStatus.PENDING_REVIEW);
    }
}
