package com.attendai.modules.reports;

import com.attendai.common.util.SecurityUtils;
import com.attendai.domain.security.ProxyAlert;
import com.attendai.modules.reports.data.ReportData;
import com.attendai.modules.reports.export.ExportFormat;
import com.attendai.modules.reports.export.Exporter;
import com.attendai.modules.reports.export.ExporterRegistry;
import com.attendai.modules.student.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;

/**
 * Report endpoints. Two parallel API styles are exposed:
 *
 *  <ul>
 *   <li><b>JSON</b> ({@code GET /api/reports/<type>}) — for in-app preview
 *       widgets. Returns the canonical {@link ReportData} so the frontend can
 *       render it directly without parsing CSV / PDF.</li>
 *   <li><b>File</b> ({@code GET /api/reports/<type>/export?format=csv|xlsx|pdf})
 *       — downloads the same report rendered for offline use, including the
 *       correct Content-Disposition so browsers prompt to save.</li>
 *  </ul>
 *
 * Access control:
 *  <ul>
 *   <li>ADMIN — any report</li>
 *   <li>TEACHER — any report (currently no extra scoping; tighten by adding
 *       per-course ownership checks if needed)</li>
 *   <li>STUDENT — only their own student report</li>
 *  </ul>
 */
@Slf4j
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports")
public class ReportController {

    private final ReportService reportService;
    private final ExporterRegistry exporters;
    private final StudentService studentService;

    private static final DateTimeFormatter FILENAME_TS = new DateTimeFormatterBuilder()
            .appendPattern("yyyyMMdd-HHmmss")
            .toFormatter();

    // ============================================================
    // Student report
    // ============================================================

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @Operation(summary = "Student attendance report (JSON)")
    public ReportData studentJson(
            @PathVariable Long studentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        ensureStudentScope(studentId);
        return reportService.studentReport(studentId, toInstant(from), toInstant(to));
    }

    @GetMapping("/student/{studentId}/export")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    @Operation(summary = "Student attendance report (file)")
    public ResponseEntity<byte[]> studentExport(
            @PathVariable Long studentId,
            @RequestParam String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        ensureStudentScope(studentId);
        ReportData data = reportService.studentReport(studentId, toInstant(from), toInstant(to));
        return file(data, "student-" + studentId, format);
    }

    // ============================================================
    // Course report
    // ============================================================

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ReportData courseJson(
            @PathVariable Long courseId,
            @RequestParam(required = false) Long sectionId
    ) {
        return reportService.courseReport(courseId, sectionId);
    }

    @GetMapping("/course/{courseId}/export")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<byte[]> courseExport(
            @PathVariable Long courseId,
            @RequestParam(required = false) Long sectionId,
            @RequestParam String format
    ) {
        ReportData data = reportService.courseReport(courseId, sectionId);
        return file(data, "course-" + courseId, format);
    }

    // ============================================================
    // Defaulters
    // ============================================================

    @GetMapping("/defaulters")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ReportData defaultersJson(@RequestParam(required = false) Double threshold) {
        return reportService.defaultersReport(threshold);
    }

    @GetMapping("/defaulters/export")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<byte[]> defaultersExport(
            @RequestParam(required = false) Double threshold,
            @RequestParam String format
    ) {
        return file(reportService.defaultersReport(threshold), "defaulters", format);
    }

    // ============================================================
    // Proxy alerts
    // ============================================================

    @GetMapping("/proxy-alerts")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ReportData proxyAlertsJson(
            @RequestParam(required = false) ProxyAlert.Status status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return reportService.proxyAlertsReport(status, toInstant(from), toInstant(to));
    }

    @GetMapping("/proxy-alerts/export")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<byte[]> proxyAlertsExport(
            @RequestParam(required = false) ProxyAlert.Status status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam String format
    ) {
        return file(
                reportService.proxyAlertsReport(status, toInstant(from), toInstant(to)),
                "proxy-alerts", format);
    }

    // ============================================================
    // Date-range summary
    // ============================================================

    @GetMapping("/range")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ReportData rangeJson(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long courseId
    ) {
        return reportService.dateRangeReport(from, to, courseId);
    }

    @GetMapping("/range/export")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<byte[]> rangeExport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long courseId,
            @RequestParam String format
    ) {
        return file(reportService.dateRangeReport(from, to, courseId),
                "range-" + from + "-to-" + to, format);
    }

    // ============================================================
    // Internals
    // ============================================================

    private ResponseEntity<byte[]> file(ReportData report, String basename, String format) {
        ExportFormat fmt = ExportFormat.parse(format);
        Exporter exporter = exporters.forFormat(fmt);
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            exporter.write(report, baos);
            byte[] bytes = baos.toByteArray();
            String filename = basename + "-" + FILENAME_TS.format(report.generatedAt()
                            .atZone(java.time.ZoneOffset.UTC)) + "." + exporter.fileExtension();
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(exporter.mimeType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .body(bytes);
        } catch (IOException e) {
            throw new RuntimeException("Failed to render report: " + e.getMessage(), e);
        }
    }

    private static Instant toInstant(LocalDate d) {
        return d == null ? null : d.atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
    }

    /**
     * Students may only read their own report. ADMIN/TEACHER are unrestricted
     * (the @PreAuthorize gate already ensured authorisation).
     */
    private void ensureStudentScope(Long requestedStudentId) {
        if (SecurityUtils.hasRole("STUDENT")) {
            Long ownStudentId = studentService.currentStudent().getId();
            if (!ownStudentId.equals(requestedStudentId)) {
                throw new com.attendai.common.exception.ApiException(
                        org.springframework.http.HttpStatus.FORBIDDEN,
                        "REPORT_FORBIDDEN",
                        "Students may only access their own report");
            }
        }
    }
}
