package com.attendai.modules.admin;

import com.attendai.common.exception.ResourceNotFoundException;
import com.attendai.common.response.ApiResponse;
import com.attendai.common.response.PageResponse;
import com.attendai.domain.security.ProxyAlert;
import com.attendai.domain.security.ProxyAlertRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

public class AdminProxyAlertModule {

    public record AlertDto(
            Long id, Long studentId, Long sessionId, Long challengeId,
            String alertType, ProxyAlert.Severity severity,
            String description, Integer riskScore,
            ProxyAlert.Status status, Instant createdAt
    ) {
        public static AlertDto from(ProxyAlert a) {
            return new AlertDto(a.getId(),
                    a.getStudent().getId(),
                    a.getSessionId(), a.getChallengeId(),
                    a.getAlertType(), a.getSeverity(), a.getDescription(),
                    a.getRiskScore(), a.getStatus(), a.getCreatedAt());
        }
    }

    public record UpdateAlertRequest(
            @NotNull ProxyAlert.Status status,
            @Size(max = 500) String resolutionNote
    ) {}

    @Service
    @RequiredArgsConstructor
    public static class AdminProxyAlertService {

        private final ProxyAlertRepository alertRepository;

        @Transactional(readOnly = true)
        public Page<AlertDto> list(ProxyAlert.Severity severity, ProxyAlert.Status status, Pageable pageable) {
            Page<ProxyAlert> page = (severity != null && status != null)
                    ? alertRepository.findBySeverityAndStatus(severity, status, pageable)
                    : status != null
                        ? alertRepository.findByStatus(status, pageable)
                        : alertRepository.findAll(pageable);
            return page.map(AlertDto::from);
        }

        @Transactional
        public AlertDto update(Long id, UpdateAlertRequest req) {
            ProxyAlert alert = alertRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("ProxyAlert", id));
            alert.setStatus(req.status());
            alert.setResolutionNote(req.resolutionNote());
            return AlertDto.from(alertRepository.save(alert));
        }
    }

    @RestController
    @RequestMapping("/api/admin/proxy-alerts")
    @RequiredArgsConstructor
    @PreAuthorize("hasRole('ADMIN')")
    @Tag(name = "Admin - Proxy Alerts")
    public static class AdminProxyAlertController {

        private final AdminProxyAlertService service;

        @GetMapping
        @Operation(summary = "List proxy alerts (API-ADMIN-12)")
        public ApiResponse<PageResponse<AlertDto>> list(
                @RequestParam(required = false) ProxyAlert.Severity severity,
                @RequestParam(required = false) ProxyAlert.Status status,
                Pageable pageable
        ) {
            return ApiResponse.ok(PageResponse.from(service.list(severity, status, pageable)));
        }

        @PutMapping("/{id}")
        @Operation(summary = "Update alert status (API-ADMIN-13)")
        public ApiResponse<AlertDto> update(@PathVariable Long id, @Valid @RequestBody UpdateAlertRequest req) {
            return ApiResponse.ok(service.update(id, req));
        }
    }
}
