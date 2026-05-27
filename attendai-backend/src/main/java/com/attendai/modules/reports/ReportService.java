package com.attendai.modules.reports;

import com.attendai.common.exception.ResourceNotFoundException;
import com.attendai.config.AppProperties;
import com.attendai.domain.attendance.AttendanceRecord;
import com.attendai.domain.attendance.AttendanceRecordRepository;
import com.attendai.domain.attendance.AttendanceStatus;
import com.attendai.domain.course.*;
import com.attendai.domain.security.ProxyAlert;
import com.attendai.domain.security.ProxyAlertRepository;
import com.attendai.domain.user.Student;
import com.attendai.domain.user.StudentRepository;
import com.attendai.modules.reports.data.ReportData;
import com.attendai.modules.reports.data.ReportData.Column;
import com.attendai.modules.reports.data.ReportData.Column.Align;
import com.attendai.modules.reports.data.ReportData.Summary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Builds canonical {@link ReportData} for each report type. The shape is
 * format-agnostic - the same ReportData renders as CSV, XLSX or PDF via
 * {@link com.attendai.modules.reports.export.Exporter}.
 *
 * Aggregations are done in Java rather than SQL to keep the service portable
 * across DBs. For class-sized data (thousands, not millions) this is fast
 * enough; swap in JPA @Query methods if it ever becomes a hot path.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final AttendanceRecordRepository recordRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final StudentCourseRepository studentCourseRepository;
    private final ProxyAlertRepository proxyAlertRepository;
    private final AppProperties props;

    private static final DateTimeFormatter HUMAN_DATE =
            DateTimeFormatter.ofPattern("MMM d, yyyy").withZone(ZoneOffset.UTC);

    // ============================================================
    // Student-wise report
    // ============================================================

    @Transactional(readOnly = true)
    public ReportData studentReport(Long studentId, Instant from, Instant to) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        Instant rangeFrom = from != null ? from : Instant.EPOCH;
        Instant rangeTo = to != null ? to : Instant.now();

        List<AttendanceRecord> records = recordRepository
                .findByStudentIdAndMarkedAtBetween(studentId, rangeFrom, rangeTo);

        // Group by course code.
        Map<String, List<AttendanceRecord>> byCourse = new TreeMap<>();
        for (AttendanceRecord r : records) {
            byCourse.computeIfAbsent(r.getSession().getCourse().getCourseCode(), k -> new ArrayList<>()).add(r);
        }

        List<List<Object>> rows = new ArrayList<>();
        int totalPresent = 0, totalLate = 0, totalAbsent = 0;
        for (var entry : byCourse.entrySet()) {
            String code = entry.getKey();
            List<AttendanceRecord> rs = entry.getValue();
            String name = rs.get(0).getSession().getCourse().getCourseName();
            long present = rs.stream().filter(r -> isAttended(r.getStatus())).count();
            long late = rs.stream().filter(r -> r.getStatus() == AttendanceStatus.LATE).count();
            long absent = rs.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();
            int total = rs.size();
            double pct = total > 0 ? (present * 100.0 / total) : 0;
            rows.add(List.of(code, name, total, present, late, absent, String.format("%.1f%%", pct)));
            totalPresent += present; totalLate += late; totalAbsent += absent;
        }

        int totalSessions = records.size();
        double overall = totalSessions > 0 ? (totalPresent * 100.0 / totalSessions) : 0;

        return ReportData.builder("Student Attendance Report")
                .subtitle(student.getUser().getFullName() + "  ·  " + student.getRegistrationNumber())
                .filter("Range", HUMAN_DATE.format(rangeFrom) + " — " + HUMAN_DATE.format(rangeTo))
                .filter("Department", student.getDepartment())
                .summary(List.of(
                        new Summary("Overall", String.format("%.1f%%", overall)),
                        new Summary("Sessions", String.valueOf(totalSessions)),
                        new Summary("Present", String.valueOf(totalPresent)),
                        new Summary("Absent", String.valueOf(totalAbsent))
                ))
                .columns(List.of(
                        new Column("Course Code", "code"),
                        new Column("Course Name", "name"),
                        new Column("Total", "total", Align.RIGHT),
                        new Column("Present", "present", Align.RIGHT),
                        new Column("Late", "late", Align.RIGHT),
                        new Column("Absent", "absent", Align.RIGHT),
                        new Column("Percentage", "pct", Align.RIGHT)
                ))
                .rows(rows)
                .build();
    }

    // ============================================================
    // Course-wise report
    // ============================================================

    @Transactional(readOnly = true)
    public ReportData courseReport(Long courseId, Long sectionId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));

        // Enrolled students - optionally filtered by section.
        List<StudentCourse> enrollments = studentCourseRepository.findByCourseId(courseId).stream()
                .filter(sc -> sectionId == null || sc.getSection().getId().equals(sectionId))
                .toList();

        List<List<Object>> rows = new ArrayList<>();
        double pctSum = 0;
        int below = 0;
        double threshold = props.attendance().minimumPercentage();

        for (StudentCourse sc : enrollments) {
            Student s = sc.getStudent();
            List<AttendanceRecord> rs = recordRepository
                    .findByStudentIdAndMarkedAtBetween(s.getId(), Instant.EPOCH, Instant.now()).stream()
                    .filter(r -> r.getSession().getCourse().getId().equals(courseId))
                    .toList();
            long present = rs.stream().filter(r -> isAttended(r.getStatus())).count();
            long late = rs.stream().filter(r -> r.getStatus() == AttendanceStatus.LATE).count();
            long absent = rs.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();
            int total = rs.size();
            double pct = total > 0 ? (present * 100.0 / total) : 0;
            pctSum += pct;
            if (pct < threshold) below++;
            rows.add(List.of(
                    s.getRegistrationNumber(), s.getUser().getFullName(),
                    sc.getSection().getSectionName(),
                    total, present, late, absent,
                    String.format("%.1f%%", pct)
            ));
        }

        double avg = enrollments.isEmpty() ? 0 : pctSum / enrollments.size();

        return ReportData.builder("Course Attendance Report")
                .subtitle(course.getCourseCode() + "  ·  " + course.getCourseName())
                .filter("Department", course.getDepartment())
                .filter("Section", sectionId == null ? "All sections" :
                        sectionRepository.findById(sectionId).map(Section::getSectionName).orElse("?"))
                .summary(List.of(
                        new Summary("Enrolled", String.valueOf(enrollments.size())),
                        new Summary("Avg attendance", String.format("%.1f%%", avg)),
                        new Summary("Below threshold", String.valueOf(below))
                ))
                .columns(List.of(
                        new Column("Reg No.", "reg"),
                        new Column("Student", "name"),
                        new Column("Section", "section"),
                        new Column("Total", "total", Align.RIGHT),
                        new Column("Present", "present", Align.RIGHT),
                        new Column("Late", "late", Align.RIGHT),
                        new Column("Absent", "absent", Align.RIGHT),
                        new Column("Percentage", "pct", Align.RIGHT)
                ))
                .rows(rows)
                .build();
    }

    // ============================================================
    // Defaulters
    // ============================================================

    @Transactional(readOnly = true)
    public ReportData defaultersReport(Double thresholdOverride) {
        double threshold = thresholdOverride != null ? thresholdOverride : props.attendance().minimumPercentage();

        // Aggregate per student across all their enrolled courses.
        record Row(String reg, String name, String dept, int total, long present, double pct) {}
        List<Row> data = new ArrayList<>();

        for (Student s : studentRepository.findAll()) {
            List<AttendanceRecord> rs = recordRepository
                    .findByStudentIdAndMarkedAtBetween(s.getId(), Instant.EPOCH, Instant.now());
            int total = rs.size();
            if (total == 0) continue;
            long present = rs.stream().filter(r -> isAttended(r.getStatus())).count();
            double pct = present * 100.0 / total;
            if (pct < threshold) {
                data.add(new Row(s.getRegistrationNumber(), s.getUser().getFullName(),
                        s.getDepartment(), total, present, pct));
            }
        }

        // Sort ascending - worst offenders at the top.
        data.sort(Comparator.comparingDouble(Row::pct));

        List<List<Object>> rows = data.stream().map(d -> (List<Object>) List.<Object>of(
                d.reg(), d.name(), d.dept(), d.total(), d.present(),
                String.format("%.1f%%", d.pct()),
                String.format("%.1f%%", threshold - d.pct())
        )).toList();

        return ReportData.builder("Defaulter Report")
                .subtitle("Students below the " + String.format("%.0f%%", threshold) + " attendance threshold")
                .filter("Threshold", String.format("%.0f%%", threshold))
                .summary(List.of(
                        new Summary("Total defaulters", String.valueOf(data.size())),
                        new Summary("Threshold", String.format("%.0f%%", threshold))
                ))
                .columns(List.of(
                        new Column("Reg No.", "reg"),
                        new Column("Student", "name"),
                        new Column("Department", "dept"),
                        new Column("Sessions", "total", Align.RIGHT),
                        new Column("Present", "present", Align.RIGHT),
                        new Column("Attendance", "pct", Align.RIGHT),
                        new Column("Short by", "short", Align.RIGHT)
                ))
                .rows(rows)
                .build();
    }

    // ============================================================
    // Proxy alerts
    // ============================================================

    @Transactional(readOnly = true)
    public ReportData proxyAlertsReport(ProxyAlert.Status statusFilter, Instant from, Instant to) {
        Instant rangeFrom = from != null ? from : Instant.EPOCH;
        Instant rangeTo = to != null ? to : Instant.now();

        List<ProxyAlert> alerts = proxyAlertRepository.findAll().stream()
                .filter(a -> statusFilter == null || a.getStatus() == statusFilter)
                .filter(a -> a.getCreatedAt() != null
                        && !a.getCreatedAt().isBefore(rangeFrom)
                        && !a.getCreatedAt().isAfter(rangeTo))
                .sorted(Comparator.comparing(ProxyAlert::getCreatedAt).reversed())
                .toList();

        List<List<Object>> rows = alerts.stream().map(a -> (List<Object>) List.<Object>of(
                a.getId(),
                a.getStudent().getRegistrationNumber(),
                a.getStudent().getUser().getFullName(),
                a.getAlertType(),
                a.getSeverity().name(),
                a.getRiskScore(),
                a.getStatus().name(),
                HUMAN_DATE.format(a.getCreatedAt())
        )).toList();

        long open = alerts.stream().filter(a -> a.getStatus() == ProxyAlert.Status.OPEN).count();
        long critical = alerts.stream().filter(a -> a.getSeverity() == ProxyAlert.Severity.CRITICAL).count();

        return ReportData.builder("Proxy Alerts Report")
                .subtitle("AI-flagged suspicious attendance attempts")
                .filter("Status", statusFilter != null ? statusFilter.name() : "All")
                .filter("Range", HUMAN_DATE.format(rangeFrom) + " — " + HUMAN_DATE.format(rangeTo))
                .summary(List.of(
                        new Summary("Total alerts", String.valueOf(alerts.size())),
                        new Summary("Open", String.valueOf(open)),
                        new Summary("Critical", String.valueOf(critical))
                ))
                .columns(List.of(
                        new Column("Alert ID", "id", Align.RIGHT),
                        new Column("Reg No.", "reg"),
                        new Column("Student", "name"),
                        new Column("Type", "type"),
                        new Column("Severity", "severity", Align.CENTER),
                        new Column("Risk", "risk", Align.RIGHT),
                        new Column("Status", "status"),
                        new Column("Created", "created")
                ))
                .rows(rows)
                .build();
    }

    // ============================================================
    // Daily / monthly summary - attendance % over a date range
    // ============================================================

    @Transactional(readOnly = true)
    public ReportData dateRangeReport(LocalDate from, LocalDate to, Long courseId) {
        Instant rangeFrom = from.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant rangeTo = to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        // Pull all records in range; aggregate per-day.
        Map<LocalDate, int[]> byDay = new TreeMap<>();
        // Iterate every student to gather their records in range (small scale).
        for (Student s : studentRepository.findAll()) {
            List<AttendanceRecord> rs = recordRepository
                    .findByStudentIdAndMarkedAtBetween(s.getId(), rangeFrom, rangeTo);
            for (AttendanceRecord r : rs) {
                if (courseId != null && !r.getSession().getCourse().getId().equals(courseId)) continue;
                LocalDate day = r.getMarkedAt().atZone(ZoneOffset.UTC).toLocalDate();
                int[] counts = byDay.computeIfAbsent(day, k -> new int[3]); // present, late, absent
                if (isAttended(r.getStatus())) counts[0]++;
                else if (r.getStatus() == AttendanceStatus.LATE) counts[1]++;
                else if (r.getStatus() == AttendanceStatus.ABSENT) counts[2]++;
            }
        }

        List<List<Object>> rows = new ArrayList<>();
        int totalP = 0, totalL = 0, totalA = 0;
        for (var e : byDay.entrySet()) {
            int p = e.getValue()[0], l = e.getValue()[1], a = e.getValue()[2];
            int total = p + l + a;
            double pct = total > 0 ? (p * 100.0 / total) : 0;
            rows.add(List.of(e.getKey().toString(), total, p, l, a, String.format("%.1f%%", pct)));
            totalP += p; totalL += l; totalA += a;
        }
        int totalAll = totalP + totalL + totalA;
        double overallPct = totalAll > 0 ? (totalP * 100.0 / totalAll) : 0;

        return ReportData.builder("Attendance Summary Report")
                .subtitle("Daily attendance breakdown over the selected period")
                .filter("Range", HUMAN_DATE.format(rangeFrom) + " — " + HUMAN_DATE.format(rangeTo))
                .filter("Course", courseId == null ? "All courses" :
                        courseRepository.findById(courseId).map(Course::getCourseCode).orElse("?"))
                .summary(List.of(
                        new Summary("Overall", String.format("%.1f%%", overallPct)),
                        new Summary("Marks", String.valueOf(totalAll)),
                        new Summary("Days covered", String.valueOf(byDay.size()))
                ))
                .columns(List.of(
                        new Column("Date", "date"),
                        new Column("Total", "total", Align.RIGHT),
                        new Column("Present", "present", Align.RIGHT),
                        new Column("Late", "late", Align.RIGHT),
                        new Column("Absent", "absent", Align.RIGHT),
                        new Column("Percentage", "pct", Align.RIGHT)
                ))
                .rows(rows)
                .build();
    }

    // ---- helpers ----

    private static boolean isAttended(AttendanceStatus s) {
        return s == AttendanceStatus.PRESENT
                || s == AttendanceStatus.MANUAL_PRESENT
                || s == AttendanceStatus.EXCUSED;
    }
}
