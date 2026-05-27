package com.attendai.modules.admin;

import com.attendai.common.exception.ApiException;
import com.attendai.common.exception.ResourceNotFoundException;
import com.attendai.domain.course.Course;
import com.attendai.domain.course.CourseRepository;
import com.attendai.modules.admin.CourseDtos.CourseDto;
import com.attendai.modules.admin.CourseDtos.CreateCourseRequest;
import com.attendai.modules.admin.CourseDtos.UpdateCourseRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminCourseService {

    private final CourseRepository courseRepository;

    @Transactional
    public CourseDto create(CreateCourseRequest req) {
        if (courseRepository.existsByCourseCode(req.courseCode())) {
            throw new ApiException(HttpStatus.CONFLICT, "COURSE_DUPLICATE_CODE",
                    "Course code already in use: " + req.courseCode());
        }
        Course c = courseRepository.save(Course.builder()
                .courseCode(req.courseCode())
                .courseName(req.courseName())
                .creditHours(req.creditHours())
                .department(req.department())
                .build());
        return CourseDto.from(c);
    }

    @Transactional(readOnly = true)
    public List<CourseDto> list() {
        return courseRepository.findAll().stream().map(CourseDto::from).toList();
    }

    @Transactional(readOnly = true)
    public CourseDto get(Long id) {
        return courseRepository.findById(id).map(CourseDto::from)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id));
    }

    @Transactional
    public CourseDto update(Long id, UpdateCourseRequest req) {
        Course c = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id));
        if (req.courseName() != null) c.setCourseName(req.courseName());
        if (req.creditHours() != null) c.setCreditHours(req.creditHours());
        if (req.department() != null) c.setDepartment(req.department());
        return CourseDto.from(courseRepository.save(c));
    }

    @Transactional
    public void delete(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Course", id);
        }
        courseRepository.deleteById(id);
    }
}
