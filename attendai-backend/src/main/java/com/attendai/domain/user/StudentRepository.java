package com.attendai.domain.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByUserId(Long userId);

    Optional<Student> findByRegistrationNumber(String registrationNumber);

    boolean existsByRegistrationNumber(String registrationNumber);

    @Query("""
            select s from Student s
            where (:sectionId is null or s.section.id = :sectionId)
              and (:department is null or s.department = :department)
              and (:search is null
                   or lower(s.user.fullName) like lower(concat('%', :search, '%'))
                   or lower(s.registrationNumber) like lower(concat('%', :search, '%')))
            """)
    Page<Student> search(@Param("sectionId") Long sectionId,
                         @Param("department") String department,
                         @Param("search") String search,
                         Pageable pageable);
}
