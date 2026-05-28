package com.attendai.modules.account;

import com.attendai.common.exception.ApiException;
import com.attendai.common.response.ApiResponse;
import com.attendai.common.util.SecurityUtils;
import com.attendai.domain.user.Role;
import com.attendai.domain.user.User;
import com.attendai.domain.user.UserRepository;
import com.attendai.domain.user.UserStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * Self-service account endpoints under /api/me. Available to any authenticated
 * user (admin, teacher, student) — the security config lets /api/me/** through
 * for anyRequest().authenticated(). The current user is resolved from the JWT
 * via SecurityUtils, so there's no id in the path to tamper with.
 */
public class AccountModule {

    public record MeDto(Long id, String fullName, String email, Role role, UserStatus status) {
        public static MeDto from(User u) {
            return new MeDto(u.getId(), u.getFullName(), u.getEmail(), u.getRole(), u.getStatus());
        }
    }

    public record UpdateProfileRequest(@NotBlank @Size(max = 120) String fullName) {}

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 128) String newPassword
    ) {}

    @Service
    @RequiredArgsConstructor
    public static class AccountService {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;

        @Transactional(readOnly = true)
        public MeDto me() {
            return MeDto.from(load());
        }

        @Transactional
        public MeDto updateProfile(UpdateProfileRequest req) {
            User u = load();
            u.setFullName(req.fullName());
            return MeDto.from(userRepository.save(u));
        }

        @Transactional
        public void changePassword(ChangePasswordRequest req) {
            User u = load();
            if (!passwordEncoder.matches(req.currentPassword(), u.getPasswordHash())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "AUTH_008", "Current password is incorrect");
            }
            u.setPasswordHash(passwordEncoder.encode(req.newPassword()));
            userRepository.save(u);
        }

        private User load() {
            Long id = SecurityUtils.currentUserId();
            return userRepository.findById(id)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
        }
    }

    @RestController
    @RequestMapping("/api/me")
    @RequiredArgsConstructor
    @Tag(name = "Account", description = "Self-service profile and password")
    public static class AccountController {

        private final AccountService service;

        @GetMapping
        @Operation(summary = "Get my profile")
        public ApiResponse<MeDto> me() {
            return ApiResponse.ok(service.me());
        }

        @PutMapping
        @Operation(summary = "Update my profile (full name)")
        public ApiResponse<MeDto> update(@Valid @RequestBody UpdateProfileRequest req) {
            return ApiResponse.ok(service.updateProfile(req));
        }

        @PostMapping("/change-password")
        @Operation(summary = "Change my password")
        public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
            service.changePassword(req);
            return ApiResponse.success("Password changed");
        }
    }
}
