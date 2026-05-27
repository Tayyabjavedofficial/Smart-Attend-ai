package com.attendai.domain.attendance;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {

    Optional<AttendanceSession> findBySessionCode(String sessionCode);

    Page<AttendanceSession> findByTeacherIdOrderByStartTimeDesc(Long teacherId, Pageable pageable);

    List<AttendanceSession> findByCourseIdAndSectionIdAndStatus(Long courseId, Long sectionId, SessionStatus status);

    List<AttendanceSession> findByStatus(SessionStatus status);
}
