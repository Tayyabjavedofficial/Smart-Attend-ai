package com.attendai.modules.student;

import com.attendai.common.exception.ApiException;
import com.attendai.common.util.CodeGenerator;
import com.attendai.common.util.SecurityUtils;
import com.attendai.domain.attendance.AttendanceRecord;
import com.attendai.domain.attendance.AttendanceRecordRepository;
import com.attendai.domain.attendance.AttendanceStatus;
import com.attendai.domain.course.StudentCourseRepository;
import com.attendai.domain.security.FaceProfile;
import com.attendai.domain.security.FaceProfileRepository;
import com.attendai.domain.security.TrustedDevice;
import com.attendai.domain.security.TrustedDeviceRepository;
import com.attendai.domain.user.Student;
import com.attendai.domain.user.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final StudentCourseRepository studentCourseRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final TrustedDeviceRepository trustedDeviceRepository;
    private final FaceProfileRepository faceProfileRepository;

    /** Resolves the {@link Student} for the authenticated user. */
    @Transactional(readOnly = true)
    public Student currentStudent() {
        Long userId = SecurityUtils.currentUserId();
        return studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "STUDENT_PROFILE_MISSING",
                        "Authenticated user has no student profile"));
    }

    public record CourseSummary(
            Long enrollmentId, Long courseId, String courseCode, String courseName,
            Long sectionId, String sectionName
    ) {}

    @Transactional(readOnly = true)
    public List<CourseSummary> myCourses() {
        Long studentId = currentStudent().getId();
        return studentCourseRepository.findByStudentId(studentId).stream()
                .map(sc -> new CourseSummary(
                        sc.getId(),
                        sc.getCourse().getId(),
                        sc.getCourse().getCourseCode(),
                        sc.getCourse().getCourseName(),
                        sc.getSection().getId(),
                        sc.getSection().getSectionName()))
                .toList();
    }

    public record AttendanceHistoryRow(
            Long recordId, Long sessionId, String courseCode,
            AttendanceStatus status, Instant markedAt, Integer riskScore
    ) {
        static AttendanceHistoryRow from(AttendanceRecord r) {
            return new AttendanceHistoryRow(
                    r.getId(),
                    r.getSession().getId(),
                    r.getSession().getCourse().getCourseCode(),
                    r.getStatus(),
                    r.getMarkedAt(),
                    r.getRiskScore());
        }
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<AttendanceHistoryRow> history(org.springframework.data.domain.Pageable pageable) {
        Long studentId = currentStudent().getId();
        return attendanceRecordRepository.findByStudentIdOrderByMarkedAtDesc(studentId, pageable)
                .map(AttendanceHistoryRow::from);
    }

    public record PercentageResult(double overall, List<CoursePercentage> perCourse) {}
    public record CoursePercentage(String courseCode, String courseName, double percentage,
                                   int present, int total) {}

    @Transactional(readOnly = true)
    public PercentageResult percentage() {
        Long studentId = currentStudent().getId();

        // Group counts by course.
        Map<String, int[]> agg = new HashMap<>(); // [present, total]
        Map<String, String> names = new HashMap<>();

        attendanceRecordRepository.findByStudentIdOrderByMarkedAtDesc(studentId,
                org.springframework.data.domain.Pageable.unpaged())
                .forEach(r -> {
                    String code = r.getSession().getCourse().getCourseCode();
                    names.putIfAbsent(code, r.getSession().getCourse().getCourseName());
                    int[] c = agg.computeIfAbsent(code, k -> new int[2]);
                    if (isPresentLike(r.getStatus())) c[0]++;
                    c[1]++;
                });

        List<CoursePercentage> rows = agg.entrySet().stream()
                .map(e -> {
                    int present = e.getValue()[0], total = e.getValue()[1];
                    double pct = total == 0 ? 0.0 : (100.0 * present / total);
                    return new CoursePercentage(e.getKey(), names.get(e.getKey()),
                            Math.round(pct * 10.0) / 10.0, present, total);
                })
                .toList();

        int totalPresent = rows.stream().mapToInt(CoursePercentage::present).sum();
        int totalAll = rows.stream().mapToInt(CoursePercentage::total).sum();
        double overall = totalAll == 0 ? 0.0 : Math.round(1000.0 * totalPresent / totalAll) / 10.0;

        return new PercentageResult(overall, rows);
    }

    private boolean isPresentLike(AttendanceStatus s) {
        return s == AttendanceStatus.PRESENT
                || s == AttendanceStatus.LATE
                || s == AttendanceStatus.MANUAL_PRESENT
                || s == AttendanceStatus.EXCUSED;
    }

    // -------- Trusted device registration --------

    public record DeviceRegisterRequest(String deviceName, String browserInfo) {}
    public record DeviceRegisterResponse(Long deviceId, String deviceToken, boolean trusted) {}

    @Transactional
    public DeviceRegisterResponse registerDevice(DeviceRegisterRequest req, String ipAddress) {
        Student student = currentStudent();
        String token = CodeGenerator.deviceToken();
        TrustedDevice saved = trustedDeviceRepository.save(TrustedDevice.builder()
                .student(student)
                .deviceToken(token)
                .deviceName(req.deviceName())
                .browserInfo(req.browserInfo())
                .ipAddress(ipAddress)
                .trusted(true)
                .blocked(false)
                .lastUsedAt(Instant.now())
                .build());
        return new DeviceRegisterResponse(saved.getId(), saved.getDeviceToken(), saved.getTrusted());
    }

    // -------- Face profile bookkeeping --------

    /**
     * Records the face profile on this side once the AI service has accepted
     * it. The marking pipeline (Phase 4) checks `face_profiles` for the
     * student's row before allowing a face-verified attempt - without this
     * write, every mark after registration would fail with AI_001.
     *
     * @param studentId  internal student ID
     * @param profileId  opaque ID returned by the AI service (used as a path
     *                   indirection so we can locate the embedding later)
     */
    @Transactional
    public void recordFaceProfile(Long studentId, String profileId) {
        FaceProfile fp = faceProfileRepository.findByStudentId(studentId)
                .orElseGet(() -> FaceProfile.builder()
                        .student(studentRepository.getReferenceById(studentId))
                        .build());
        fp.setFaceEmbeddingPath(profileId);
        fp.setStatus(FaceProfile.Status.ACTIVE);
        faceProfileRepository.save(fp);
    }
}
