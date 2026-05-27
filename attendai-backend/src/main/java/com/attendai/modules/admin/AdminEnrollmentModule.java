package com.attendai.modules.admin;

import com.attendai.common.exception.ResourceNotFoundException;
import com.attendai.common.response.ApiResponse;
import com.attendai.domain.course.*;
import com.attendai.domain.user.Student;
import com.attendai.domain.user.StudentRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

public class AdminEnrollmentModule {

    public record CreateEnrollmentRequest(
            @NotNull Long courseId,
            @NotNull Long sectionId,
            @NotEmpty List<Long> studentIds
    ) {}

    public record EnrollmentResult(int enrolled, int skipped) {}

    @Service
    @RequiredArgsConstructor
    public static class AdminEnrollmentService {

        private final StudentCourseRepository studentCourseRepository;
        private final StudentRepository studentRepository;
        private final CourseRepository courseRepository;
        private final SectionRepository sectionRepository;

        @Transactional
        public EnrollmentResult enroll(CreateEnrollmentRequest req) {
            Course course = courseRepository.findById(req.courseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course", req.courseId()));
            Section section = sectionRepository.findById(req.sectionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Section", req.sectionId()));

            int enrolled = 0, skipped = 0;
            for (Long sid : req.studentIds()) {
                Student student = studentRepository.findById(sid).orElse(null);
                if (student == null) {
                    skipped++;
                    continue;
                }
                if (studentCourseRepository.existsByStudentIdAndCourseIdAndSectionId(
                        sid, req.courseId(), req.sectionId())) {
                    skipped++;
                    continue;
                }
                studentCourseRepository.save(StudentCourse.builder()
                        .student(student).course(course).section(section).build());
                enrolled++;
            }
            return new EnrollmentResult(enrolled, skipped);
        }

        @Transactional(readOnly = true)
        public List<Long> studentsInCourseSection(Long courseId, Long sectionId) {
            return studentCourseRepository.findByCourseIdAndSectionId(courseId, sectionId)
                    .stream().map(sc -> sc.getStudent().getId()).toList();
        }

        @Transactional
        public void unenroll(Long enrollmentId) {
            if (!studentCourseRepository.existsById(enrollmentId)) {
                throw new ResourceNotFoundException("Enrollment", enrollmentId);
            }
            studentCourseRepository.deleteById(enrollmentId);
        }
    }

    @RestController
    @RequestMapping("/api/admin/enrollments")
    @RequiredArgsConstructor
    @PreAuthorize("hasRole('ADMIN')")
    @Tag(name = "Admin - Enrollments")
    public static class AdminEnrollmentController {

        private final AdminEnrollmentService service;

        @PostMapping
        @Operation(summary = "Enroll students in a course/section (API-ADMIN-10)")
        public ResponseEntity<ApiResponse<EnrollmentResult>> create(@Valid @RequestBody CreateEnrollmentRequest req) {
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(service.enroll(req)));
        }

        @GetMapping
        public ApiResponse<List<Long>> list(@RequestParam Long courseId, @RequestParam Long sectionId) {
            return ApiResponse.ok(service.studentsInCourseSection(courseId, sectionId));
        }

        @DeleteMapping("/{id}")
        public ApiResponse<Void> delete(@PathVariable Long id) {
            service.unenroll(id);
            return ApiResponse.success("Unenrolled");
        }
    }
}
