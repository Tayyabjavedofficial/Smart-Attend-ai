package com.attendai.domain.security;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrustedDeviceRepository extends JpaRepository<TrustedDevice, Long> {

    Optional<TrustedDevice> findByDeviceToken(String deviceToken);

    List<TrustedDevice> findByStudentId(Long studentId);

    /** Used by the multi-account detection rule in the risk scorer. */
    @org.springframework.data.jpa.repository.Query("""
            select count(distinct td.student.id)
            from TrustedDevice td
            where td.deviceToken = :token
            """)
    long countDistinctStudentsForToken(@org.springframework.data.repository.query.Param("token") String token);
}
