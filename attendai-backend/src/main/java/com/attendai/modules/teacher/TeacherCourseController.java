package com.attendai.modules.teacher;

import com.attendai.common.response.ApiResponse;
import com.attendai.common.util.SecurityUtils;
import com.attendai.domain.course.TeacherCourseRepository;
import com.attendai.domain.user.TeacherRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
@Tag(name = "Teacher - Courses")
public class TeacherCourseController {

    private final TeacherRepository teacherRepository;
    private final TeacherCourseRepository teacherCourseRepository;

    @GetMapping("/courses")
    @Operation(summary = "List courses assigned to the current teacher (API-TEACHER-01)")
    public ApiResponse<List<Map<String, Object>>> myCourses() {
        Long userId = SecurityUtils.currentUserId();
        var teacher = teacherRepository.findByUserId(userId).orElseThrow();
        var assignments = teacherCourseRepository.findByTeacherId(teacher.getId());
        var result = assignments.stream().map(tc -> Map.<String, Object>of(
                "assignmentId", tc.getId(),
                "courseId", tc.getCourse().getId(),
                "courseCode", tc.getCourse().getCourseCode(),
                "courseName", tc.getCourse().getCourseName(),
                "sectionId", tc.getSection().getId(),
                "sectionName", tc.getSection().getSectionName()
        )).toList();
        return ApiResponse.ok(result);
    }
}
