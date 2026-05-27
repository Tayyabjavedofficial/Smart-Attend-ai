package com.attendai.domain.security;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProxyAlertRepository extends JpaRepository<ProxyAlert, Long> {

    Page<ProxyAlert> findBySeverityAndStatus(ProxyAlert.Severity severity, ProxyAlert.Status status, Pageable pageable);

    Page<ProxyAlert> findByStatus(ProxyAlert.Status status, Pageable pageable);

    long countByStudentIdAndStatus(Long studentId, ProxyAlert.Status status);
}
