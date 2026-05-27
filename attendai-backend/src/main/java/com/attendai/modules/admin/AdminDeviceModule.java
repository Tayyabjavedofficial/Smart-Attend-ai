package com.attendai.modules.admin;

import com.attendai.common.exception.ResourceNotFoundException;
import com.attendai.common.response.ApiResponse;
import com.attendai.domain.security.TrustedDevice;
import com.attendai.domain.security.TrustedDeviceRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

public class AdminDeviceModule {

    public enum DeviceAction { APPROVE, BLOCK, REMOVE }

    public record DeviceDto(
            Long id, Long studentId, String studentName,
            String deviceName, String browserInfo, String ipAddress,
            Boolean trusted, Boolean blocked,
            Instant lastUsedAt, Instant createdAt
    ) {
        public static DeviceDto from(TrustedDevice d) {
            return new DeviceDto(d.getId(),
                    d.getStudent().getId(),
                    d.getStudent().getUser().getFullName(),
                    d.getDeviceName(), d.getBrowserInfo(), d.getIpAddress(),
                    d.getTrusted(), d.getBlocked(),
                    d.getLastUsedAt(), d.getCreatedAt());
        }
    }

    public record UpdateDeviceRequest(@NotNull DeviceAction action) {}

    @Service
    @RequiredArgsConstructor
    public static class AdminDeviceService {

        private final TrustedDeviceRepository deviceRepository;

        @Transactional(readOnly = true)
        public List<DeviceDto> list() {
            return deviceRepository.findAll().stream().map(DeviceDto::from).toList();
        }

        @Transactional
        public DeviceDto update(Long id, UpdateDeviceRequest req) {
            TrustedDevice d = deviceRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("TrustedDevice", id));
            switch (req.action()) {
                case APPROVE -> { d.setTrusted(true); d.setBlocked(false); }
                case BLOCK -> { d.setBlocked(true); d.setTrusted(false); }
                case REMOVE -> {
                    deviceRepository.delete(d);
                    return DeviceDto.from(d);
                }
            }
            return DeviceDto.from(deviceRepository.save(d));
        }
    }

    @RestController
    @RequestMapping("/api/admin/devices")
    @RequiredArgsConstructor
    @PreAuthorize("hasRole('ADMIN')")
    @Tag(name = "Admin - Trusted Devices")
    public static class AdminDeviceController {

        private final AdminDeviceService service;

        @GetMapping
        @Operation(summary = "List trusted devices (API-ADMIN-14)")
        public ApiResponse<List<DeviceDto>> list() {
            return ApiResponse.ok(service.list());
        }

        @PutMapping("/{id}")
        @Operation(summary = "Approve, block, or remove a device (API-ADMIN-15)")
        public ApiResponse<DeviceDto> update(@PathVariable Long id, @Valid @RequestBody UpdateDeviceRequest req) {
            return ApiResponse.ok(service.update(id, req));
        }
    }
}
