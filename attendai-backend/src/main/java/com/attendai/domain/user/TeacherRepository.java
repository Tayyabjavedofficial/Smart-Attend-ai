package com.attendai.domain.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {

    Optional<Teacher> findByUserId(Long userId);

    Optional<Teacher> findByEmployeeId(String employeeId);

    boolean existsByEmployeeId(String employeeId);

    @Query("""
            select t from Teacher t
            where (:department is null or t.department = :department)
              and (:search is null
                   or lower(t.user.fullName) like lower(concat('%', :search, '%'))
                   or lower(t.employeeId) like lower(concat('%', :search, '%')))
            """)
    Page<Teacher> search(@Param("department") String department,
                         @Param("search") String search,
                         Pageable pageable);
}
