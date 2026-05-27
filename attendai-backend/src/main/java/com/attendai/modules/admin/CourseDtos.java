package com.attendai.modules.admin;

import com.attendai.domain.course.Course;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public final class CourseDtos {

    private CourseDtos() {}

    public record CreateCourseRequest(
            @NotBlank @Size(max = 20) String courseCode,
            @NotBlank @Size(max = 120) String courseName,
            @Positive Integer creditHours,
            @Size(max = 80) String department
    ) {}

    public record UpdateCourseRequest(
            @Size(max = 120) String courseName,
            @Positive Integer creditHours,
            @Size(max = 80) String department
    ) {}

    public record CourseDto(
            Long id,
            String courseCode,
            String courseName,
            Integer creditHours,
            String department
    ) {
        public static CourseDto from(Course c) {
            return new CourseDto(c.getId(), c.getCourseCode(), c.getCourseName(),
                    c.getCreditHours(), c.getDepartment());
        }
    }
}
