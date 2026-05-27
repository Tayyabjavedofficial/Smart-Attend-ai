package com.attendai.domain.course;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeacherCourseRepository extends JpaRepository<TeacherCourse, Long> {

    boolean existsByTeacherIdAndCourseIdAndSectionId(Long teacherId, Long courseId, Long sectionId);

    List<TeacherCourse> findByTeacherId(Long teacherId);

    boolean existsByTeacherIdAndCourseId(Long teacherId, Long courseId);
}
