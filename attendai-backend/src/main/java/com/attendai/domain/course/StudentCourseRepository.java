package com.attendai.domain.course;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentCourseRepository extends JpaRepository<StudentCourse, Long> {

    boolean existsByStudentIdAndCourseIdAndSectionId(Long studentId, Long courseId, Long sectionId);

    List<StudentCourse> findByStudentId(Long studentId);

    List<StudentCourse> findByCourseId(Long courseId);

    List<StudentCourse> findByCourseIdAndSectionId(Long courseId, Long sectionId);
}
