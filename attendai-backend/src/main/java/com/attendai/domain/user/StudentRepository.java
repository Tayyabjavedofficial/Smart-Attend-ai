package com.attendai.domain.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByUserId(Long userId);

    Optional<Student> findByRegistrationNumber(String registrationNumber);

    boolean existsByRegistrationNumber(String registrationNumber);

    /** Self-registered students awaiting admin approval, oldest first. */
    List<Student> findByUser_StatusOrderByCreatedAtAsc(UserStatus status);

    /** Students whose home section is the given one (for the section roster). */
    List<Student> findBySectionId(Long sectionId);

    long countBySectionId(Long sectionId);

    /**
     * Student head-count per section in one query (avoids an N+1 over sections).
     * Each row is {@code [sectionId, count]}; sections with no students are absent.
     */
    @Query("select s.section.id, count(s) from Student s where s.section is not null group by s.section.id")
    List<Object[]> countGroupedBySection();

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
