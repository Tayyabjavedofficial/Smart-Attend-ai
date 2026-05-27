package com.attendai.modules.admin;

import com.attendai.common.exception.ApiException;
import com.attendai.common.exception.ResourceNotFoundException;
import com.attendai.common.response.ApiResponse;
import com.attendai.domain.course.*;
import com.attendai.domain.user.Teacher;
import com.attendai.domain.user.TeacherRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

public class AdminTeacherAssignmentModule {

    public record CreateAssignmentRequest(
            @NotNull Long teacherId,
            @NotNull Long courseId,
            @NotNull Long sectionId
    ) {}

    public record AssignmentDto(
            Long id, Long teacherId, String teacherName,
            Long courseId, String courseCode, String courseName,
            Long sectionId, String sectionName
    ) {
        public static AssignmentDto from(TeacherCourse tc) {
            return new AssignmentDto(
                    tc.getId(),
                    tc.getTeacher().getId(),
                    tc.getTeacher().getUser().getFullName(),
                    tc.getCourse().getId(),
                    tc.getCourse().getCourseCode(),
                    tc.getCourse().getCourseName(),
                    tc.getSection().getId(),
                    tc.getSection().getSectionName()
            );
        }
    }

    @Service
    @RequiredArgsConstructor
    public static class AdminTeacherAssignmentService {

        private final TeacherCourseRepository teacherCourseRepository;
        private final TeacherRepository teacherRepository;
        private final CourseRepository courseRepository;
        private final SectionRepository sectionRepository;

        @Transactional
        public AssignmentDto assign(CreateAssignmentRequest req) {
            if (teacherCourseRepository.existsByTeacherIdAndCourseIdAndSectionId(
                    req.teacherId(), req.courseId(), req.sectionId())) {
                throw new ApiException(HttpStatus.CONFLICT, "ASSIGNMENT_DUPLICATE",
                        "Teacher is already assigned to that course/section");
            }
            Teacher teacher = teacherRepository.findById(req.teacherId())
                    .orElseThrow(() -> new ResourceNotFoundException("Teacher", req.teacherId()));
            Course course = courseRepository.findById(req.courseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course", req.courseId()));
            Section section = sectionRepository.findById(req.sectionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Section", req.sectionId()));

            TeacherCourse saved = teacherCourseRepository.save(TeacherCourse.builder()
                    .teacher(teacher).course(course).section(section).build());
            return AssignmentDto.from(saved);
        }

        @Transactional(readOnly = true)
        public List<AssignmentDto> list(Long teacherId) {
            var list = teacherId != null
                    ? teacherCourseRepository.findByTeacherId(teacherId)
                    : teacherCourseRepository.findAll();
            return list.stream().map(AssignmentDto::from).toList();
        }

        @Transactional
        public void remove(Long id) {
            if (!teacherCourseRepository.existsById(id)) {
                throw new ResourceNotFoundException("Assignment", id);
            }
            teacherCourseRepository.deleteById(id);
        }
    }

    @RestController
    @RequestMapping("/api/admin/teacher-assignments")
    @RequiredArgsConstructor
    @PreAuthorize("hasRole('ADMIN')")
    @Tag(name = "Admin - Teacher Assignments")
    public static class AdminTeacherAssignmentController {

        private final AdminTeacherAssignmentService service;

        @PostMapping
        @Operation(summary = "Assign teacher to course/section (API-ADMIN-11)")
        public ResponseEntity<ApiResponse<AssignmentDto>> assign(@Valid @RequestBody CreateAssignmentRequest req) {
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(service.assign(req)));
        }

        @GetMapping
        public ApiResponse<List<AssignmentDto>> list(@RequestParam(required = false) Long teacherId) {
            return ApiResponse.ok(service.list(teacherId));
        }

        @DeleteMapping("/{id}")
        public ApiResponse<Void> delete(@PathVariable Long id) {
            service.remove(id);
            return ApiResponse.success("Assignment removed");
        }
    }
}
