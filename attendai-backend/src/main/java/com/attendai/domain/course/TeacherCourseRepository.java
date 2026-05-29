package com.attendai.domain.course;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TeacherCourseRepository extends JpaRepository<TeacherCourse, Long> {

    boolean existsByTeacherIdAndCourseIdAndSectionId(Long teacherId, Long courseId, Long sectionId);

    List<TeacherCourse> findByTeacherId(Long teacherId);

    boolean existsByTeacherIdAndCourseId(Long teacherId, Long courseId);

    /** The subjects offered in a section, each paired with its teacher. */
    List<TeacherCourse> findBySectionId(Long sectionId);

    /**
     * Distinct subject count per section in one query (avoids an N+1 over
     * sections). Each row is {@code [sectionId, distinctCourseCount]}.
     */
    @Query("select tc.section.id, count(distinct tc.course.id) from TeacherCourse tc group by tc.section.id")
    List<Object[]> countCoursesGroupedBySection();
}
