package com.attendai.domain.security;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProxyAlertRepository extends JpaRepository<ProxyAlert, Long> {

    @Modifying
    @Query("delete from ProxyAlert p where p.sessionId = :sessionId")
    void deleteBySessionId(@Param("sessionId") Long sessionId);

    Page<ProxyAlert> findBySeverityAndStatus(ProxyAlert.Severity severity, ProxyAlert.Status status, Pageable pageable);

    Page<ProxyAlert> findByStatus(ProxyAlert.Status status, Pageable pageable);

    long countByStudentIdAndStatus(Long studentId, ProxyAlert.Status status);
}
